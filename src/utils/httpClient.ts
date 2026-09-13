import type { HttpRequest, HttpResponse, EnvVariable } from '../types';

/**
 * Replace {{variable}} placeholders with active environment values
 */
export function interpolateVariables(template: string, variables: EnvVariable[]): string {
  if (!template) return template;
  let result = template;
  for (const v of variables) {
    if (v.enabled && v.key.trim()) {
      const regex = new RegExp(`\\{\\{\\s*${v.key.trim()}\\s*\\}\\}`, 'g');
      result = result.replace(regex, v.value);
    }
  }
  return result;
}

export interface ExecuteOptions {
  request: HttpRequest;
  variables?: EnvVariable[];
  useCorsProxy?: boolean;
  corsProxyUrl?: string;
  signal?: AbortSignal;
}

/**
 * Executes an HTTP request via the browser fetch API with CORS proxy support & metric tracking
 */
export async function executeHttpRequest(options: ExecuteOptions): Promise<HttpResponse> {
  const { request, variables = [], useCorsProxy = false, corsProxyUrl = '', signal } = options;

  // 1. Resolve URL with variables
  let targetUrl = interpolateVariables(request.url.trim(), variables);
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }

  // 2. Build Query Params
  const queryParams = new URLSearchParams();
  
  // Existing params in request
  request.params
    .filter(p => p.enabled && p.key.trim())
    .forEach(p => {
      const key = interpolateVariables(p.key.trim(), variables);
      const val = interpolateVariables(p.value, variables);
      queryParams.append(key, val);
    });

  // Auth: API Key in Query
  if (request.auth.type === 'apiKey' && request.auth.apiKeyAddTo === 'query' && request.auth.apiKeyName) {
    const key = interpolateVariables(request.auth.apiKeyName.trim(), variables);
    const val = interpolateVariables(request.auth.apiKeyValue || '', variables);
    queryParams.append(key, val);
  }

  const queryString = queryParams.toString();
  if (queryString) {
    targetUrl += (targetUrl.includes('?') ? '&' : '?') + queryString;
  }

  // 3. Build Headers
  const headers = new Headers();

  // Custom request headers
  request.headers
    .filter(h => h.enabled && h.key.trim())
    .forEach(h => {
      const key = interpolateVariables(h.key.trim(), variables);
      const val = interpolateVariables(h.value, variables);
      headers.set(key, val);
    });

  // Auth Headers
  if (request.auth.type === 'bearer' && request.auth.bearerToken) {
    const token = interpolateVariables(request.auth.bearerToken.trim(), variables);
    headers.set('Authorization', `Bearer ${token}`);
  } else if (request.auth.type === 'basic' && request.auth.basicUsername) {
    const user = interpolateVariables(request.auth.basicUsername, variables);
    const pass = interpolateVariables(request.auth.basicPassword || '', variables);
    headers.set('Authorization', `Basic ${btoa(`${user}:${pass}`)}`);
  } else if (request.auth.type === 'apiKey' && request.auth.apiKeyAddTo === 'header' && request.auth.apiKeyName) {
    const key = interpolateVariables(request.auth.apiKeyName.trim(), variables);
    const val = interpolateVariables(request.auth.apiKeyValue || '', variables);
    headers.set(key, val);
  }

  // 4. Build Body
  let bodyPayload: BodyInit | undefined = undefined;

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    if (request.body.type === 'json' && request.body.rawContent.trim()) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      bodyPayload = interpolateVariables(request.body.rawContent, variables);
    } else if (request.body.type === 'x-www-form-urlencoded') {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/x-www-form-urlencoded');
      }
      const formParams = new URLSearchParams();
      request.body.urlEncoded
        .filter(p => p.enabled && p.key.trim())
        .forEach(p => {
          formParams.append(
            interpolateVariables(p.key.trim(), variables),
            interpolateVariables(p.value, variables)
          );
        });
      bodyPayload = formParams.toString();
    } else if (request.body.type === 'form-data') {
      const fd = new FormData();
      request.body.formData
        .filter(p => p.enabled && p.key.trim())
        .forEach(p => {
          fd.append(
            interpolateVariables(p.key.trim(), variables),
            interpolateVariables(p.value, variables)
          );
        });
      bodyPayload = fd;
      // Do not set Content-Type header manually for FormData so browser sets boundary
      headers.delete('Content-Type');
    } else if (request.body.type === 'raw' && request.body.rawContent) {
      bodyPayload = interpolateVariables(request.body.rawContent, variables);
    }
  }

  // 5. Compute Final Fetch URL (Direct or Proxy)
  const startTime = performance.now();
  const timestamp = Date.now();

  const isBuiltInProxy =
    useCorsProxy &&
    (!corsProxyUrl ||
      corsProxyUrl.trim() === '/api/proxy' ||
      corsProxyUrl.trim().endsWith('/api/proxy'));

  if (isBuiltInProxy) {
    try {
      const headersObj: Record<string, string> = {};
      headers.forEach((val, key) => {
        headersObj[key] = val;
      });

      const proxyEndpoint = corsProxyUrl.trim() || '/api/proxy';
      const proxyResponse = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: targetUrl,
          method: request.method,
          headers: headersObj,
          body: typeof bodyPayload === 'string' ? bodyPayload : undefined
        }),
        signal
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      if (!proxyResponse.ok) {
        throw new Error(`Proxy server returned ${proxyResponse.status}: ${proxyResponse.statusText}`);
      }

      const data = await proxyResponse.json();
      const size = new Blob([data.body || '']).size;

      return {
        status: data.status,
        statusText: data.statusText || (data.status === 200 ? 'OK' : data.status === 401 ? 'Unauthorized' : `HTTP ${data.status}`),
        duration,
        size,
        headers: data.headers || {},
        body: data.body || '',
        contentType: data.headers?.['content-type'] || undefined,
        timestamp,
        error: data.error
      };
    } catch (err: unknown) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      const errorMessage = err instanceof Error ? err.message : String(err);

      return {
        status: 0,
        statusText: 'Proxy Request Failed',
        duration,
        size: 0,
        headers: {},
        body: '',
        timestamp,
        error: `Could not connect to proxy server: ${errorMessage}`
      };
    }
  }

  // Fallback for custom 3rd party URL proxies or direct fetch
  let fetchUrl = targetUrl;
  if (useCorsProxy) {
    const proxyTemplate = corsProxyUrl.trim() || 'https://corsproxy.io/?url=';
    if (proxyTemplate.includes('{url}')) {
      fetchUrl = proxyTemplate.replace('{url}', encodeURIComponent(targetUrl));
    } else if (proxyTemplate.endsWith('=')) {
      fetchUrl = `${proxyTemplate}${encodeURIComponent(targetUrl)}`;
    } else {
      fetchUrl = `${proxyTemplate}/${targetUrl}`;
    }
  }

  try {
    const response = await fetch(fetchUrl, {
      method: request.method,
      headers,
      body: bodyPayload,
      signal
    });

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    // Read headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    const textBody = await response.text();
    // Calculate approximate size in bytes
    const size = new Blob([textBody]).size;

    return {
      status: response.status,
      statusText: response.statusText || (response.status === 200 ? 'OK' : 'Completed'),
      duration,
      size,
      headers: responseHeaders,
      body: textBody,
      contentType: response.headers.get('content-type') || undefined,
      timestamp
    };
  } catch (err: unknown) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Check if error is likely a CORS block
    const isCorsError =
      errorMessage.toLowerCase().includes('failed to fetch') ||
      errorMessage.toLowerCase().includes('networkerror');

    return {
      status: 0,
      statusText: isCorsError ? 'CORS / Network Error' : 'Request Failed',
      duration,
      size: 0,
      headers: {},
      body: '',
      timestamp,
      error: isCorsError
        ? 'Request blocked by browser CORS policy or endpoint unreachable. Try enabling the CORS Proxy in Settings or top bar.'
        : errorMessage
    };
  }
}
