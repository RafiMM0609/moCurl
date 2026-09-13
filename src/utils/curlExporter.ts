import type { HttpRequest } from '../types';

/**
 * Builds the full URL including enabled query parameters
 */
export function buildFullUrl(req: HttpRequest): string {
  let finalUrl = req.url.trim() || 'https://api.example.com/endpoint';
  const activeParams = req.params.filter(p => p.enabled && p.key.trim());

  if (activeParams.length > 0) {
    const hasQuery = finalUrl.includes('?');
    const queryString = activeParams
      .map(p => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value)}`)
      .join('&');
    finalUrl += (hasQuery ? '&' : '?') + queryString;
  }

  return finalUrl;
}

/**
 * Generates an executable cURL command string
 */
export function toCurl(req: HttpRequest): string {
  const fullUrl = buildFullUrl(req);
  const parts: string[] = ['curl'];

  if (req.method !== 'GET') {
    parts.push(`-X ${req.method}`);
  }

  parts.push(`'${fullUrl}'`);

  // Auth Header
  if (req.auth.type === 'bearer' && req.auth.bearerToken) {
    parts.push(`-H 'Authorization: Bearer ${req.auth.bearerToken}'`);
  } else if (req.auth.type === 'basic' && req.auth.basicUsername) {
    parts.push(`-u '${req.auth.basicUsername}:${req.auth.basicPassword || ''}'`);
  } else if (req.auth.type === 'apiKey' && req.auth.apiKeyAddTo === 'header' && req.auth.apiKeyName) {
    parts.push(`-H '${req.auth.apiKeyName}: ${req.auth.apiKeyValue || ''}'`);
  }

  // Active Headers
  req.headers
    .filter(h => h.enabled && h.key.trim())
    .forEach(h => {
      parts.push(`-H '${h.key.trim()}: ${h.value}'`);
    });

  // Body
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    if (req.body.type === 'json' && req.body.rawContent.trim()) {
      if (!req.headers.some(h => h.enabled && h.key.toLowerCase() === 'content-type')) {
        parts.push(`-H 'Content-Type: application/json'`);
      }
      // Escape single quotes in JSON
      const escapedJson = req.body.rawContent.replace(/'/g, `'\\''`);
      parts.push(`-d '${escapedJson}'`);
    } else if (req.body.type === 'x-www-form-urlencoded') {
      const activePairs = req.body.urlEncoded.filter(p => p.enabled && p.key.trim());
      if (activePairs.length > 0) {
        if (!req.headers.some(h => h.enabled && h.key.toLowerCase() === 'content-type')) {
          parts.push(`-H 'Content-Type: application/x-www-form-urlencoded'`);
        }
        const dataStr = activePairs
          .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
          .join('&');
        parts.push(`-d '${dataStr}'`);
      }
    } else if (req.body.type === 'form-data') {
      req.body.formData
        .filter(f => f.enabled && f.key.trim())
        .forEach(f => {
          parts.push(`-F '${f.key}=${f.value}'`);
        });
    } else if (req.body.type === 'raw' && req.body.rawContent) {
      const escapedRaw = req.body.rawContent.replace(/'/g, `'\\''`);
      parts.push(`-d '${escapedRaw}'`);
    }
  }

  return parts.join(' \\\n  ');
}

/**
 * Generates JavaScript Fetch code snippet
 */
export function toFetch(req: HttpRequest): string {
  const fullUrl = buildFullUrl(req);
  const headersObj: Record<string, string> = {};

  if (req.auth.type === 'bearer' && req.auth.bearerToken) {
    headersObj['Authorization'] = `Bearer ${req.auth.bearerToken}`;
  } else if (req.auth.type === 'basic' && req.auth.basicUsername) {
    headersObj['Authorization'] = `Basic ${btoa(`${req.auth.basicUsername}:${req.auth.basicPassword || ''}`)}`;
  } else if (req.auth.type === 'apiKey' && req.auth.apiKeyAddTo === 'header' && req.auth.apiKeyName) {
    headersObj[req.auth.apiKeyName] = req.auth.apiKeyValue || '';
  }

  req.headers
    .filter(h => h.enabled && h.key.trim())
    .forEach(h => {
      headersObj[h.key.trim()] = h.value;
    });

  let bodyCode = '';
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    if (req.body.type === 'json' && req.body.rawContent.trim()) {
      headersObj['Content-Type'] = headersObj['Content-Type'] || 'application/json';
      try {
        const parsed = JSON.parse(req.body.rawContent);
        bodyCode = `  body: JSON.stringify(${JSON.stringify(parsed, null, 2).replace(/\n/g, '\n  ')}),\n`;
      } catch {
        bodyCode = `  body: ${JSON.stringify(req.body.rawContent)},\n`;
      }
    } else if (req.body.type === 'raw' && req.body.rawContent) {
      bodyCode = `  body: ${JSON.stringify(req.body.rawContent)},\n`;
    }
  }

  return `fetch("${fullUrl}", {
  method: "${req.method}",
  headers: ${JSON.stringify(headersObj, null, 4).replace(/\n/g, '\n  ')},
${bodyCode}})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));`;
}

/**
 * Generates Python Requests code snippet
 */
export function toPython(req: HttpRequest): string {
  const fullUrl = buildFullUrl(req);
  const headersObj: Record<string, string> = {};

  if (req.auth.type === 'bearer' && req.auth.bearerToken) {
    headersObj['Authorization'] = `Bearer ${req.auth.bearerToken}`;
  }

  req.headers
    .filter(h => h.enabled && h.key.trim())
    .forEach(h => {
      headersObj[h.key.trim()] = h.value;
    });

  let dataSnippet = '';
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    if (req.body.type === 'json' && req.body.rawContent.trim()) {
      headersObj['Content-Type'] = headersObj['Content-Type'] || 'application/json';
      dataSnippet = `\npayload = ${req.body.rawContent}\n`;
    } else if (req.body.type === 'raw' && req.body.rawContent) {
      dataSnippet = `\npayload = """${req.body.rawContent}"""\n`;
    }
  }

  const pyHeaders = Object.keys(headersObj).length > 0 ? `\nheaders = ${JSON.stringify(headersObj, null, 4)}\n` : '';
  const kwArgs = [
    `"${fullUrl}"`,
    headersObj && Object.keys(headersObj).length > 0 ? 'headers=headers' : null,
    dataSnippet ? (req.body.type === 'json' ? 'json=payload' : 'data=payload') : null,
    req.auth.type === 'basic' && req.auth.basicUsername
      ? `auth=("${req.auth.basicUsername}", "${req.auth.basicPassword || ''}")`
      : null
  ]
    .filter(Boolean)
    .join(', ');

  return `import requests
${pyHeaders}${dataSnippet}
response = requests.${req.method.toLowerCase()}(${kwArgs})

print(response.status_code)
print(response.text)`;
}
