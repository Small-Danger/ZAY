import type { MetadataRoute } from 'next';
import { fetchProducts } from '@/lib/api';
import { SITE_URL } from '@/lib/site';

const STATIC_PATHS = [
  '',
  '/catalogue',
  '/contact',
  '/about',
  '/faq',
  '/cgv',
  '/mentions-legales',
  '/confidentialite',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path || '/'}`,
    lastModified: now,
    changeFrequency: path === '' || path === '/catalogue' ? 'daily' : 'monthly',
    priority: path === '' ? 1 : path === '/catalogue' ? 0.9 : 0.5,
  }));

  const products = await fetchProducts().catch(() => []);
  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/produit/${encodeURIComponent(product.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticEntries, ...productEntries];
}
