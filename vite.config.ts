import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
// Dev: Vite serves the UI on :5174 and proxies /api → the Node server on
// 127.0.0.1:5175 (spec §4). Prod: `node server/index.mjs` serves dist/ + /api.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5175',
        changeOrigin: true,
      },
    },
  },
});
