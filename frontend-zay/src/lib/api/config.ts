/**
 * Config API Nest (backend-zay).
 * Navigateur : NEXT_PUBLIC_API_URL.
 * SSR Docker : API_INTERNAL_URL.
 */

function requirePublicEnv(name: string, value: string | undefined): string {
  const trimmed = value?.replace(/\/$/, '') ?? '';
  if (process.env.NODE_ENV === 'production' && !trimmed) {
    throw new Error(
      `${name} doit être défini en production (build / variables Railway).`,
    );
  }
  return trimmed;
}

const apiUrl = requirePublicEnv(
  'NEXT_PUBLIC_API_URL',
  process.env.NEXT_PUBLIC_API_URL,
);
const apiOriginEnv = requirePublicEnv(
  'NEXT_PUBLIC_API_ORIGIN',
  process.env.NEXT_PUBLIC_API_ORIGIN,
);

export const API_BASE_URL = apiUrl || 'http://localhost:4000/api';

/** Base utilisée par fetch() — interne en Server Component, publique au navigateur. */
export function apiRequestBase(): string {
  if (typeof window === 'undefined') {
    return (
      process.env.API_INTERNAL_URL?.replace(/\/$/, '') || API_BASE_URL
    );
  }
  return API_BASE_URL;
}

/** Origine backend (sans /api) — pour servir /uploads/... dans le navigateur. */
export const API_ORIGIN =
  apiOriginEnv ||
  API_BASE_URL.replace(/\/api\/?$/, '') ||
  'http://localhost:4000';

/**
 * Résout une image BDD :
 * - `https://res.cloudinary.com/...` → inchangée
 * - `/api/media/...` ou `/uploads/...` → origine Nest
 * - `/robes.png` → asset public Next
 */
export function resolveMediaUrl(
  path: string | null | undefined,
  fallback = '/robes.png',
): string {
  if (!path) return fallback;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/') || path.startsWith('/api/media/')) {
    return `${API_ORIGIN}${path}`;
  }
  return path;
}
