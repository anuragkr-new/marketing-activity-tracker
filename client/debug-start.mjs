import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const port = process.env.PORT || '3000';
const distDir = join(__dirname, 'dist');

// #region agent log
const distIndex = join(distDir, 'index.html');
const distExists = existsSync(distIndex);
console.error(
  '[AGENT_DEBUG]',
  JSON.stringify({
    sessionId: 'a9573c',
    hypothesisId: 'H3',
    location: 'client/debug-start.mjs:boot',
    message: 'client_static_server_entry',
    data: {
      distExists,
      cwd: process.cwd(),
      dirname: __dirname,
      port: String(port),
    },
    timestamp: Date.now(),
  })
);
fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'a9573c' },
  body: JSON.stringify({
    sessionId: 'a9573c',
    hypothesisId: 'H3',
    location: 'client/debug-start.mjs:boot',
    message: 'client_static_server_entry',
    data: { distExists, cwd: process.cwd(), port: String(port) },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

if (!existsSync(join(distDir, 'index.html'))) {
  console.error('dist/index.html missing — run build first');
  process.exit(1);
}

let serveMain;
try {
  serveMain = require.resolve('serve/build/main.js');
} catch (e) {
  console.error('serve package not resolvable:', e?.message || e);
  process.exit(1);
}

const child = spawn(
  process.execPath,
  [serveMain, '-s', 'dist', '-l', `tcp://0.0.0.0:${port}`],
  {
    stdio: 'inherit',
    cwd: __dirname,
    env: process.env,
  }
);

child.on('error', (err) => {
  console.error('failed to spawn serve:', err?.message || err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  process.exit(code ?? 1);
});
