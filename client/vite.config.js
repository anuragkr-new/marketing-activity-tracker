import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  const onRailway = Boolean(process.env.RAILWAY_ENVIRONMENT);
  const railwayHosts = onRailway ? { allowedHosts: true } : {};

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '5173', 10),
      strictPort: Boolean(process.env.PORT),
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:4000',
          changeOrigin: true,
        },
      },
      ...railwayHosts,
    },
    preview: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '4173', 10),
      strictPort: true,
      ...railwayHosts,
    },
  };
});
