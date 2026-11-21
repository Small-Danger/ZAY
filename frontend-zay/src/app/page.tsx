import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/home/Hero';
import { Categories } from '@/components/home/Categories';
import { NewArrivals } from '@/components/home/NewArrivals';
import { PromoBanner } from '@/components/home/PromoBanner';
import { FeaturedEvent } from '@/components/home/FeaturedEvent';
import { InstagramFeed } from '@/components/home/InstagramFeed';
import { TrustBadges } from '@/components/home/TrustBadges';
import { Footer } from '@/components/layout/Footer';
import { fetchCategories, fetchProducts } from '@/lib/api';
import { getPublicSettings } from '@/lib/api/store-settings-public';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default async function Home() {
  const [products, settings, categories] = await Promise.all([
    fetchProducts().catch(() => []),
    getPublicSettings(),
    fetchCategories().catch(() => []),
  ]);

  const sameAs = [settings.instagramUrl, settings.tiktokUrl].filter(
    (u): u is string => !!u?.trim(),
  );
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.storeName || SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.jpg`,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <div className="flex flex-col min-h-screen bg-zay-main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(orgJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Header />
      <main className="flex-grow">
        <Hero />
        <Categories initialCategories={categories} />
        <NewArrivals initialProducts={products} />
        <PromoBanner />
        <FeaturedEvent settings={settings} />
        <InstagramFeed />
        <TrustBadges />
      </main>
      <Footer />
    </div>
  );
}
