export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export class ApiError extends Error {
  constructor(message: string, public readonly code = 'API_ERROR', public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export type Fetcher = typeof fetch;

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string, private readonly fetcher: Fetcher = fetch) {
    const normalized = baseUrl.trim().replace(/\/+$/, '');
    if (!normalized) {
      throw new ApiError('GO_API_URL is required', 'CONFIGURATION_ERROR');
    }
    this.baseUrl = normalized;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    let response: Response;
    try {
      response = await this.fetcher(`${this.baseUrl}${path}`, {
        method,
        ...(body === undefined ? {} : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      });
    } catch (error) {
      throw new ApiError(error instanceof Error ? error.message : 'Go API request failed');
    }

    let envelope: ApiEnvelope<T>;
    try {
      envelope = await response.json() as ApiEnvelope<T>;
    } catch {
      throw new ApiError(`HTTP ${response.status}`, 'INVALID_RESPONSE', response.status);
    }

    if (!response.ok || !envelope.success || envelope.data === undefined) {
      throw new ApiError(
        envelope.error?.message ?? `HTTP ${response.status}`,
        envelope.error?.code ?? 'API_ERROR',
        response.status,
      );
    }
    return envelope.data;
  }
}
