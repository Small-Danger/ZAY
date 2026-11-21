import type { StoreSettings } from '@prisma/client';

export type PublicStoreSettings = {
  storeName: string;
  contactEmail: string | null;
  shippingCost: StoreSettings['shippingCost'];
  freeShippingThreshold: StoreSettings['freeShippingThreshold'];
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
  eventDate: Date | string | null;
  eventImageUrl: string | null;
  eventLink: string | null;
  eventPartners: string | null;
};

export function toPublicStoreSettings(
  settings: StoreSettings,
): PublicStoreSettings {
  return {
    storeName: settings.storeName,
    contactEmail: settings.contactEmail,
    shippingCost: settings.shippingCost,
    freeShippingThreshold: settings.freeShippingThreshold,
    legalName: settings.legalName,
    tradeName: settings.tradeName,
    legalForm: settings.legalForm,
    shareCapital: settings.shareCapital,
    siret: settings.siret,
    rcsCity: settings.rcsCity,
    vatNumber: settings.vatNumber,
    vatFranchise: settings.vatFranchise,
    legalAddress: settings.legalAddress,
    publicationDirector: settings.publicationDirector,
    contactPhone: settings.contactPhone,
    showroomAddress: settings.showroomAddress,
    openingHours: settings.openingHours,
    hostName: settings.hostName,
    hostAddress: settings.hostAddress,
    hostContact: settings.hostContact,
    mediatorName: settings.mediatorName,
    mediatorUrl: settings.mediatorUrl,
    instagramUrl: settings.instagramUrl,
    tiktokUrl: settings.tiktokUrl,
    eventTitle: settings.eventTitle,
    eventSubtitle: settings.eventSubtitle,
    eventDate: settings.eventDate,
    eventImageUrl: settings.eventImageUrl,
    eventLink: settings.eventLink,
    eventPartners: settings.eventPartners,
  };
}
