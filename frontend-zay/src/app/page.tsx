import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/home/Hero';
import { Categories } from '@/components/home/Categories';
import { NewArrivals } from '@/components/home/NewArrivals';
import { PromoBanner } from '@/components/home/PromoBanner';
import { FeaturedEvent } from '@/components/home/FeaturedEvent';
import { InstagramFeed } from '@/components/home/InstagramFeed';
import { TrustBadges } from '@/components/home/TrustBadges';
import { Footer } from '@/components/layout/Footer';
import { fetchProducts } from '@/lib/api';

export default async function Home() {
  const products = await fetchProducts().catch(() => []);

  return (
    <div className="flex flex-col min-h-screen bg-zay-main">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Categories />
        <NewArrivals initialProducts={products} />
        <PromoBanner />
        <FeaturedEvent />
        <InstagramFeed />
        <TrustBadges />
      </main>
      <Footer />
    </div>
  );
}
