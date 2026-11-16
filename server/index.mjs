// server/index.mjs — prod Node server: static dist/ + /api/observatory/*.
// Single process, no Vite. Read-only DB access only.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';
import { buildSnapshot } from './snapshot.mjs';
import { health } from './db.mjs';

const PORT = Number(process.env.PORT) || 5174;
const DIST = join(process.cwd(), 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function json(res, code, obj) {
  send(res, code, JSON.stringify(obj));
}

async function serveStatic(req, res) {
  let pathname = decodeURIComponent((req.url || '/').split('?')[0]);
  if (pathname === '/') pathname = '/index.html';
  const filePath = normalize(join(DIST, pathname));
  if (!filePath.startsWith(normalize(DIST))) {
    send(res, 403, 'forbidden', 'text/plain');
    return;
  }
  if (!existsSync(filePath)) {
    const indexHtml = join(DIST, 'index.html');
    if (existsSync(indexHtml)) {
      send(res, 200, await readFile(indexHtml), MIME['.html']);
    } else {
      send(res, 404, 'not found', 'text/plain');
    }
    return;
  }
  const ext = extname(filePath).toLowerCase();
  send(res, 200, await readFile(filePath), MIME[ext] || 'application/octet-stream');
}

const server = createServer(async (req, res) => {
  const url = (req.url || '').split('?')[0];

  if (url === '/api/observatory/health') {
    json(res, 200, { ok: true, dbs: health() });
    return;
  }
  if (url === '/api/observatory/snapshot') {
    try {
      json(res, 200, buildSnapshot());
    } catch (e) {
      json(res, 500, { error: String(e && e.message) });
    }
    return;
  }
  if (url.startsWith('/api/')) {
    json(res, 404, { error: 'not found' });
    return;
  }

  try {
    await serveStatic(req, res);
  } catch (e) {
    send(res, 500, String(e), 'text/plain');
  }
});

server.listen(PORT, () => {
  console.log(`[observatory] listening on :${PORT} (dist=${DIST})`);
});
