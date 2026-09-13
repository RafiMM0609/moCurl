import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import type { IncomingMessage, ServerResponse } from 'http'

function mocurlProxyMiddleware(req: IncomingMessage, res: ServerResponse) {
  // CORS Headers for client
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
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
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing target URL' }));
        return;
      }

      // Filter out hop-by-hop headers
      const nodeHeaders: Record<string, string> = {};
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

      const respHeaders: Record<string, string> = {};
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: 0,
        statusText: 'Proxy Failed',
        headers: {},
        body: '',
        error: `Node proxy error: ${msg}`
      }));
    }
  });
}

function mocurlProxyPlugin(): Plugin {
  return {
    name: 'mocurl-proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/api/proxy', mocurlProxyMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/proxy', mocurlProxyMiddleware);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mocurlProxyPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'MoCurl - Mobile API Client',
        short_name: 'MoCurl',
        description: 'Mobile-first Postman-like REST client with cURL auto-detection, CORS proxy, and offline persistence',
        theme_color: '#0f1117',
        background_color: '#0f1117',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt}']
      }
    })
  ],
})
