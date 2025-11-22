import fs from "fs";

export async function transcribeAudioChunk(audioChunk: Buffer, sessionId: string): Promise<string> {
  // Lightweight placeholder transcription implementation.
  await new Promise((r) => setTimeout(r, 200));
  return "Transcription placeholder for session " + sessionId;
}

function extractKeywords(text: string, maxKeywords = 8) {
  if (!text) return [];
  const stop = new Set([
    'the','and','is','in','it','of','to','a','for','that','on','with','as','are','this','be','or','an','by','from','at','was','were','which','have','has','but','not'
  ]);
  const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const parts = cleaned.split(/\s+/).filter(Boolean).filter(w => w.length > 2 && !stop.has(w));
  const freq: Record<string, number> = {};
  for (const p of parts) freq[p] = (freq[p] || 0) + 1;
  const keys = Object.keys(freq).sort((a,b) => freq[b] - freq[a]);
  return keys.slice(0, maxKeywords);
}

export async function generateSummary(fullTranscript: string) {
  // Simulate async processing and produce a structured object the server expects.
  await new Promise((r) => setTimeout(r, 300));
  const preview = String(fullTranscript || '').slice(0, 400);
  const title = preview ? preview.split('\n')[0].slice(0, 80) : 'Untitled session summary';
  const text = `Summary placeholder for transcript excerpt: ${preview}`;
  const keywords = extractKeywords(fullTranscript || '', 6);
  return { title, text, keywords };
}

// Export alias expected by some server modules
export const transcribeAudioBuffer = transcribeAudioChunk;
