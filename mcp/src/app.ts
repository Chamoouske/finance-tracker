import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { FinanceApi } from './tools.js';
import { createFinanceMcpServer } from './server.js';
import type { Request, Response } from 'express';

export type McpRequestHandler = (request: Request, response: Response) => Promise<void>;

export function createApp(api: FinanceApi, handleMcp: McpRequestHandler = createMcpRequestHandler(api)) {
  const app = createMcpExpressApp({
    host: '0.0.0.0',
    allowedHosts: ['localhost', '127.0.0.1', 'mcp', 'finance.home.lab'],
  });

  app.get('/health', (_request, response) => response.json({ status: 'ok' }));

  app.post('/mcp', async (request, response) => {
    try {
      await handleMcp(request, response);
    } catch (error) {
      if (!response.headersSent) {
        response.status(500).json({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32603, message: error instanceof Error ? error.message : 'Internal server error' },
        });
      }
    }
  });

  app.all('/mcp', (_request, response) => {
    response.status(405).json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32000, message: 'Method not allowed' },
    });
  });

  return app;
}

function createMcpRequestHandler(api: FinanceApi): McpRequestHandler {
  return async (request, response) => {
    const server = createFinanceMcpServer(api);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, request.body);
    } finally {
      await transport.close();
      await server.close();
    }
  };
}
