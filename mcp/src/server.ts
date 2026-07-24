import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import type { FinanceApi } from './tools.js';
import { createToolHandlers } from './tools.js';

const period = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'period must use YYYY-MM');

export function createFinanceMcpServer(api: FinanceApi): McpServer {
  const handlers = createToolHandlers(api);
  const server = new McpServer({ name: 'finance-tracker', version: '1.0.0' });

  server.registerTool('list_transactions', {
    description: 'Lista transações de um período mensal pela API Go',
    inputSchema: { period },
  }, handlers.listTransactions);

  server.registerTool('list_categories', {
    description: 'Lista grupos e categorias pela API Go',
    inputSchema: {},
  }, handlers.listCategories);

  server.registerTool('get_summary', {
    description: 'Obtém o resumo financeiro mensal pela API Go',
    inputSchema: { period },
  }, handlers.getSummary);

  server.registerTool('get_balance', {
    description: 'Obtém o balanço consolidado pela API Go',
    inputSchema: {},
  }, handlers.getBalance);

  server.registerTool('create_transaction', {
    description: 'Cria uma transação financeira pela API Go',
    inputSchema: {
      categoryId: z.number().int().positive(),
      date: z.iso.date(),
      amount: z.number().int().positive(),
      type: z.enum(['income', 'investment', 'expense']),
      note: z.string().trim().min(1),
    },
  }, handlers.createTransaction);

  return server;
}
