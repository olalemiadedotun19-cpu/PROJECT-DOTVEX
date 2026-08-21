const VITE_API_BASE_URL: string | undefined = (import.meta as any).env?.VITE_API_BASE_URL;
const VITE_API_KEY: string | undefined = (import.meta as any).env?.VITE_API_KEY;

export const API_BASE_URL: string = VITE_API_BASE_URL
  ? VITE_API_BASE_URL.replace(/\/+$/, '')
  : '/api';

export function getApiUrl(path: string = ''): string {
  return API_BASE_URL + (path.startsWith('/') ? path : '/' + path);
}

export function getApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (VITE_API_KEY) {
    headers['x-api-key'] = VITE_API_KEY;
  }
  return headers;
}
