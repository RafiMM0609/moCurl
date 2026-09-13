import type { HttpMethod, HttpRequest, KeyValuePair, RequestBody, RequestAuth } from '../types';

/**
 * Checks if an input string is likely a cURL bash command
 */
export function isCurlCommand(input: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  return (
    trimmed.startsWith('curl ') ||
    trimmed.startsWith('curl\n') ||
    trimmed.startsWith('curl\r\n') ||
    trimmed.startsWith('curl\t') ||
    trimmed.startsWith('$ curl ') ||
    /^curl\s+/.test(trimmed)
  );
}

/**
 * Tokenize a bash command into arguments while respecting quotes and escapes
 */
function tokenizeCommand(cmd: string): string[] {
  // Normalize line continuations (backslash at end of line)
  const normalized = cmd.replace(/\\\r?\n/g, ' ').trim();
  
  const tokens: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let isEscaped = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (isEscaped) {
      current += char;
      isEscaped = false;
      continue;
    }

    if (char === '\\' && !inSingleQuote) {
      isEscaped = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Parses a cURL command string into an HttpRequest object
 */
export function parseCurl(curlString: string): Partial<HttpRequest> {
  const tokens = tokenizeCommand(curlString);
  
  // Remove 'curl' or '$ curl' prefix
  if (tokens.length > 0 && (tokens[0] === 'curl' || tokens[0] === '$')) {
    if (tokens[0] === '$' && tokens[1] === 'curl') {
      tokens.splice(0, 2);
    } else {
      tokens.splice(0, 1);
    }
  }

  let method: HttpMethod = 'GET';
  let rawUrl = '';
  const headers: KeyValuePair[] = [];
  const params: KeyValuePair[] = [];
  const formData: KeyValuePair[] = [];
  const urlEncoded: KeyValuePair[] = [];
  let rawBody = '';
  let bodyType: RequestBody['type'] = 'none';
  const auth: RequestAuth = { type: 'none' };

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    // Method flag: -X, --request
    if (token === '-X' || token === '--request') {
      if (i + 1 < tokens.length) {
        method = tokens[i + 1].toUpperCase() as HttpMethod;
        i += 2;
        continue;
      }
    }

    // Header flag: -H, --header
    if (token === '-H' || token === '--header') {
      if (i + 1 < tokens.length) {
        const headerStr = tokens[i + 1];
        const colonIdx = headerStr.indexOf(':');
        if (colonIdx > 0) {
          const key = headerStr.substring(0, colonIdx).trim();
          const value = headerStr.substring(colonIdx + 1).trim();

          // Check if it's Authorization: Bearer
          if (key.toLowerCase() === 'authorization' && value.toLowerCase().startsWith('bearer ')) {
            auth.type = 'bearer';
            auth.bearerToken = value.substring(7).trim();
          } else {
            headers.push({
              id: crypto.randomUUID(),
              key,
              value,
              enabled: true
            });
          }
        }
        i += 2;
        continue;
      }
    }

    // Body flag: -d, --data, --data-raw, --data-binary, --data-ascii
    if (
      token === '-d' ||
      token === '--data' ||
      token === '--data-raw' ||
      token === '--data-binary' ||
      token === '--data-ascii'
    ) {
      if (i + 1 < tokens.length) {
        rawBody = tokens[i + 1];
        bodyType = 'raw';
        // Auto default to POST if method wasn't explicitly changed
        if (method === 'GET') {
          method = 'POST';
        }

        // Try detecting JSON
        const trimmed = rawBody.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            JSON.parse(trimmed);
            bodyType = 'json';
          } catch {
            bodyType = 'json'; // treat as JSON draft even if malformed
          }
        } else if (trimmed.includes('=') && !trimmed.includes('\n')) {
          // might be form-urlencoded
          const pairs = trimmed.split('&');
          pairs.forEach(pair => {
            const [k, v] = pair.split('=');
            if (k) {
              urlEncoded.push({
                id: crypto.randomUUID(),
                key: decodeURIComponent(k || ''),
                value: decodeURIComponent(v || ''),
                enabled: true
              });
            }
          });
          if (urlEncoded.length > 0) {
            bodyType = 'x-www-form-urlencoded';
          }
        }

        i += 2;
        continue;
      }
    }

    // Form data flag: -F, --form
    if (token === '-F' || token === '--form') {
      if (i + 1 < tokens.length) {
        const formStr = tokens[i + 1];
        const eqIdx = formStr.indexOf('=');
        if (eqIdx > 0) {
          const key = formStr.substring(0, eqIdx).trim();
          const value = formStr.substring(eqIdx + 1).trim();
          formData.push({
            id: crypto.randomUUID(),
            key,
            value,
            enabled: true
          });
          bodyType = 'form-data';
          if (method === 'GET') method = 'POST';
        }
        i += 2;
        continue;
      }
    }

    // Basic Auth flag: -u, --user
    if (token === '-u' || token === '--user') {
      if (i + 1 < tokens.length) {
        const userPass = tokens[i + 1];
        const [u, p] = userPass.split(':');
        auth.type = 'basic';
        auth.basicUsername = u || '';
        auth.basicPassword = p || '';
        i += 2;
        continue;
      }
    }

    // Ignore other common curl flags like -k, -s, -L, -v, --location, --silent, --compressed, etc.
    if (
      token.startsWith('-') ||
      token === '--compressed' ||
      token === '--location' ||
      token === '-L' ||
      token === '-k' ||
      token === '--insecure' ||
      token === '-s' ||
      token === '--silent'
    ) {
      i++;
      continue;
    }

    // Likely the URL!
    if (!rawUrl && (token.startsWith('http://') || token.startsWith('https://') || token.includes('.') || token.startsWith('/'))) {
      rawUrl = token;
    }

    i++;
  }

  // Parse Query Params from the URL if present
  let cleanUrl = rawUrl;
  if (rawUrl) {
    try {
      const urlObj = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      urlObj.searchParams.forEach((value, key) => {
        params.push({
          id: crypto.randomUUID(),
          key,
          value,
          enabled: true
        });
      });
      // Base URL without search params for cleaner display
      cleanUrl = `${urlObj.origin}${urlObj.pathname}`;
    } catch {
      const qIdx = rawUrl.indexOf('?');
      if (qIdx !== -1) {
        cleanUrl = rawUrl.substring(0, qIdx);
        const queryStr = rawUrl.substring(qIdx + 1);
        const searchParams = new URLSearchParams(queryStr);
        searchParams.forEach((value, key) => {
          params.push({
            id: crypto.randomUUID(),
            key,
            value,
            enabled: true
          });
        });
      }
    }
  }

  return {
    url: cleanUrl || rawUrl,
    method,
    headers,
    params,
    body: {
      type: bodyType,
      rawContent: rawBody,
      formData,
      urlEncoded
    },
    auth
  };
}
