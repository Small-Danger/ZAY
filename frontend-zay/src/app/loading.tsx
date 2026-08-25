'use client';

import { ZayBusyOverlay } from '@/components/ui/zay-busy-overlay';

export default function HomeLoading() {
  return (
    <div className="relative min-h-screen bg-zay-main">
      <ZayBusyOverlay show placement="fixed" label="Chargement…" />
    </div>
  );
}
