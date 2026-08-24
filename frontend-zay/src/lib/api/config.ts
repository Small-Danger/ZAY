/**
 * Config API Nest (backend-zay).
 * Navigateur : NEXT_PUBLIC_API_URL (localhost:4000).
 * SSR Docker : API_INTERNAL_URL (http://backend-zay:4000/api).
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:4000/api';

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
  process.env.NEXT_PUBLIC_API_ORIGIN?.replace(/\/$/, '') ||
  API_BASE_URL.replace(/\/api\/?$/, '') ||
  'http://localhost:4000';

/**
 * Résout une image BDD (comme Afrikraga : le CDN s’affiche tel quel) :
 * - `https://res.cloudinary.com/...` → inchangée
 * - `/api/media/...` ou `/uploads/...` → origine Nest (repli)
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
