import { apiFetch } from './client';

export type ContactSubject =
  | 'ORDER_TRACKING'
  | 'STYLING_ADVICE'
  | 'RETURNS_EXCHANGES'
  | 'MEDIA_PARTNERSHIP'
  | 'OTHER';

export type ContactStatus = 'NEW' | 'READ' | 'ARCHIVED';

export type CreateContactPayload = {
  firstName: string;
  lastName: string;
  email: string;
  subject: ContactSubject;
  message: string;
};

export type ApiContactMessage = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: ContactSubject;
  message: string;
  status: ContactStatus;
  createdAt: string;
};

export const CONTACT_SUBJECT_LABEL: Record<ContactSubject, string> = {
  ORDER_TRACKING: 'Suivi commande',
  STYLING_ADVICE: 'Conseil style',
  RETURNS_EXCHANGES: 'Retours / échanges',
  MEDIA_PARTNERSHIP: 'Presse / partenariat',
  OTHER: 'Autre',
};

export async function sendContactMessage(
  payload: CreateContactPayload,
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>('/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchContactMessages(): Promise<ApiContactMessage[]> {
  return apiFetch<ApiContactMessage[]>('/contact');
}

export async function fetchContactUnreadCount(): Promise<number> {
  const data = await apiFetch<{ count: number }>('/contact/unread-count');
  return data.count;
}

export async function updateContactStatus(
  id: string,
  status: ContactStatus,
): Promise<ApiContactMessage> {
  return apiFetch<ApiContactMessage>(`/contact/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export const CONTACT_UNREAD_EVENT = 'zay:contact-unread';

export function emitContactUnread(count: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CONTACT_UNREAD_EVENT, { detail: count }));
}
