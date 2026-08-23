import { apiRequestBase } from './config';
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

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiRequestBase()}${path}`, {
    ...init,
    headers: withAuthHeaders(init, true),
    cache: init?.cache ?? 'no-store',
  });

  return parseResponse<T>(res);
}

/** multipart/form-data — ne pas forcer Content-Type (boundary auto). */
export async function apiFetchForm<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${apiRequestBase()}${path}`, {
    ...init,
    headers: withAuthHeaders(init, false),
    cache: 'no-store',
  });

  return parseResponse<T>(res);
}

function formatApiError(status: number, text: string): string {
  const raw = text.trim();
  if (!raw) {
    return status === 400
      ? 'La commande n’a pas pu être validée. Vérifiez le stock et réessayez.'
      : `Erreur ${status}`;
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
  if (status === 400) {
    return 'La commande n’a pas pu être validée. Vérifiez le stock et réessayez.';
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
