require('dotenv').config();
const fs = require('fs');
const fetch = globalThis.fetch || require('node-fetch');
const os = require('os');
const path = require('path');
const child_process = require('child_process');

function extractKeywords(text, maxKeywords = 8) {
  if (!text) return [];
  const stop = new Set(['the','and','is','in','it','of','to','a','for','that','on','with','as','are','this','be','or','an','by','from','at','was','were','which','have','has','but','not']);
  const cleaned = String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const parts = cleaned.split(/\s+/).filter(Boolean).filter(w => w.length > 2 && !stop.has(w));
  const freq = {};
  for (const p of parts) freq[p] = (freq[p] || 0) + 1;
  const keys = Object.keys(freq).sort((a,b) => freq[b] - freq[a]);
  return keys.slice(0, maxKeywords);
}

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

function getSummarizerUrl() {
  return process.env.GEMINI_API_URL || 'https://api.openai.com/v1/chat/completions';
}

console.log('server/gemini.js loaded. GEMINI_API_KEY present at load:', !!getApiKey(), 'summarizerUrl=', getSummarizerUrl());

module.exports.transcribeAudioBuffer = async function transcribeAudioBuffer(/* buffer, sessionId */) {
  return null;
};

module.exports.transcribeAudioChunks = async function transcribeAudioChunks(chunkPaths, socketEmitter) {
  // Use AssemblyAI exclusively (better WebM support + speaker diarization)
  const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || '';
  
  if (!ASSEMBLYAI_API_KEY) {
    console.log('No AssemblyAI API key found.');
    console.log('Get free AssemblyAI key (100 hours/month) at https://www.assemblyai.com/dashboard/signup');
    return '';
  }

  return await transcribeWithAssemblyAI(chunkPaths, ASSEMBLYAI_API_KEY, socketEmitter);
};

async function transcribeWithAssemblyAI(chunkPaths, apiKey, socketEmitter = null) {
  try {
    console.log(`Starting transcription for ${chunkPaths.length} audio chunks using AssemblyAI with speaker diarization...`);
    
    let fullTranscript = '';
    let allUtterances = []; // Store speaker-labeled utterances
    
    for (let i = 0; i < chunkPaths.length; i++) {
      const chunkPath = chunkPaths[i];
      console.log(`Transcribing chunk ${i + 1}/${chunkPaths.length}: ${chunkPath}`);
      
      try {
        const audioBuffer = fs.readFileSync(chunkPath);
        
        // Upload audio file
        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
          method: 'POST',
          headers: {
            'authorization': apiKey,
            'Content-Type': 'application/octet-stream'
          },
          body: audioBuffer
        });
        
        const uploadData = await uploadResponse.json();
        
        if (!uploadData.upload_url) {
          console.warn(`Failed to upload chunk ${i}`);
          continue;
        }
        
        // Submit transcription request with speaker diarization enabled
        const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
          method: 'POST',
          headers: {
            'authorization': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            audio_url: uploadData.upload_url,
            speaker_labels: true, // Enable speaker diarization
            punctuate: true,
            format_text: true
          })
        });
        
        const transcriptData = await transcriptResponse.json();
        const transcriptId = transcriptData.id;
        
        // Poll for completion
        let result = null;
        for (let attempt = 0; attempt < 60; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const resultResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
            headers: { 'authorization': apiKey }
          });
          
          result = await resultResponse.json();
          
          if (result.status === 'completed') {
            break;
          } else if (result.status === 'error') {
            console.warn(`AssemblyAI error for chunk ${i}:`, result.error);
            break;
          }
        }
        
        if (result && result.status === 'completed') {
          let chunkText = '';
          
          // Check if we have speaker-labeled utterances
          if (result.utterances && result.utterances.length > 0) {
            // Format with speaker labels
            for (const utterance of result.utterances) {
              const speaker = utterance.speaker ? `Speaker ${utterance.speaker}` : 'Speaker';
              const text = utterance.text || '';
              if (text.trim()) {
                chunkText += `${speaker}: ${text}\n`;
                allUtterances.push({ speaker, text });
              }
            }
            console.log(`Chunk ${i + 1} transcribed with ${result.utterances.length} speaker segments`);
          } else {
            // Fallback to regular transcript
            chunkText = result.text || '';
          }
          
          if (chunkText && chunkText.trim()) {
            fullTranscript += chunkText.trim() + '\n';
            console.log(`Chunk ${i + 1} transcribed: ${chunkText.slice(0, 100)}...`);
            
            // Emit partial transcript immediately for real-time display
            if (socketEmitter && typeof socketEmitter === 'function') {
              socketEmitter(fullTranscript.trim(), i + 1);
            }
          }
        }
        
      } catch (chunkError) {
        console.warn(`Failed to transcribe chunk ${i}:`, chunkError.message);
      }
    }
    
    const finalTranscript = fullTranscript.trim();
    console.log(`Transcription complete with speaker diarization! Total length: ${finalTranscript.length} characters, ${allUtterances.length} utterances`);
    return finalTranscript;
    
  } catch (error) {
    console.error('AssemblyAI transcription error:', error);
    return '';
  }
}

