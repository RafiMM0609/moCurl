import { describe, it, expect } from 'vitest';
import { isCurlCommand, parseCurl } from '../curlParser';
import { toCurl, toFetch, toPython } from '../curlExporter';
import { interpolateVariables } from '../httpClient';
import type { HttpRequest } from '../../types';

describe('curlParser', () => {
  it('identifies curl commands correctly', () => {
    expect(isCurlCommand('curl https://example.com')).toBe(true);
    expect(isCurlCommand('$ curl -X POST https://example.com')).toBe(true);
    expect(isCurlCommand('  curl -H "foo: bar" https://example.com  ')).toBe(true);
    expect(isCurlCommand('https://example.com')).toBe(false);
    expect(isCurlCommand('git status')).toBe(false);
  });

  it('parses basic GET command with query parameters', () => {
    const cmd = 'curl "https://httpbin.org/get?name=john&age=30"';
    const parsed = parseCurl(cmd);

    expect(parsed.method).toBe('GET');
    expect(parsed.url).toBe('https://httpbin.org/get');
    expect(parsed.params).toHaveLength(2);
    expect(parsed.params?.[0].key).toBe('name');
    expect(parsed.params?.[0].value).toBe('john');
    expect(parsed.params?.[1].key).toBe('age');
    expect(parsed.params?.[1].value).toBe('30');
  });

  it('parses multiline POST request with headers and JSON body', () => {
    const cmd = `curl -X POST https://api.example.com/v1/users \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer my-secret-jwt' \\
  -d '{"username": "antonio", "role": "admin"}'`;

    const parsed = parseCurl(cmd);

    expect(parsed.method).toBe('POST');
    expect(parsed.url).toBe('https://api.example.com/v1/users');
    expect(parsed.auth?.type).toBe('bearer');
    expect(parsed.auth?.bearerToken).toBe('my-secret-jwt');
    expect(parsed.headers?.some(h => h.key === 'Content-Type' && h.value === 'application/json')).toBe(true);
    expect(parsed.body?.type).toBe('json');
    expect(parsed.body?.rawContent).toBe('{"username": "antonio", "role": "admin"}');
  });

  it('parses basic auth flag -u user:pass', () => {
    const cmd = 'curl -u admin:secret123 https://api.example.com/admin';
    const parsed = parseCurl(cmd);

    expect(parsed.auth?.type).toBe('basic');
    expect(parsed.auth?.basicUsername).toBe('admin');
    expect(parsed.auth?.basicPassword).toBe('secret123');
  });

  it('parses form-urlencoded data', () => {
    const cmd = `curl -d "name=MoCurl&version=1.0" -X POST https://httpbin.org/post`;
    const parsed = parseCurl(cmd);

    expect(parsed.method).toBe('POST');
    expect(parsed.body?.type).toBe('x-www-form-urlencoded');
    expect(parsed.body?.urlEncoded).toHaveLength(2);
  });
});

describe('curlExporter', () => {
  const sampleReq: HttpRequest = {
    id: 'test-1',
    name: 'Sample Request',
    url: 'https://httpbin.org/post',
    method: 'POST',
    params: [{ id: 'p1', key: 'filter', value: 'active', enabled: true }],
    headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
    body: {
      type: 'json',
      rawContent: '{"hello": "world"}',
      formData: [],
      urlEncoded: []
    },
    auth: {
      type: 'bearer',
      bearerToken: 'sample-token-xyz'
    }
  };

  it('exports to valid cURL bash string', () => {
    const curl = toCurl(sampleReq);
    expect(curl).toContain("curl");
    expect(curl).toContain("-X POST");
    expect(curl).toContain("'https://httpbin.org/post?filter=active'");
    expect(curl).toContain("-H 'Authorization: Bearer sample-token-xyz'");
    expect(curl).toContain("-d '{\"hello\": \"world\"}'");
  });

  it('exports to JavaScript Fetch snippet', () => {
    const code = toFetch(sampleReq);
    expect(code).toContain('fetch("https://httpbin.org/post?filter=active"');
    expect(code).toContain('method: "POST"');
    expect(code).toContain('"Authorization": "Bearer sample-token-xyz"');
  });

  it('exports to Python Requests snippet', () => {
    const py = toPython(sampleReq);
    expect(py).toContain('import requests');
    expect(py).toContain('https://httpbin.org/post?filter=active');
    expect(py).toContain('requests.post');
  });
});

describe('interpolateVariables', () => {
  it('interpolates environment variables into templates correctly', () => {
    const vars = [
      { id: '1', key: 'baseUrl', value: 'https://httpbin.org', enabled: true },
      { id: '2', key: 'userId', value: '42', enabled: true },
      { id: '3', key: 'disabledVar', value: 'ignored', enabled: false }
    ];

    const input = '{{baseUrl}}/users/{{ userId }}?token={{disabledVar}}';
    const output = interpolateVariables(input, vars);

    expect(output).toBe('https://httpbin.org/users/42?token={{disabledVar}}');
  });
});
