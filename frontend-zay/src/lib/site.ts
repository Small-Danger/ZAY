/** URL publique du site (sitemap, Open Graph, robots). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'http://localhost:9002';

export const SITE_NAME = 'ZAY Atelier';

export const SITE_DESCRIPTION =
  'ZAY Atelier — collection de prêt-à-porter féminin : élégance contemporaine et pièces raffinées.';
