import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFinanceMcpServer } from './server.js';

describe('Finance MCP server', () => {
  const closeables: Array<{ close(): Promise<void> }> = [];
  afterEach(async () => Promise.all(closeables.splice(0).map((item) => item.close())));

  async function connectedClient() {
    const api = { get: vi.fn().mockResolvedValue({ ok: true }), post: vi.fn().mockResolvedValue({ created: true }) };
    const server = createFinanceMcpServer(api);
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    closeables.push(client, server);
    return { api, client };
  }

  it('exposes exactly the five finance tools', async () => {
    const { client } = await connectedClient();
    const { tools } = await client.listTools();
    expect(tools.map(({ name }) => name)).toEqual([
      'list_transactions',
      'list_categories',
      'get_summary',
      'get_balance',
      'create_transaction',
    ]);
  });

  it('validates inputs and delegates tool calls to the REST handlers', async () => {
    const { api, client } = await connectedClient();
    const response = await client.callTool({ name: 'list_transactions', arguments: { period: '2026-07' } });
    expect(response.isError).toBe(false);
    expect(api.get).toHaveBeenCalledWith('/api/transactions?period=2026-07');

    const invalid = await client.callTool({ name: 'list_transactions', arguments: { period: 'invalid' } });
    expect(invalid.isError).toBe(true);
    expect(api.get).toHaveBeenCalledTimes(1);
  });
});
