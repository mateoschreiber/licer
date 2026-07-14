export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
  }
}

function getToken() {
  return window.localStorage.getItem('access_token');
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'message' in payload
      ? Array.isArray(payload.message)
        ? payload.message.join('. ')
        : String(payload.message)
      : response.status === 413
        ? 'El archivo supera el limite maximo de 2 MB.'
        : 'No se pudo completar la solicitud.';
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) =>
    apiRequest<T>(path, { method: 'DELETE' }),
};

export async function previewFile(path: string) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!response.ok) throw new ApiError('File preview failed', response.status, await response.text());
  const url = URL.createObjectURL(await response.blob());
  const windowRef = window.open(url, '_blank', 'noopener');
  if (!windowRef) URL.revokeObjectURL(url);
  else window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadFile(path: string, fileName: string) {
  const token = getToken();
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new ApiError('File download failed', response.status, await response.text());
  }

  const blob = await response.blob();
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(href);
}
import { API_URL } from '../../config/api';
