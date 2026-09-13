import { describe, it, expect, vi, beforeEach } from 'vitest';
// @ts-expect-error importing js module
import handler from '../../../api/proxy.js';

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  bodyData: string;
  setHeader: (k: string, v: string) => void;
  end: (data?: string) => void;
}

function createMockResponse(): MockResponse {
  return {
    statusCode: 200,
    headers: {},
    bodyData: '',
    setHeader(k: string, v: string) {
      this.headers[k.toLowerCase()] = v;
    },
    end(data?: string) {
      if (data) this.bodyData = data;
    }
  };
}

describe('Vercel API Proxy Handler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('handles OPTIONS preflight request with 204 and CORS headers', async () => {
    const req = { method: 'OPTIONS' };
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-allow-methods']).toContain('POST');
  });

  it('rejects non-POST methods with 405', async () => {
    const req = { method: 'GET' };
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    const parsed = JSON.parse(res.bodyData);
    expect(parsed.error).toBe('Method not allowed');
  });

  it('returns 400 if url is missing', async () => {
    const req = {
      method: 'POST',
      body: {}
    };
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    const parsed = JSON.parse(res.bodyData);
    expect(parsed.error).toBe('Missing target URL');
  });

  it('filters hop-by-hop headers and forwards valid request', async () => {
    const mockTargetResponse = new Response(JSON.stringify({ message: 'hello world' }), {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json', 'X-Custom': 'test' }
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockTargetResponse);

    const req = {
      method: 'POST',
      body: {
        url: 'https://api.example.com/data',
        method: 'POST',
        headers: {
          Host: 'api.example.com',
          Connection: 'keep-alive',
          'Content-Length': '100',
          Authorization: 'Bearer secret-token'
        },
        body: '{"foo":"bar"}'
      }
    };
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith('https://api.example.com/data', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer secret-token'
      },
      body: '{"foo":"bar"}',
      signal: expect.anything()
    });

    const responsePayload = JSON.parse(res.bodyData);
    expect(responsePayload.status).toBe(200);
    expect(responsePayload.statusText).toBe('OK');
    expect(responsePayload.body).toContain('hello world');
    expect(responsePayload.headers['x-custom']).toBe('test');
  });

  it('catches target fetch error and includes hint for localhost/private IP', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:3000'));

    const req = {
      method: 'POST',
      body: {
        url: 'http://localhost:3000/api/todos',
        method: 'GET'
      }
    };
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const responsePayload = JSON.parse(res.bodyData);
    expect(responsePayload.status).toBe(0);
    expect(responsePayload.statusText).toBe('Proxy Failed');
    expect(responsePayload.error).toContain('ECONNREFUSED');
    expect(responsePayload.error).toContain('Vercel proxy runs on a cloud server and cannot reach private local IPs');
  });
});
