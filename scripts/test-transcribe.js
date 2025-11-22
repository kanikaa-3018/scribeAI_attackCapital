#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

async function findLatestRecording() {
  const recordingsRoot = path.resolve(process.cwd(), 'recordings');
  if (!fs.existsSync(recordingsRoot)) return null;
  const sessions = fs.readdirSync(recordingsRoot).map(s => path.join(recordingsRoot, s));
  let latest = null;
  let latestMtime = 0;
  for (const s of sessions) {
    if (!fs.existsSync(s)) continue;
    const files = fs.readdirSync(s).map(f => path.join(s, f));
    for (const f of files) {
      try {
        const st = fs.statSync(f);
        if (st.mtimeMs > latestMtime) {
          latestMtime = st.mtimeMs;
          latest = f;
        }
      } catch (e) {}
    }
  }
  return latest;
}

async function main() {
  const arg = process.argv[2];
  let file = arg;
  if (!file) {
    console.log('No file provided, searching recordings/ for latest file...');
    file = await findLatestRecording();
    if (!file) {
      console.error('No recording files found under ./recordings. Please provide a path to a .webm file.');
      process.exit(2);
    }
    console.log('Found latest recording:', file);
  }

  if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    process.exit(2);
  }

  console.log('Loading transcriber helper...');
  const mod = await import('../server/gemini.js');
  const transcribe = mod.transcribeAudioBuffer;
  if (!transcribe) {
    console.error('transcribeAudioBuffer not exported from server/gemini.js');
    process.exit(3);
  }

  const buf = await fs.promises.readFile(file);
  console.log('Calling transcribeAudioBuffer for', path.basename(file), 'size', buf.length);
  try {
    const result = await transcribe(buf, 'test-run');
    console.log('Transcription result:');
    console.log('---');
    console.log(result);
    console.log('---');
  } catch (err) {
    console.error('Transcription call failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
