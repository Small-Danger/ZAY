/** URL publique du site (sitemap, Open Graph, robots). */

function requireSiteUrl(): string {
  const trimmed = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? '';
  if (process.env.NODE_ENV === 'production' && !trimmed) {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL doit être défini en production (build / variables Railway).',
    );
  }
  return trimmed || 'http://localhost:9002';
}

export const SITE_URL = requireSiteUrl();

export const SITE_NAME = 'ZAY Atelier';

export const SITE_DESCRIPTION =
  'ZAY Atelier — collection de prêt-à-porter féminin : élégance contemporaine et pièces raffinées.';
