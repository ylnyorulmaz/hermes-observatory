import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Dev proxy: forward /api to the standalone node server (server/index.mjs).
// Prod: `node server/index.mjs` serves dist/ + /api directly — no Vite.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5175',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
