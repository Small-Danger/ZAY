'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ZayBusyOverlay } from '@/components/ui/zay-busy-overlay';

export function StoreLoadingScreen({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-zay-main">
      <Header />
      <main className="relative flex-grow pt-40 pb-24 min-h-[50vh]">
        <ZayBusyOverlay show label={label} />
      </main>
      <Footer />
    </div>
  );
}
