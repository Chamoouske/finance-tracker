export interface FinanceApi {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
}

export interface PeriodInput { period: string }
export interface CreateTransactionInput {
  categoryId: number;
  date: string;
  amount: number;
  type: 'income' | 'investment' | 'expense';
  note: string;
}

function success(data: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data) }],
    structuredContent: { data },
    isError: false,
  };
}

function failure(error: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: error instanceof Error ? error.message : 'Unknown error' }],
    isError: true,
  };
}

async function execute(action: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    return success(await action());
  } catch (error) {
    return failure(error);
  }
}

export function createToolHandlers(api: FinanceApi) {
  return {
    listTransactions: ({ period }: PeriodInput) => execute(() => api.get(`/api/transactions?period=${encodeURIComponent(period)}`)),
    listCategories: (_input: Record<string, never>) => execute(() => api.get('/api/categories')),
    getSummary: ({ period }: PeriodInput) => execute(() => api.get(`/api/summary?period=${encodeURIComponent(period)}`)),
    getBalance: (_input: Record<string, never>) => execute(() => api.get('/api/balance')),
    createTransaction: (input: CreateTransactionInput) => execute(() => api.post('/api/transactions', input)),
  };
}
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
