/**
 * Vercel Serverless Function: MoCurl CORS Proxy Engine
 * Enables mobile devices and browsers to bypass CORS restrictions for API testing.
 */

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function parseRequestBody(req) {
  if (req.body) {
    if (typeof req.body === 'object') {
      return req.body;
    }
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    if (Buffer.isBuffer(req.body)) {
      try {
        return JSON.parse(req.body.toString('utf8'));
      } catch {
        return {};
      }
    }
  }

  // Fallback: Read stream if body wasn't pre-parsed by runtime
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function isPrivateOrLocalAddress(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    const hostname = parsed.hostname.toLowerCase();
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      /^192\.168\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    );
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  // CORS Headers for client apps
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const bodyData = await parseRequestBody(req);
    const { url, method = 'GET', headers = {}, body } = bodyData || {};

    if (!url) {
      sendJson(res, 400, { error: 'Missing target URL' });
      return;
    }

    // Filter hop-by-hop headers
    const forwardHeaders = {};
    for (const [k, v] of Object.entries(headers)) {
      const lk = k.toLowerCase();
      if (
        lk !== 'host' &&
        lk !== 'connection' &&
        lk !== 'content-length' &&
        typeof v === 'string'
      ) {
        forwardHeaders[k] = v;
      }
    }

    const hasBody =
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase()) &&
      body !== undefined;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    let targetResponse;
    try {
      targetResponse = await fetch(url, {
        method,
        headers: forwardHeaders,
        body: hasBody ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const respHeaders = {};
    targetResponse.headers.forEach((val, key) => {
      respHeaders[key] = val;
    });

    const respText = await targetResponse.text();

    sendJson(res, 200, {
      status: targetResponse.status,
      statusText: targetResponse.statusText || (targetResponse.status === 200 ? 'OK' : ''),
      headers: respHeaders,
      body: respText
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const bodyData = typeof req.body === 'object' ? req.body : {};
    const targetUrl = bodyData?.url || '';

    let hint = '';
    if (targetUrl && isPrivateOrLocalAddress(targetUrl)) {
      hint =
        ' (Hint: The Vercel proxy runs on a cloud server and cannot reach private local IPs/localhost. To test local servers from your phone, disable the CORS Proxy in MoCurl or use a tunnel like ngrok).';
    }

    sendJson(res, 200, {
      status: 0,
      statusText: 'Proxy Failed',
      headers: {},
      body: '',
      error: `Proxy error: ${errorMsg}${hint}`
    });
  }
}
