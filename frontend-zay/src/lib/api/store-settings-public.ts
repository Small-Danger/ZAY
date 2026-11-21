import { apiRequestBase } from './config';

export type PublicStoreSettings = {
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
};

const EMPTY: PublicStoreSettings = {
  storeName: 'ZAY',
  contactEmail: null,
  shippingCost: 0,
  freeShippingThreshold: null,
  legalName: null,
  tradeName: null,
  legalForm: null,
  shareCapital: null,
  siret: null,
  rcsCity: null,
  vatNumber: null,
  vatFranchise: true,
  legalAddress: null,
  publicationDirector: null,
  contactPhone: null,
  showroomAddress: null,
  openingHours: null,
  hostName: 'Railway Corporation',
  hostAddress: null,
  hostContact: null,
  mediatorName: null,
  mediatorUrl: null,
  instagramUrl: null,
  tiktokUrl: null,
  eventTitle: null,
  eventSubtitle: null,
  eventDate: null,
  eventImageUrl: null,
  eventLink: null,
  eventPartners: null,
};

export async function getPublicSettings(): Promise<PublicStoreSettings> {
  try {
    const base = apiRequestBase().replace(/\/$/, '');
    const res = await fetch(`${base}/store-settings/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return EMPTY;
    const data = (await res.json()) as PublicStoreSettings;
    return {
      ...EMPTY,
      ...data,
      vatFranchise: data.vatFranchise !== false,
    };
  } catch {
    return EMPTY;
  }
}

export function displayOrPending(value: string | null | undefined): string {
  const v = value?.trim();
  return v ? v : 'Information en cours de mise à jour';
}

/** Identité vendeur / éditeur (micro-entreprise EI). */
export function buildSellerIdentityBullets(
  s: PublicStoreSettings,
): string[] {
  const legal = s.legalName?.trim();
  const trade = s.tradeName?.trim();
  const identity = legal
    ? `${legal} — entrepreneur individuel (EI)${
        trade ? `, exerçant sous le nom commercial « ${trade} »` : ''
      }`
    : displayOrPending(null);

  const bullets = [
    identity,
    `Forme juridique : ${displayOrPending(s.legalForm)}`,
    `Siège social : ${displayOrPending(s.legalAddress)}`,
    `SIRET : ${displayOrPending(s.siret)}`,
    `RCS : ${displayOrPending(s.rcsCity)}`,
  ];

  if (s.shareCapital?.trim()) {
    bullets.push(`Capital social : ${s.shareCapital.trim()}`);
  }

  bullets.push(
    `Téléphone : ${displayOrPending(s.contactPhone)}`,
    `E-mail : ${
      s.contactEmail?.trim() || 'Information en cours de mise à jour'
    }`,
    `Directeur de la publication : ${displayOrPending(s.publicationDirector)}`,
  );

  if (s.vatFranchise) {
    bullets.push('TVA non applicable, art. 293 B du CGI');
  } else {
    bullets.push(
      `N° TVA intracommunautaire : ${displayOrPending(s.vatNumber)}`,
    );
  }

  return bullets;
}
