import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiClient: vi.fn(),
  listen: vi.fn((_port: number, _host: string, callback: () => void) => callback()),
}));

vi.mock('./api-client.js', () => ({ ApiClient: mocks.apiClient }));
vi.mock('./app.js', () => ({ createApp: vi.fn(() => ({ listen: mocks.listen })) }));

describe('MCP process entrypoint', () => {
  afterEach(() => {
    delete process.env.PORT;
    delete process.env.GO_API_URL;
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('uses local defaults', async () => {
    await import('./index.js');
    expect(mocks.apiClient).toHaveBeenCalledWith('http://localhost:8080');
    expect(mocks.listen).toHaveBeenCalledWith(3001, '0.0.0.0', expect.any(Function));
  });

  it('uses container environment variables', async () => {
    process.env.PORT = '4000';
    process.env.GO_API_URL = 'http://backend:8080';
    await import('./index.js');
    expect(mocks.apiClient).toHaveBeenCalledWith('http://backend:8080');
    expect(mocks.listen).toHaveBeenCalledWith(4000, '0.0.0.0', expect.any(Function));
  });
});
