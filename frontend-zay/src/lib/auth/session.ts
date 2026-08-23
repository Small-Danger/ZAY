export type SessionUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone?: string | null;
  role: 'CUSTOMER' | 'ADMIN';
};

const TOKEN_KEY = 'zay_access_token';
const USER_KEY = 'zay_user';

function canUseStorage() {
  return typeof window !== 'undefined';
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getSessionUser(): SessionUser | null {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSession(accessToken: string, user: SessionUser) {
  if (!canUseStorage()) return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateSessionUser(user: SessionUser) {
  if (!canUseStorage()) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (!canUseStorage()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAdminSession(): boolean {
  return getSessionUser()?.role === 'ADMIN';
}

export const LOGIN_THEN_CHECKOUT = '/connexion?next=/checkout';

/** Panier / tiroir : invitée → connexion, puis retour checkout. */
export function checkoutPath(): string {
  return getAccessToken() ? '/checkout' : LOGIN_THEN_CHECKOUT;
}

/** Chemin interne uniquement (`/checkout`), refuse les URL externes. */
export function safeInternalPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) {
    return null;
  }
  if (raw.includes('://')) return null;
  return raw;
}
