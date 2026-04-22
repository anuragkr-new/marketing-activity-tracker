import { appendFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
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
let viteResolved = null;
try {
  viteResolved = require.resolve('vite/package.json');
} catch (e) {
  viteResolved = null;
}

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
    vitePackageJson: viteResolved,
  },
});

const distDir = join(__dirname, 'dist');
emit({
  hypothesisId: 'H2',
  location: 'debug-start.mjs:dist',
  message: 'dist check',
  data: { distExists: existsSync(distDir), distIndex: existsSync(join(distDir, 'index.html')) },
});

if (!viteResolved) {
  emit({
    hypothesisId: 'H1',
    location: 'debug-start.mjs:abort',
    message: 'vite not resolvable — likely devDependencies omitted',
    data: {},
  });
  process.exit(1);
}

const viteBin = join(viteResolved, '..', 'bin', 'vite.js');
const child = spawn(process.execPath, [viteBin, 'preview'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: process.env,
});

child.on('error', (err) => {
  emit({
    hypothesisId: 'H1',
    location: 'debug-start.mjs:spawn-error',
    message: 'failed to spawn vite preview',
    data: { err: String(err?.message || err) },
  });
  process.exit(1);
});

child.on('exit', (code, signal) => {
  emit({
    hypothesisId: 'H3',
    location: 'debug-start.mjs:exit',
    message: 'vite preview process exited',
    data: { code, signal: signal || null },
  });
  process.exit(code ?? 1);
});
