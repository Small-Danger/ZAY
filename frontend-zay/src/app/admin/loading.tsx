'use client';

import { AdminBusyOverlay } from '@/components/admin/admin-busy-overlay';

export default function AdminLoading() {
  return (
    <div className="relative min-h-[360px]">
      <AdminBusyOverlay show label="Chargement…" />
    </div>
  );
}
