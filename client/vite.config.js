import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  // Railway (and similar) set PORT and require listening on all interfaces.
  preview: {
    host: true,
    port: parseInt(process.env.PORT || '4173', 10),
    strictPort: true,
  },
});
