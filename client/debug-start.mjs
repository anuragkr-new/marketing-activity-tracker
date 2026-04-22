import { appendFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// #region agent log
const DEBUG_LOG =
  '/Users/anurag/Documents/Cursor Files/spyne-activity-tracker/.cursor/debug-d02cd3.log';
const SESSION = 'd02cd3';
const INGEST =
  'http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf';

function emit(payload) {
  const line = JSON.stringify({
    sessionId: SESSION,
    timestamp: Date.now(),
    ...payload,
  });
  try {
    appendFileSync(DEBUG_LOG, `${line}\n`);
  } catch {
    // Railway / Linux: path missing — still try ingest + stderr
  }
  fetch(INGEST, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': SESSION,
    },
    body: line,
  }).catch(() => {});
  console.error('__AGENT_DEBUG__', line);
}
// #endregion

const require = createRequire(import.meta.url);
const port = process.env.PORT || '3000';
const distDir = join(__dirname, 'dist');

emit({
  hypothesisId: 'H1',
  location: 'debug-start.mjs:bootstrap',
  message: 'client start wrapper invoked',
  data: {
    cwd: process.cwd(),
    dirname: __dirname,
    PORT: process.env.PORT || null,
    NODE_ENV: process.env.NODE_ENV || null,
    RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || null,
    mode: 'serve-static',
  },
});

emit({
  hypothesisId: 'H2',
  location: 'debug-start.mjs:dist',
  message: 'dist check',
  data: { distExists: existsSync(distDir), distIndex: existsSync(join(distDir, 'index.html')) },
});

if (!existsSync(join(distDir, 'index.html'))) {
  emit({
    hypothesisId: 'H2',
    location: 'debug-start.mjs:abort',
    message: 'dist/index.html missing — run build first',
    data: {},
  });
  process.exit(1);
}

let serveMain;
try {
  serveMain = require.resolve('serve/build/main.js');
} catch (e) {
  emit({
    hypothesisId: 'H1',
    location: 'debug-start.mjs:serve-resolve',
    message: 'serve package not resolvable',
    data: { err: String(e?.message || e) },
  });
  process.exit(1);
}

emit({
  hypothesisId: 'H8',
  location: 'debug-start.mjs:serve',
  message: 'spawning serve for dist',
  data: { serveMain, listen: `tcp://0.0.0.0:${port}` },
});

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
  emit({
    hypothesisId: 'H1',
    location: 'debug-start.mjs:spawn-error',
    message: 'failed to spawn serve',
    data: { err: String(err?.message || err) },
  });
  process.exit(1);
});

child.on('exit', (code, signal) => {
  emit({
    hypothesisId: 'H3',
    location: 'debug-start.mjs:exit',
    message: 'serve process exited',
    data: { code, signal: signal || null },
  });
  process.exit(code ?? 1);
});
