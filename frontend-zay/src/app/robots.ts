import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        '/compte',
        '/compte/',
        '/checkout',
        '/panier',
        '/cart',
        '/commande',
        '/commande/',
        '/connexion',
        '/mot-de-passe-oublie',
        '/reinitialiser-mot-de-passe',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
