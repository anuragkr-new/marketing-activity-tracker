import fs from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
    fs.appendFileSync(DEBUG_LOG, `${line}\n`);
  } catch {
    /* ignore */
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

function railwayDebugPlugin() {
  return {
    name: 'agent-railway-debug',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const addr = server.httpServer?.address();
        emit({
          hypothesisId: 'H3',
          location: 'vite.config.js:dev-listening',
          message: 'dev server listening',
          data: { address: addr },
        });
      });
    },
    configurePreviewServer(server) {
      server.httpServer?.once('listening', () => {
        const addr = server.httpServer?.address();
        emit({
          hypothesisId: 'H3',
          location: 'vite.config.js:preview-listening',
          message: 'preview server listening',
          data: { address: addr },
        });
      });
    },
  };
}
// #endregion

export default defineConfig(({ command }) => {
  // #region agent log
  emit({
    hypothesisId: 'H4',
    location: 'vite.config.js:defineConfig',
    message: 'vite config evaluated',
    data: {
      command,
      cwd: process.cwd(),
      PORT: process.env.PORT || null,
      NODE_ENV: process.env.NODE_ENV || null,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || null,
    },
  });
  // #endregion

  return {
    plugins: [react(), railwayDebugPlugin()],
    // When Railway runs `vite` (dev), PORT is set (e.g. 8080) but Vite defaulted to 5173 + localhost → edge 502.
    // Use IPv4 explicitly: `host: true` listened on `::` only and Railway still returned GET / 502 in HTTP logs.
    server: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '5173', 10),
      strictPort: Boolean(process.env.PORT),
    },
    // Railway (and similar) set PORT and require listening on all interfaces.
    preview: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '4173', 10),
      strictPort: true,
    },
  };
});
