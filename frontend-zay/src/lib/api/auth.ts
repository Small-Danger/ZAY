import { apiFetch } from './client';
import {
  getAccessToken,
  setSession,
  updateSessionUser,
  type SessionUser,
} from '../auth/session';

export type AuthResponse = {
  accessToken: string;
  user: SessionUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export type UpdateProfilePayload = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setSession(data.accessToken, data.user);
  return data;
}

export async function register(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setSession(data.accessToken, data.user);
  return data;
}

export async function fetchMe(): Promise<SessionUser> {
  const user = await apiFetch<SessionUser>('/auth/me');
  const token = getAccessToken();
  if (token) updateSessionUser(user);
  return user;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<SessionUser> {
  const user = await apiFetch<SessionUser>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  updateSessionUser(user);
  return user;
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean }> {
  return apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
