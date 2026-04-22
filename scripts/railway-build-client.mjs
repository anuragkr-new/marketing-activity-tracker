/**
 * Nixpacks/Railway build entry: runs client Vite build with debug lines on stderr + local NDJSON.
 * Hypotheses: H1 env/cwd, H2 pre-dist state, H3 vite result, H4 post-dist state
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function emit(hypothesisId, message, data = {}) {
  const payload = {
    sessionId: 'a9573c',
    hypothesisId,
    location: 'scripts/railway-build-client.mjs',
    message,
    data,
    timestamp: Date.now(),
  };
  const line = JSON.stringify(payload);
  // #region agent log
  console.error('[AGENT_DEBUG]', line);
  try {
    const logPath = path.join(root, '.cursor', 'debug-a9573c.log');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, `${line}\n`);
  } catch {
    /* Railway image may not have .cursor; stderr still captures */
  }
  fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'a9573c' },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
}

emit('H1', 'build_script_entry', {
  cwd: process.cwd(),
  root,
  node: process.version,
  railway: Boolean(process.env.RAILWAY_ENVIRONMENT),
  hasViteApiUrl: Boolean(process.env.VITE_API_URL),
});

const distPath = path.join(root, 'client', 'dist', 'index.html');
emit('H2', 'pre_build_dist_state', {
  distIndexExists: fs.existsSync(distPath),
  clientPkgExists: fs.existsSync(path.join(root, 'client', 'package.json')),
});

let r = spawnSync('npm', ['run', 'build', '-w', 'client'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
if (r.error) {
  emit('H5', 'npm_spawn_failed_trying_shell', { err: String(r.error.message) });
  r = spawnSync('npm run build -w client', {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });
}

emit('H3', 'npm_build_finished', {
  status: r.status,
  signal: r.signal,
  error: r.error ? String(r.error.message) : null,
});

emit('H4', 'post_build_dist_state', {
  distIndexExists: fs.existsSync(distPath),
});

process.exit(r.status === 0 ? 0 : r.status ?? 1);
