"use client"

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Barre de progression légère (CSS, sans Framer).
 * Ne PAS remonter {children} avec key={pathname} :
 * ça détruisait le layout admin (spinner plein écran + refetch à chaque clic).
 */
export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (isAdmin) return;
    setActive(true);
    const timer = setTimeout(() => setActive(false), 160);
    return () => clearTimeout(timer);
  }, [pathname, isAdmin]);

  return (
    <>
      <div
        aria-hidden
        className="fixed top-0 left-0 h-[3px] bg-primary z-[9999] pointer-events-none shadow-[0_0_10px_rgba(212,83,126,0.5)]"
        style={{
          width: active ? '100%' : '0%',
          opacity: active ? 1 : 0,
          transition: active ? 'width 160ms ease-out' : 'opacity 80ms linear',
        }}
      />
      {children}
    </>
  );
};
