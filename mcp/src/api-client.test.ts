import { describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiError } from './api-client.js';

describe('ApiClient', () => {
  it('calls the Go API and unwraps successful responses', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { total: 2 } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    const client = new ApiClient('http://backend:8080/', fetcher);

    await expect(client.get('/api/transactions?period=2026-07')).resolves.toEqual({ total: 2 });
    expect(fetcher).toHaveBeenCalledWith('http://backend:8080/api/transactions?period=2026-07', expect.objectContaining({ method: 'GET' }));
  });

  it('sends JSON to the Go API', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { id: 1 } }), { status: 201 }));
    const client = new ApiClient('http://backend:8080', fetcher);

    await client.post('/api/transactions', { amount: 100 });

    expect(fetcher).toHaveBeenCalledWith('http://backend:8080/api/transactions', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100 }),
    }));
  });

  it.each([
    ['API envelope', new Response(JSON.stringify({ success: false, error: { code: 'VALIDATION_ERROR', message: 'invalid' } }), { status: 422 }), 'invalid'],
    ['invalid JSON', new Response('not-json', { status: 502 }), 'HTTP 502'],
    ['network error', new Error('connection refused'), 'connection refused'],
  ])('normalizes %s failures', async (_name, outcome, message) => {
    const fetcher = vi.fn();
    outcome instanceof Response ? fetcher.mockResolvedValue(outcome) : fetcher.mockRejectedValue(outcome);
    const client = new ApiClient('http://backend:8080', fetcher);

    await expect(client.get('/api/health')).rejects.toMatchObject({ name: 'ApiError', message });
  });

  it('requires a non-empty API URL', () => {
    expect(() => new ApiClient('')).toThrow(ApiError);
  });

  it.each([
    [new Response(JSON.stringify({ success: true }), { status: 200 }), 'HTTP 200', 'API_ERROR'],
    [new Response(JSON.stringify({ success: false, error: {} }), { status: 500 }), 'HTTP 500', 'API_ERROR'],
  ])('uses HTTP fallbacks for incomplete envelopes', async (response, message, code) => {
    const client = new ApiClient('http://backend:8080', vi.fn().mockResolvedValue(response));
    await expect(client.get('/api/balance')).rejects.toMatchObject({ message, code });
  });

  it('normalizes non-Error network failures', async () => {
    const client = new ApiClient('http://backend:8080', vi.fn().mockRejectedValue('offline'));
    await expect(client.get('/api/health')).rejects.toMatchObject({ message: 'Go API request failed' });
  });
});
