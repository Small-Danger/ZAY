'use client';

import { ZayBusyOverlay } from '@/components/ui/zay-busy-overlay';

export default function CatalogueLoading() {
  return (
    <div className="relative min-h-screen bg-white">
      <ZayBusyOverlay show placement="fixed" label="Chargement du catalogue…" />
    </div>
  );
}
