import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transcribeAudioBuffer, generateSummary } from '../gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const recordingsRoot = path.resolve(__dirname, '..', '..', 'recordings');
if (!fs.existsSync(recordingsRoot)) fs.mkdirSync(recordingsRoot, { recursive: true });

export default function registerRecordingHandlers(io) {
  const sessions = new Map();
  const socketSession = new Map();

  io.on("connection", (socket) => {
    socket.emit("transcriptUpdate", { text: "Welcome from Socket Server — real-time transcript will appear here." });

    socket.on("ping", () => {
      socket.emit("pong");
    });

    socket.on("startSession", (sessionId) => {
      const dir = path.join(recordingsRoot, sessionId);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      sessions.set(sessionId, { dir, chunks: [] });
      socketSession.set(socket.id, sessionId);
      socket.data.sessionId = sessionId;
      socket.emit('statusChange', { status: 'RECORDING' });
      console.log(`Started session ${sessionId}, recordings dir: ${dir}`);
    });

    socket.on("audioChunk", async (sessionId, chunk, sequence) => {
      try {
        const buf = Buffer.from(chunk);
        // Resolve sessionId: prefer explicit, else socket-bound
        let sid = sessionId;
        if (!sid || !sessions.has(sid)) {
          sid = socket.data && socket.data.sessionId ? socket.data.sessionId : socketSession.get(socket.id);
        }
        if (!sid) sid = `session-${Date.now()}`;
        const info = sessions.get(sid) || { dir: path.join(recordingsRoot, sid), chunks: [] };
        if (!fs.existsSync(info.dir)) fs.mkdirSync(info.dir, { recursive: true });
        const filename = path.join(info.dir, `${sequence}.webm`);
        await fs.promises.writeFile(filename, buf);
        info.chunks.push(filename);
        sessions.set(sid, info);
        // ensure socket maps to this session id
        socketSession.set(socket.id, sid);
        socket.data.sessionId = sid;
        socket.emit("transcriptUpdate", { text: "Transcription Placeholder for sequence " + sequence });
        console.log(`Saved chunk ${sequence} for session ${sid}, size ${buf.length} -> ${filename}`);
      } catch (err) {
        console.error('Failed saving audio chunk', err);
        socket.emit('statusChange', { status: 'ERROR' });
      }
    });

    socket.on("stopSession", async (sessionId, clientTranscript, ownerEmail) => {
      socket.emit('statusChange', { status: 'PROCESSING' });
      // Resolve session id if needed
      let sid = sessionId;
      if (!sid || !sessions.has(sid)) sid = socket.data && socket.data.sessionId ? socket.data.sessionId : socketSession.get(socket.id);
      const info = sessions.get(sid);
      console.log(`Stopping session ${sid}. ${info ? info.chunks.length : 0} chunks recorded. clientTranscriptLength=${clientTranscript ? String(clientTranscript).length : 0}`);
      try {
        if (!info || !info.chunks || info.chunks.length === 0) {
          socket.emit('statusChange', { status: 'COMPLETED' });
          return;
        }

        // Sort chunk filenames numerically by sequence
        const list = info.chunks.slice().sort((a,b)=>{
          const na = Number(path.basename(a, path.extname(a))); const nb = Number(path.basename(b, path.extname(b))); return na - nb;
        });

        // If client provided a transcript (from the browser SpeechRecognition), prefer it — free and immediate.
        let fullTranscript = '';
        if (clientTranscript && String(clientTranscript).trim()) {
          fullTranscript = String(clientTranscript).trim();
          console.log('Using client-provided transcript, length=', fullTranscript.length);
          // Emit client transcript as a final update
          socket.emit('transcriptUpdate', { text: fullTranscript });
        } else {
          // Otherwise, transcribe chunks on server (may require API key)
          for (let i = 0; i < list.length; i++) {
            const file = list[i];
            try {
              const buf = await fs.promises.readFile(file);
              const part = (await transcribeAudioBuffer(buf, sid)) || '';
              const safePart = part && String(part).trim() ? part : '(no transcription)';
              fullTranscript += (fullTranscript ? '\n' : '') + safePart;
              console.log(`Transcribed chunk ${i + 1}/${list.length} (${path.basename(file)}): length=${String(safePart).length}`);
              socket.emit('transcriptUpdate', { text: safePart });
            } catch (err) {
              console.error('Error transcribing chunk', file, err && err.message ? err.message : err);
              socket.emit('transcriptUpdate', { text: '(error transcribing chunk)' });
            }
          }
        }

        const summary = await generateSummary(fullTranscript || '');
        // Print summary and transcript preview to server console for immediate inspection
        try {
          console.log(`Generated summary for session ${sid}:\n${String(summary).slice(0, 2000)}`);
          console.log(`Full transcript length=${String(fullTranscript).length} preview:\n${String(fullTranscript).slice(0,1200)}`);
        } catch (e) {
          console.warn('Error logging summary/transcript preview', e && e.message ? e.message : e);
        }

        // Attempt to persist via Next API
        try {
          const fetcher = globalThis.fetch || (await import('node-fetch')).default;
            const payload = { title: `Session ${sid}`, transcript: fullTranscript, summary, startedAt: new Date().toISOString(), endedAt: new Date().toISOString() };
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
              console.warn('Unable to read response text from /api/sessions', e && e.message ? e.message : e);
            }

            let json = null;
            try {
              json = rawBody ? JSON.parse(rawBody) : null;
            } catch (e) {
              json = null;
            }

            if (!json || !json.ok) {
              console.error('Failed saving session via API; parsed JSON:', json, 'raw:', rawBody);
            } else {
              console.log('Saved session via API', json.session && json.session.id ? json.session.id : 'ok');
              // notify the client that session was saved and include transcript/summary
              try {
                socket.emit('sessionSaved', { session: json.session, transcript: fullTranscript, summary });
                // also send the transcript explicitly
                socket.emit('transcriptUpdate', { text: fullTranscript });
              } catch (e) {
                console.warn('Could not emit sessionSaved to socket', e && e.message ? e.message : e);
              }
            }
        } catch (err) {
          console.error('Failed to POST session to Next API:', err && err.message ? err.message : err);
        }

        socket.emit('statusChange', { status: 'COMPLETED' });
      } catch (err) {
        console.error('Error during stopSession processing', err && err.message ? err.message : err);
        socket.emit('statusChange', { status: 'ERROR' });
      }
    });
  });
}
