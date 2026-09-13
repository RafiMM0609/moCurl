import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, 'dist');
const PORT = process.env.PORT || 5173;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer(async (req, res) => {
  // CORS Headers for API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Handle Backend Proxy (Postman-style execution)
  if (req.url === '/api/proxy') {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
    });

    req.on('end', async () => {
      try {
        const { url, method = 'GET', headers = {}, body } = JSON.parse(bodyData || '{}');
        if (!url) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing target URL' }));
          return;
        }

        const nodeHeaders = {};
        for (const [k, v] of Object.entries(headers)) {
          const lk = k.toLowerCase();
          if (lk !== 'host' && lk !== 'connection' && lk !== 'content-length' && typeof v === 'string') {
            nodeHeaders[k] = v;
          }
        }

        const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase()) && body !== undefined;

        const targetResponse = await fetch(url, {
          method,
          headers: nodeHeaders,
          body: hasBody ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
        });

        const respHeaders = {};
        targetResponse.headers.forEach((val, key) => {
          respHeaders[key] = val;
        });

        const respText = await targetResponse.text();

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: targetResponse.status,
          statusText: targetResponse.statusText || (targetResponse.status === 200 ? 'OK' : ''),
          headers: respHeaders,
          body: respText
        }));
      } catch (err) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 0,
          statusText: 'Proxy Failed',
          headers: {},
          body: '',
          error: `Node proxy error: ${err.message}`
        }));
      }
    });
    return;
  }

  // Serve static files from dist
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(DIST_DIR, reqPath);

  // SPA fallback to index.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.statusCode = 404;
    res.end('Not found. Please run npm run build first.');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`MoCurl production server running at http://localhost:${PORT}`);
});
