import { describe, expect, it, vi } from 'vitest';
import { createToolHandlers } from './tools.js';

describe('MCP tool handlers', () => {
  it.each([
    ['listTransactions', { period: '2026-07' }, 'get', '/api/transactions?period=2026-07'],
    ['listCategories', {}, 'get', '/api/categories'],
    ['getSummary', { period: '2026-07' }, 'get', '/api/summary?period=2026-07'],
    ['getBalance', {}, 'get', '/api/balance'],
  ] as const)('%s delegates exclusively to the Go REST API', async (name, input, method, path) => {
    const api = { get: vi.fn().mockResolvedValue({ value: 1 }), post: vi.fn() };
    const handlers = createToolHandlers(api);

    const result = await handlers[name](input as never);

    expect(api[method]).toHaveBeenCalledWith(path);
    expect(result).toMatchObject({ isError: false, structuredContent: { data: { value: 1 } } });
  });

  it('creates transactions through POST /api/transactions', async () => {
    const api = { get: vi.fn(), post: vi.fn().mockResolvedValue({ transaction: { id: 1 } }) };
    const handlers = createToolHandlers(api);
    const input = { categoryId: 1, date: '2026-07-24', amount: 1000, type: 'income' as const, note: 'Salário' };

    const result = await handlers.createTransaction(input);

    expect(api.post).toHaveBeenCalledWith('/api/transactions', input);
    expect(result.isError).toBe(false);
  });

  it('returns API failures as MCP tool errors', async () => {
    const api = { get: vi.fn().mockRejectedValue(new Error('backend unavailable')), post: vi.fn() };
    const handlers = createToolHandlers(api);

    const result = await handlers.getBalance({});

    expect(result).toEqual({ content: [{ type: 'text', text: 'backend unavailable' }], isError: true });
  });

  it('normalizes non-Error tool failures', async () => {
    const api = { get: vi.fn().mockRejectedValue('offline'), post: vi.fn() };
    const result = await createToolHandlers(api).getBalance({});
    expect(result).toEqual({ content: [{ type: 'text', text: 'Unknown error' }], isError: true });
  });
});