async function transcribeWithDeepgram(chunkPaths, apiKey, socketEmitter = null) {
  try {
    console.log(`Starting transcription for ${chunkPaths.length} audio chunks using Deepgram API with speaker diarization...`);
    
    let fullTranscript = '';
    let allUtterances = []; // Store speaker-labeled utterances
    
    for (let i = 0; i < chunkPaths.length; i++) {
      const chunkPath = chunkPaths[i];
      console.log(`Transcribing chunk ${i + 1}/${chunkPaths.length}: ${chunkPath}`);
      
      try {
        const audioBuffer = fs.readFileSync(chunkPath);
        
        // Enable diarization to identify different speakers
        const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true&punctuate=true', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${apiKey}`,
          },
          body: audioBuffer
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Deepgram API error for chunk ${i}:`, errorText);
          continue;
        }

        const result = await response.json();
        let chunkText = '';
        
        if (result && result.results && result.results.channels && result.results.channels[0]) {
          const alternatives = result.results.channels[0].alternatives;
          if (alternatives && alternatives[0]) {
            // Extract diarized words with speaker labels
            const words = alternatives[0].words || [];
            if (words.length > 0) {
              // Group words by speaker
              let currentSpeaker = null;
              let currentText = '';
              
              for (const word of words) {
                const speaker = word.speaker !== undefined ? `Speaker ${word.speaker}` : null;
                
                if (speaker && speaker !== currentSpeaker) {
                  // Save previous speaker's text
                  if (currentSpeaker && currentText.trim()) {
                    const utterance = `${currentSpeaker}: ${currentText.trim()}`;
                    allUtterances.push({ speaker: currentSpeaker, text: currentText.trim() });
                    chunkText += utterance + '\n';
                  }
                  // Start new speaker
                  currentSpeaker = speaker;
                  currentText = word.word || word.punctuated_word || '';
                } else {
                  currentText += ' ' + (word.word || word.punctuated_word || '');
                }
              }
              
              // Add final speaker's text
              if (currentSpeaker && currentText.trim()) {
                const utterance = `${currentSpeaker}: ${currentText.trim()}`;
                allUtterances.push({ speaker: currentSpeaker, text: currentText.trim() });
                chunkText += utterance + '\n';
              }
            } else {
              // Fallback to regular transcript if no words array
              chunkText = alternatives[0].transcript || '';
            }
          }
        }

        if (chunkText && chunkText.trim()) {
          fullTranscript += chunkText.trim() + '\n';
          console.log(`Chunk ${i + 1} transcribed with speakers: ${chunkText.slice(0, 100)}...`);
          
          // Emit partial transcript immediately for real-time display
          if (socketEmitter && typeof socketEmitter === 'function') {
            socketEmitter(fullTranscript.trim(), i + 1);
          }
        } else {
          console.log(`Chunk ${i + 1} returned empty transcript`);
        }
        
      } catch (chunkError) {
        console.warn(`Failed to transcribe chunk ${i}:`, chunkError.message);
      }
    }

    const finalTranscript = fullTranscript.trim();
    console.log(`Transcription complete with speaker diarization! Total length: ${finalTranscript.length} characters, ${allUtterances.length} utterances`);
    return finalTranscript;
    
  } catch (error) {
    console.error('Deepgram transcription error:', error);
    return '';
  }
}

module.exports.generateSummary = async function generateSummary(fullTranscript) {
  const API_KEY = getApiKey();
  if (!API_KEY) {
    await new Promise((r) => setTimeout(r, 200));
    return { title: '', bullets: [], text: `(placeholder) summary: ${fullTranscript.slice(0, 160)}`, keywords: extractKeywords(fullTranscript, 6), actionItems: [] };
  }

    try {
      const prompt = `You are ScribeAI. Analyze the following transcript and extract:
1. A concise title (one line)
2. Key bullet points (3-6 short summaries)
3. Action items with type classification:
   - TASK: Things that need to be done (e.g., "John will send the report by Friday")
   - DECISION: Decisions that were made (e.g., "Approved budget increase of 10%")
   - QUESTION: Important questions raised (e.g., "How do we handle edge cases?")

For each action item, extract:
- description: What needs to be done/decided/answered
- assignee: Person's name if mentioned (or null)
- deadline: Deadline if mentioned (or null)

Output MUST be valid JSON:
{
  "title": "Meeting Title",
  "bullets": ["summary point 1", "point 2"],
  "actionItems": [
    {"type": "TASK", "description": "Send report", "assignee": "John", "deadline": "Friday"},
    {"type": "DECISION", "description": "Approved budget", "assignee": null, "deadline": null}
  ]
}

Transcript:
${fullTranscript}`;

    const body = {
      model: process.env.GEMINI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that summarizes meeting transcripts into a JSON object with a title and 3-6 short bullet points.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.1
    };

    // If the API key looks like a Google API key or provider is explicitly set to google,
    // call Google's Generative Language API (AI Studio / Vertex) using the API key in the query string if possible.
    const isGoogle = (process.env.GEMINI_PROVIDER === 'google') || String(API_KEY).startsWith('AIza');
    if (isGoogle) {

      const model = process.env.GEMINI_MODEL || process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.5-flash';
      try {
        const genai = await import('@google/genai');
        const GoogleGenAI = genai.GoogleGenAI || (genai.default && genai.default.GoogleGenAI);
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        
        // Use the correct API format for Google GenAI SDK
        const result = await ai.models.generateContent({
          model,
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
          }]
        });

        // Extract text from the response
        let out = '';
        try {
          // The response structure is: result.response.text()
          if (result && result.response) {
            out = await result.response.text();
          } else if (result && typeof result.text === 'function') {
            out = await result.text();
          } else if (result && typeof result.text === 'string') {
            out = result.text;
          } else {
            // Fallback: try to extract from candidates
            if (result && result.candidates && result.candidates[0]) {
              const candidate = result.candidates[0];
              if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
                out = candidate.content.parts[0].text || '';
              }
            }
          }
        } catch (e) {
          console.warn('Error extracting text from Gemini response:', e);
          out = JSON.stringify(result);
        }

        const raw = String(out).trim();
        try {
          const firstBrace = raw.indexOf('{');
          const lastBrace = raw.lastIndexOf('}');
          const candidate = firstBrace !== -1 && lastBrace !== -1 ? raw.slice(firstBrace, lastBrace + 1) : raw;
          const parsed = JSON.parse(candidate);
          const title = parsed.title || parsed.name || '';
          const bullets = Array.isArray(parsed.bullets) ? parsed.bullets : (parsed.points || []);
          const actionItems = Array.isArray(parsed.actionItems) ? parsed.actionItems : [];
          const sb = [];
          if (title) sb.push(`Title: ${title}`);
          if (bullets && bullets.length) {
            sb.push('Bullets:');
            for (const b of bullets) sb.push(`- ${String(b)}`);
          }
          if (actionItems && actionItems.length) {
            sb.push('\nAction Items:');
            for (const item of actionItems) {
              const typeLabel = item.type || 'TASK';
              const assigneePart = item.assignee ? ` (@${item.assignee})` : '';
              const deadlinePart = item.deadline ? ` [Due: ${item.deadline}]` : '';
              sb.push(`${typeLabel}: ${item.description}${assigneePart}${deadlinePart}`);
            }
          }
          return { title, bullets, text: sb.join('\n'), keywords: extractKeywords(fullTranscript, 6), actionItems };
        } catch (e) {
          return { title: '', bullets: [], text: raw, keywords: extractKeywords(fullTranscript, 6), actionItems: [] };
        }
      } catch (err) {
        console.error('Google GenAI SDK call failed', err && err.message ? err.message : err);
        throw err;
      }
    }

    // Otherwise fall back to OpenAI-compatible endpoint
    const SUMMARIZER_URL = getSummarizerUrl();
    console.log('generateSummary: using summarizer url=', SUMMARIZER_URL, 'API key present=', !!API_KEY);
    const res = await fetch(SUMMARIZER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }
    if (!res.ok) {
      console.error('Summarizer returned non-ok:', res.status, res.statusText, 'body:', text);
      throw new Error(`Summarizer API error: ${res.status}`);
    }

    // Try to parse OpenAI-style chat/completions response
    if (json && json.choices && json.choices[0] && (json.choices[0].message || json.choices[0].text)) {
      const content = json.choices[0].message ? json.choices[0].message.content : json.choices[0].text;
      const raw2 = String(content).trim();
      try {
        const firstBrace = raw2.indexOf('{');
        const lastBrace = raw2.lastIndexOf('}');
        const candidate = firstBrace !== -1 && lastBrace !== -1 ? raw2.slice(firstBrace, lastBrace + 1) : raw2;
        const parsed = JSON.parse(candidate);
        const title = parsed.title || parsed.name || '';
        const bullets = Array.isArray(parsed.bullets) ? parsed.bullets : (parsed.points || []);
        const actionItems = Array.isArray(parsed.actionItems) ? parsed.actionItems : [];
        const sb = [];
        if (title) sb.push(`Title: ${title}`);
        if (bullets && bullets.length) {
          sb.push('Bullets:');
          for (const b of bullets) sb.push(`- ${String(b)}`);
        }
        if (actionItems && actionItems.length) {
          sb.push('\nAction Items:');
          for (const item of actionItems) {
            const typeLabel = item.type || 'TASK';
            const assigneePart = item.assignee ? ` (@${item.assignee})` : '';
            const deadlinePart = item.deadline ? ` [Due: ${item.deadline}]` : '';
            sb.push(`${typeLabel}: ${item.description}${assigneePart}${deadlinePart}`);
          }
        }
        return { title, bullets, text: sb.join('\n'), keywords: extractKeywords(fullTranscript, 6), actionItems };
      } catch (e) {
        return { title: '', bullets: [], text: raw2, keywords: extractKeywords(fullTranscript, 6), actionItems: [] };
      }
    }

    return { title: '', bullets: [], text: fullTranscript.slice(0, 400) + (fullTranscript.length > 400 ? '...' : ''), keywords: extractKeywords(fullTranscript, 6), actionItems: [] };
  } catch (err) {
    console.error('generateSummary error', err && err.message ? err.message : err);
    return { title: '', bullets: [], text: `(error generating summary: ${err && err.message ? err.message : String(err)})`, keywords: extractKeywords(fullTranscript, 6), actionItems: [] };
  }
};
