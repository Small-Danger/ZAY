import { apiFetch } from './client';

export type StoreSettings = {
  id: number;
  storeName: string;
  contactEmail: string | null;
  shippingCost: string | number;
  freeShippingThreshold: string | number | null;
  legalName: string | null;
  tradeName: string | null;
  legalForm: string | null;
  shareCapital: string | null;
  siret: string | null;
  rcsCity: string | null;
  vatNumber: string | null;
  vatFranchise: boolean;
  legalAddress: string | null;
  publicationDirector: string | null;
  contactPhone: string | null;
  showroomAddress: string | null;
  openingHours: string | null;
  hostName: string;
  hostAddress: string | null;
  hostContact: string | null;
  mediatorName: string | null;
  mediatorUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  eventTitle: string | null;
  eventSubtitle: string | null;
  eventDate: string | null;
  eventImageUrl: string | null;
  eventLink: string | null;
  eventPartners: string | null;
  updatedAt?: string;
};

export type UpdateStoreSettingsPayload = Partial<{
  storeName: string;
  contactEmail: string | null;
  shippingCost: number;
  freeShippingThreshold: number | null;
  legalName: string | null;
  tradeName: string | null;
  legalForm: string | null;
  shareCapital: string | null;
  siret: string | null;
  rcsCity: string | null;
  vatNumber: string | null;
  vatFranchise: boolean;
  legalAddress: string | null;
  publicationDirector: string | null;
  contactPhone: string | null;
  showroomAddress: string | null;
  openingHours: string | null;
  hostName: string | null;
  hostAddress: string | null;
  hostContact: string | null;
  mediatorName: string | null;
  mediatorUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  eventTitle: string | null;
  eventSubtitle: string | null;
  eventDate: string | null;
  eventImageUrl: string | null;
  eventLink: string | null;
  eventPartners: string | null;
}>;

export async function fetchStoreSettings(): Promise<StoreSettings> {
  return apiFetch<StoreSettings>('/admin/store-settings');
}

export async function updateStoreSettings(
  payload: UpdateStoreSettingsPayload,
): Promise<StoreSettings> {
  return apiFetch<StoreSettings>('/admin/store-settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
