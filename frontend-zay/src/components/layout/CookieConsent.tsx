"use client"

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  openConsentBanner,
  readConsent,
  writeConsent,
  type ConsentValue,
} from '@/lib/consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) setVisible(true);

    const onOpen = () => setVisible(true);
    window.addEventListener('zay-consent-open', onOpen);
    return () => window.removeEventListener('zay-consent-open', onOpen);
  }, []);

  const choose = (value: ConsentValue) => {
    writeConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] p-4 md:p-6 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl border border-zay-border bg-white shadow-lg p-5 md:p-6 space-y-4">
        <div className="space-y-2">
          <p className="text-[0.65rem] tracking-[0.25em] uppercase font-bold text-primary">
            Cookies
          </p>
          <p className="text-sm font-light leading-relaxed text-zay-text">
            Nous utilisons le stockage local pour le panier et la session (nécessaires).
            Le contenu Instagram n&apos;est chargé qu&apos;avec votre accord. Vous pouvez
            modifier ce choix à tout moment via « Gérer les cookies » dans le pied de
            page.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={() => choose('refused')}
            variant="outline"
            className="h-12 rounded-none border-zay-text text-[0.65rem] font-bold uppercase tracking-[0.2em]"
          >
            Refuser
          </Button>
          <Button
            type="button"
            onClick={() => choose('accepted')}
            className="h-12 rounded-none bg-primary hover:bg-zay-text text-white text-[0.65rem] font-bold uppercase tracking-[0.2em]"
          >
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}

export { openConsentBanner };
