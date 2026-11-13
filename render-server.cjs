'use strict';

/**
 * Render adapter for the existing Vercel-style serverless API modules.
 * Uses Node built-ins and serves the same frontend/API code as Vercel.
 * Run with: node render-server.cjs
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 10000;
const HOST = '0.0.0.0';
const SITE_FILES = new Set([
  '/index.html', '/styles.css', '/app.js', '/live-global.css',
  '/live-global.js', '/global-coverage.css', '/global-coverage.js',
  '/planet.js', '/favicon.ico', '/robots.txt'
]);
const API_HANDLERS = new Set([
  'overview', 'energy', 'news', 'cyber',
  'live', 'world-energy', 'global-grid',
  'global-catalog', 'grid-history', 'grid-adequacy'
]);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, status, data, contentType, cache = 'no-store') {
  if (res.headersSent || res.writableEnded) return;
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  res.end(data);
}

function json(res, status, data) {
  return send(res, status, JSON.stringify(data), 'application/json; charset=utf-8');
}

function wrapResponse(res) {
  // Vercel handlers expect setHeader, status().json().
  res.status = code => { res.statusCode = code; return res; };
  res.json = value => {
    if (res.writableEnded) return res;
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    res.end(JSON.stringify(value));
    return res;
  };
  return res;
}

async function requestHandler(req, res) {
  let parsed;
  try {
    parsed = new URL(req.url || '/', 'http://localhost');
  } catch {
    return json(res, 400, { ok: false, error: 'Invalid URL' });
  }
  const pathname = parsed.pathname;

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }
  if (pathname === '/health') {
    return json(res, 200, { ok: true, service: 'blackout-global-monitor', runtime: 'render' });
  }
  if (pathname.startsWith('/api/')) {
    const name = pathname.slice(5);
    if (!API_HANDLERS.has(name)) {
      return json(res, 404, { ok: false, error: 'API route not found' });
    }
    const handler = require(path.join(ROOT, 'api', name + '.js'));
    req.query = Object.fromEntries(parsed.searchParams);
    wrapResponse(res);
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API execution failed:', name, error && error.message);
      if (!res.writableEnded) json(res, 503, { ok: false, reason: 'Data source unavailable' });
    }
    return;
  }
  const filePath = pathname === '/' ? '/index.html' : pathname;
  if (!SITE_FILES.has(filePath)) {
    return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
  }
  const filename = path.join(ROOT, filePath.slice(1));
  try {
    const contents = await fs.promises.readFile(filename);
    const extension = path.extname(filename);
    return send(res, 200, req.method === 'HEAD' ? '' : contents, TYPES[extension] || 'application/octet-stream', extension === '.html' ? 'no-store' : 'public, max-age=120');
  } catch {
    return send(res, 404, 'File not found', 'text/plain; charset=utf-8');
  }
}

const server = http.createServer((req, res) => {
  requestHandler(req, res).catch(err => {
    console.error('Unexpected request error:', err && err.message);
    if (!res.writableEnded) json(res, 500, { ok: false, error: 'Internal server error' });
  });
});

server.requestTimeout = 30000;
server.headersTimeout = 15000;
server.listen(PORT, HOST, () => {
  console.log('BLACKOUT Global on Render: listening on ' + HOST + ':' + PORT);
});

function terminate() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 7000).unref();
}
process.on('SIGTERM', terminate);
process.on('SIGINT', terminate);
