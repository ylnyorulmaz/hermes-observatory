// index.mjs — Observatory v2 server (spec §4, §5).
// Single-process Node HTTP server (no Vite, no deps):
//   - GET /api/observatory/snapshot  → live telemetry snapshot
//   - GET /api/observatory/health    → DB health probe (alias: /health)
//   - static dist/ + SPA fallback    → production frontend
//
// Port: PORT env (default 5174 for prod). In dev, Vite (:5174) proxies /api →
// 127.0.0.1:5175, so run this with PORT=5175. Verify on a spare port (e.g. 5180).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSnapshot } from './agents.mjs';
import { health } from './db.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT || 5174);
const HOST = process.env.HOST || '0.0.0.0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...CORS_HEADERS,
  });
  res.end(body);
}

function serveStatic(res, urlPath) {
  const clean = (urlPath || '/').split('?')[0];
  let filePath = path.join(DIST_DIR, clean === '/' ? 'index.html' : clean);

  // Path traversal guard + SPA fallback.
  if (!filePath.startsWith(DIST_DIR)) filePath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('dist/ not built — run `npm run build` first');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const body = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(body);
}

function handle(req, res) {
  const url = req.url ?? '/';
  const pathname = url.split('?')[0];

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  if (req.method === 'GET' && pathname === '/api/observatory/snapshot') {
    try {
      sendJson(res, 200, buildSnapshot());
    } catch (err) {
      console.error('[snapshot] error:', err);
      sendJson(res, 500, { error: 'snapshot failed', detail: String(err) });
    }
    return;
  }

  if (
    req.method === 'GET' &&
    (pathname === '/api/observatory/health' || pathname === '/health')
  ) {
    sendJson(res, 200, health());
    return;
  }

  // Everything else: static (prod) — only meaningful once `npm run build` ran.
  serveStatic(res, pathname);
}

const server = http.createServer(handle);

server.listen(PORT, HOST, () => {
  console.log(
    `[observatory] server listening on http://${HOST}:${PORT}`,
  );
  const h = health();
  console.log('[observatory] DB health:', JSON.stringify(h.dbs));
});
