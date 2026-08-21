export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  getHeaders?: () => Record<string, string>;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

export class ApiClient {
  private baseUrl: string;
  private apiKey?: string;
  private getHeaders?: () => Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.getHeaders = config.getHeaders;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  setApiKey(key: string | undefined): void {
    this.apiKey = key;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.getHeaders ? this.getHeaders() : {}),
    };
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }
    return headers;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
    const { body, ...rest } = options;

    const response = await fetch(url, {
      ...rest,
      headers: {
        ...this.buildHeaders(),
        ...(options.headers || {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // use default error message
      }
      const err: any = new Error(errorMessage);
      err.status = response.status;
      try {
        err.data = await response.json().catch(() => null);
      } catch {
        err.data = null;
      }
      throw err;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, { method: 'POST', body });
  }

  async patch<T>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}
