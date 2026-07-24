import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';

describe('MCP HTTP application', () => {
  const servers: Array<{ close(callback?: () => void): unknown }> = [];
  afterEach(() => servers.splice(0).forEach((server) => server.close()));

  async function startApp(handleMcp?: Parameters<typeof createApp>[1]) {
    const api = { get: vi.fn(), post: vi.fn() };
    const app = createApp(api, handleMcp);
    const server = app.listen(0, '127.0.0.1');
    servers.push(server);
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const { port } = server.address() as AddressInfo;
    return `http://127.0.0.1:${port}`;
  }

  it('reports service health', async () => {
    const baseUrl = await startApp();
    const response = await fetch(`${baseUrl}/health`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });

  it('serves MCP initialize over Streamable HTTP', async () => {
    const baseUrl = await startApp();
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'initialize',
        params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1.0.0' } },
      }),
    });
    expect(response.status).toBe(200);
    const payload = await response.json() as { result: { serverInfo: { name: string } } };
    expect(payload.result.serverInfo.name).toBe('finance-tracker');
  });

  it('rejects unsupported GET requests on the MCP endpoint', async () => {
    const baseUrl = await startApp();
    const response = await fetch(`${baseUrl}/mcp`);
    expect(response.status).toBe(405);
  });

  it.each([
    [new Error('transport failed'), 'transport failed'],
    ['failure', 'Internal server error'],
  ])('returns JSON-RPC errors for transport failures', async (failure, message) => {
    const baseUrl = await startApp(async () => { throw failure; });
    const response = await fetch(`${baseUrl}/mcp`, { method: 'POST' });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: { code: -32603, message } });
  });

  it('does not overwrite a response whose headers were already sent', async () => {
    const baseUrl = await startApp(async (_request, response) => {
      response.status(202).send('started');
      throw new Error('late failure');
    });
    const response = await fetch(`${baseUrl}/mcp`, { method: 'POST' });
    expect(response.status).toBe(202);
    await expect(response.text()).resolves.toBe('started');
  });
});
