import { Server, Socket } from "socket.io";
import fs from 'fs';
import path from 'path';
import { generateSummary } from '../gemini.js';

// Use CommonJS-compatible __dirname (tsconfig.server.json uses "module": "CommonJS")
// Point to project root recordings folder, not dist
const recordingsRoot = path.resolve(__dirname, '..', '..', '..', 'recordings');
if (!fs.existsSync(recordingsRoot)) fs.mkdirSync(recordingsRoot, { recursive: true });

export default function registerRecordingHandlers(io: Server) {
  const sessions = new Map<string, { dir: string; chunks: string[] }>();
  const socketSession = new Map<string, string>();

  io.on("connection", (socket: Socket) => {
    // Emit a welcome event that clients can display as a placeholder
    socket.emit("welcome", { message: "Welcome from Socket Server — real-time transcript will appear here." });

    socket.on("ping", () => {
      socket.emit("pong");
    });

    socket.on("startSession", (sessionId: string) => {
      const dir = path.join(recordingsRoot, sessionId);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      sessions.set(sessionId, { dir, chunks: [] });
      socketSession.set(socket.id, sessionId);
      // @ts-ignore
      (socket as any).data = (socket as any).data || {};
      // @ts-ignore
      (socket as any).data.sessionId = sessionId;
      socket.emit('statusChange', { status: 'RECORDING' });
      console.log(`Started session ${sessionId}, recordings dir: ${dir}`);
    });

    socket.on("audioChunk", async (sessionId: string, chunk: ArrayBuffer, sequence: number) => {
      try {
        const buf = Buffer.from(chunk);
        // Resolve sessionId: prefer explicit, else socket-bound
        let sid = sessionId;
        // @ts-ignore
        const socketData = (socket as any).data || {};
        if (!sid || !sessions.has(sid)) {
          sid = socketData && socketData.sessionId ? socketData.sessionId : socketSession.get(socket.id) as string;
        }
        if (!sid) sid = `session-${Date.now()}`;
        const info = sessions.get(sid) || { dir: path.join(recordingsRoot, sid), chunks: [] };
        if (!fs.existsSync(info.dir)) fs.mkdirSync(info.dir, { recursive: true });
        const filename = path.join(info.dir, `${sequence}.webm`);
        await fs.promises.writeFile(filename, buf);
        info.chunks.push(filename);
        sessions.set(sid, info);
        socketSession.set(socket.id, sid);
        // @ts-ignore
        (socket as any).data = (socket as any).data || {};
        // @ts-ignore
        (socket as any).data.sessionId = sid;
        
        console.log(`Saved chunk ${sequence} for session ${sid}, size ${buf.length} -> ${filename}`);
        
        // Real-time transcription for tab audio - transcribe each chunk as it arrives
        // Only if we have AssemblyAI/Deepgram API keys configured
        const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || '';
        const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
        
        // Only transcribe if chunk has meaningful data (> 1KB) to avoid wasting API calls
        if (DEEPGRAM_API_KEY && buf.length > 1000) {
          try {
            // Use Deepgram directly for fastest real-time transcription (< 1 second typically)
            const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true', {
              method: 'POST',
              headers: {
                'Authorization': `Token ${DEEPGRAM_API_KEY}`,
                'Content-Type': 'audio/webm'
              },
              body: buf
            });

            if (response.ok) {
              const result = await response.json();
              let chunkText = '';
              
              if (result && result.results && result.results.channels && result.results.channels[0]) {
                const alternatives = result.results.channels[0].alternatives;
                if (alternatives && alternatives[0]) {
                  chunkText = alternatives[0].transcript || '';
                }
              }

              if (chunkText && chunkText.trim()) {
                socket.emit('transcriptUpdate', { text: chunkText, isChunk: true, sequence });
                console.log(`✅ Real-time chunk ${sequence} transcribed (${chunkText.length} chars): ${chunkText.slice(0, 80)}...`);
              }
            } else {
              console.warn(`Deepgram error for chunk ${sequence}:`, await response.text());
            }
          } catch (transcribeError) {
            console.warn(`Real-time transcription failed for chunk ${sequence}:`, transcribeError);
          }
        } else if (ASSEMBLYAI_API_KEY && buf.length > 1000 && !DEEPGRAM_API_KEY) {
          // Fallback to AssemblyAI if no Deepgram key (slower but still works)
          try {
            const { transcribeAudioChunks } = await import('../gemini.js');
            const emitter = (partialTranscript: string, chunkNum: number) => {
              socket.emit('transcriptUpdate', { text: partialTranscript, isChunk: true, sequence: chunkNum });
            };
            const chunkTranscript = await transcribeAudioChunks([filename], emitter);
            
            if (chunkTranscript && chunkTranscript.trim()) {
              socket.emit('transcriptUpdate', { text: chunkTranscript, isChunk: true, sequence });
              console.log(`Real-time transcription for chunk ${sequence}: ${chunkTranscript.slice(0, 100)}...`);
            }
          } catch (transcribeError) {
            console.warn(`Real-time transcription failed for chunk ${sequence}:`, transcribeError);
          }
        }
      } catch (err) {
        console.error('Failed saving audio chunk', err);
        socket.emit('statusChange', { status: 'ERROR' });
      }
    });

    socket.on("stopSession", async (sessionId: string, clientTranscript?: string, ownerEmail?: string) => {
      socket.emit('statusChange', { status: 'PROCESSING' });
      // Resolve session id if needed
      let sid = sessionId;
      // @ts-ignore
      const socketData = (socket as any).data || {};
      if (!sid || !sessions.has(sid)) sid = socketData && socketData.sessionId ? socketData.sessionId : socketSession.get(socket.id) as string;
      const info = sessions.get(sid as string);
      console.log(`Stopping session ${sid}. ${info ? info.chunks.length : 0} chunks recorded. clientTranscriptLength=${clientTranscript ? String(clientTranscript).length : 0}`);
      try {
        // If there are no saved chunks but the client provided a transcript,
        // still proceed to generate a summary and persist the session using the client transcript.
        if (!info || !info.chunks || info.chunks.length === 0) {
          if (clientTranscript && String(clientTranscript).trim()) {
            // proceed but set fullTranscript from clientTranscript below
          } else {
            socket.emit('statusChange', { status: 'COMPLETED' });
            return;
          }
        }

        // Sort chunk filenames numerically by sequence
        const list = (info && info.chunks ? info.chunks.slice() : []).sort((a,b)=>{
          const na = Number(path.basename(a, path.extname(a))); const nb = Number(path.basename(b, path.extname(b))); return na - nb;
        });

        // If client provided a transcript (from the browser SpeechRecognition), prefer it — free and immediate.
        let fullTranscript = '';
        if (clientTranscript && String(clientTranscript).trim()) {
          fullTranscript = String(clientTranscript).trim();
          console.log('Using client-provided transcript, length=', fullTranscript.length);
          // Emit client transcript as a final update
          socket.emit('transcriptUpdate', { text: fullTranscript });
        } else if (list.length > 0) {
          // No client transcript (tab audio) - use Deepgram API for server-side transcription
          console.log(`No client transcript. Attempting server-side transcription for ${list.length} chunks using AssemblyAI/Deepgram...`);
          try {
            const { transcribeAudioChunks } = await import('../gemini.js');
            // Pass emitter function to get real-time updates as each chunk completes
            const emitter = (partialTranscript: string, chunkNum: number) => {
              console.log(`Emitting partial transcript (chunk ${chunkNum}/${list.length}): ${partialTranscript.length} chars`);
              socket.emit('transcriptUpdate', { text: partialTranscript, isChunk: true, sequence: chunkNum });
            };
            fullTranscript = await transcribeAudioChunks(list, emitter);
            console.log('Server transcription completed, length=', fullTranscript.length);
            socket.emit('transcriptUpdate', { text: fullTranscript });
          } catch (transcribeError) {
            console.warn('Server-side transcription failed:', transcribeError);
            fullTranscript = '';
          }
        }

        const summaryObj: any = await generateSummary(fullTranscript || '');
        // Normalize structured summary: { title, text, keywords }
        const summaryText = summaryObj && typeof summaryObj === 'object' ? (summaryObj.text || '') : String(summaryObj || '');
        const summaryTitle = summaryObj && typeof summaryObj === 'object' ? (summaryObj.title || '') : '';
        const summaryKeywords = summaryObj && typeof summaryObj === 'object' && Array.isArray(summaryObj.keywords) ? summaryObj.keywords : [];

        // Write transcript file so it can be downloaded later
        let downloadUrl: string | null = null;
        try {
          const transcriptFilename = 'transcript.txt';
          const infoDir = (info && info.dir) ? info.dir : path.join(recordingsRoot, String(sid));
          if (!fs.existsSync(infoDir)) fs.mkdirSync(infoDir, { recursive: true });

          // Compute public download URL from configurable base (used in metadata)
          const basePublic = process.env.SOCKET_PUBLIC_URL || `http://localhost:${process.env.SOCKET_PORT || 4000}`;
          downloadUrl = `${basePublic.replace(/\/$/, '')}/recordings/${sid}/transcript.txt`;
          
          // Also compute audio URL for the Next.js API
          const audioUrl = `http://localhost:3000/api/sessions/${sid}/audio`;

          const transcriptPath = path.join(infoDir, transcriptFilename);
          fs.writeFileSync(transcriptPath, fullTranscript || '');
          // write metadata (title, keywords, downloadUrl, audioUrl) so other services can pick it up
          try {
            const meta = { title: summaryTitle || `Session ${sid}`, keywords: summaryKeywords || [], downloadUrl, audioUrl };
            const metaPath = path.join(infoDir, 'metadata.json');
            fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
          } catch (me) {
            console.warn('Failed writing metadata.json for session', sid, me && (me as any).message ? (me as any).message : me);
          }
        } catch (e) {
          console.warn('Could not write transcript file for session', sid, e && (e as any).message ? (e as any).message : e);
        }

        // Print summary and transcript preview to server console for immediate inspection
        try {
          console.log(`Generated summary for session ${sid}:\n${String(summaryText).slice(0, 2000)}`);
          console.log(`Full transcript length=${String(fullTranscript).length} preview:\n${String(fullTranscript).slice(0,1200)}`);
        } catch (e) {
          console.warn('Error logging summary/transcript preview', e && (e as any).message ? (e as any).message : e);
        }

        // Attempt to persist via Next API
        try {
          const fetcher: any = globalThis.fetch || (await import('node-fetch')).default;
            const audioUrl = `http://localhost:3000/api/sessions/${sid}/audio`;
            const payload: any = {
              title: (summaryTitle && String(summaryTitle).trim()) ? String(summaryTitle).trim() : `Session ${sid}`,
              transcript: fullTranscript,
              summary: summaryText,
              keywords: summaryKeywords,
              startedAt: new Date().toISOString(),
              endedAt: new Date().toISOString(),
              clientSessionId: sid,
              downloadUrl,
              audioUrl,
            };
            if (ownerEmail && String(ownerEmail).trim()) payload.ownerEmail = String(ownerEmail).trim();
            const res = await fetcher('http://localhost:3000/api/sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            // Read response text for robust logging (may not be JSON if error)
            let rawBody = '';
            try {
              rawBody = await res.text();
              console.log('POST /api/sessions response status:', res.status, res.statusText);
              console.log('POST /api/sessions raw body:', rawBody);
            } catch (e) {
              console.warn('Unable to read response text from /api/sessions', e && (e as any).message ? (e as any).message : e);
            }

            let json = null as any;
            try {
              json = rawBody ? JSON.parse(rawBody) : null;
            } catch (e) {
              json = null;
            }

            if (!json || !json.ok) {
              console.error('Failed saving session via API; parsed JSON:', json, 'raw:', rawBody);
            } else {
              console.log('Saved session via API', json.session && json.session.id ? json.session.id : 'ok');
            }
            // Regardless of persistence result, emit sessionSaved so client receives the transcript and summary.
            try {
              const sessObj = (json && json.session) ? json.session : { id: sid, title: (summaryTitle && String(summaryTitle).trim()) ? String(summaryTitle).trim() : `Session ${sid}`, downloadUrl, keywords: summaryKeywords };
              socket.emit('sessionSaved', { session: sessObj, transcript: fullTranscript, summary: summaryText, downloadUrl, keywords: summaryKeywords });
              socket.emit('transcriptUpdate', { text: fullTranscript });
            } catch (e) {
              console.warn('Could not emit sessionSaved to socket', e && (e as any).message ? (e as any).message : e);
            }
        } catch (err) {
          console.error('Failed to POST session to Next API:', err && (err as any).message ? (err as any).message : err);
        }

        socket.emit('statusChange', { status: 'COMPLETED' });
      } catch (err) {
        console.error('Error during stopSession processing', err && (err as any).message ? (err as any).message : err);
        socket.emit('statusChange', { status: 'ERROR' });
      }
    });
  });
}
