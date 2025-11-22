// Poll /api/ping until the app is ready, then POST a test session to /api/sessions
// Uses built-in fetch (Node 18+) and tries common Next ports (3000, 3001).

const fetch = globalThis.fetch;

async function waitForPing(url, attempts = 20, delayMs = 1000) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {}
    await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}

async function main() {
  const bases = ['http://localhost:3000', 'http://localhost:3001'];
  let base = null;
  for (const b of bases) {
    console.log('Waiting for app to respond at', b + '/api/ping');
    // try each base for a short while
    const ready = await waitForPing(b + '/api/ping', 8, 1000);
    if (ready) { base = b; break; }
  }
  if (!base) {
    console.error('App did not become ready on ports 3000 or 3001');
    process.exit(1);
  }
  console.log('App ready at', base, '— posting test session to /api/sessions');
  try {
    const res = await fetch(base + '/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'test session from script', transcript: 'hello world', startedAt: new Date().toISOString(), endedAt: new Date().toISOString() })
    });
    const json = await res.json();
    console.log('Response status:', res.status);
    console.log('Response body:', JSON.stringify(json, null, 2));
    if (!json.ok) process.exitCode = 1;
  } catch (err) {
    console.error('Request failed:', err && err.message ? err.message : err);
    process.exitCode = 1;
  }
}

main();
