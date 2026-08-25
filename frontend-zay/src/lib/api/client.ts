import { API_BASE_URL, apiRequestBase } from './config';
import { clearSession, getAccessToken } from '../auth/session';

function withAuthHeaders(init?: RequestInit, json = true): HeadersInit {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (json && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function buildFetchInit(
  init: RequestInit | undefined,
  json: boolean,
): RequestInit {
  return {
    ...init,
    headers: withAuthHeaders(init, json),
    cache: init?.cache ?? 'no-store',
    signal:
      init?.signal ??
      (typeof window === 'undefined' ? AbortSignal.timeout(8000) : undefined),
  };
}

async function requestOnce<T>(
  base: string,
  path: string,
  init: RequestInit | undefined,
  json: boolean,
): Promise<T> {
  const res = await fetch(`${base}${path}`, buildFetchInit(init, json));
  return parseResponse<T>(res);
}

/** Sur le serveur Railway, l’URL interne peut être morte : on retente l’API publique. */
async function requestWithServerFallback<T>(
  path: string,
  init: RequestInit | undefined,
  json: boolean,
): Promise<T> {
  const primary = apiRequestBase().replace(/\/$/, '');
  try {
    return await requestOnce<T>(primary, path, init, json);
  } catch (err) {
    const fallback = API_BASE_URL.replace(/\/$/, '');
    if (typeof window === 'undefined' && fallback && fallback !== primary) {
      return requestOnce<T>(fallback, path, init, json);
    }
    throw err;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return requestWithServerFallback<T>(path, init, true);
}

/** multipart/form-data — ne pas forcer Content-Type (boundary auto). */
export async function apiFetchForm<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  return requestWithServerFallback<T>(path, init, false);
}

function formatApiError(status: number, text: string): string {
  const raw = text.trim();
  if (!raw) {
    return `Erreur ${status}`;
  }
  try {
    const body = JSON.parse(raw) as { message?: string | string[] };
    const msg = Array.isArray(body.message)
      ? body.message.join(' ')
      : body.message;
    if (msg) {
      if (msg.startsWith('Insufficient stock for ')) {
        return `Stock insuffisant pour ${msg.slice('Insufficient stock for '.length)}`;
      }
      return msg;
    }
  } catch {
    /* corps non JSON */
  }
  return `Erreur ${status}`;
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401 && typeof window !== 'undefined') {
      clearSession();
      void import('@/store/useCartStore').then(({ useCartStore }) => {
        useCartStore.getState().dropLocalCart();
      });
    }
    throw new Error(formatApiError(res.status, text || res.statusText));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

/** Téléchargement fichier (CSV, etc.) avec auth. */
export async function apiFetchBlob(path: string): Promise<Blob> {
  const res = await fetch(`${apiRequestBase()}${path}`, {
    headers: withAuthHeaders({}, false),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(formatApiError(res.status, text || res.statusText));
  }
  return res.blob();
}
