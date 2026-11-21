"use client"

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Instagram } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useCategories } from '@/hooks/use-categories';
import { API_BASE_URL } from '@/lib/api/config';
import type { PublicStoreSettings } from '@/lib/api/store-settings-public';
import { openConsentBanner } from '@/lib/consent';

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.617a8.171 8.171 0 0 0 4.773 1.574V6.686h-.003z" />
  </svg>
);

const STATIC_SECTIONS = [
  {
    title: 'Aide',
    links: [
      { name: 'Contact', href: '/contact' },
      { name: 'Retours', href: '/faq#retours' },
      { name: 'Livraison', href: '/faq#livraison' },
      { name: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { name: 'CGV', href: '/cgv' },
      { name: 'Confidentialité', href: '/confidentialite' },
      { name: 'Mentions légales', href: '/mentions-legales' },
      { name: 'Gérer les cookies', href: '#cookies' },
    ],
  },
];

export const Footer = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState<PublicStoreSettings | null>(null);
  const { data: categories } = useCategories();

  useEffect(() => {
    setIsMounted(true);
    void fetch(`${API_BASE_URL}/store-settings/public`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSettings(data as PublicStoreSettings);
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  const footerSections = useMemo(() => {
    const collectionLinks = [
      { name: 'Nouveautés', href: '/catalogue?new=true' },
      ...categories.map((cat) => ({
        name: cat.name,
        href: `/catalogue?category=${encodeURIComponent(cat.name)}`,
      })),
    ];

    return [
      { title: 'Collection', links: collectionLinks },
      ...STATIC_SECTIONS,
    ];
  }, [categories]);

  const instagram = settings?.instagramUrl?.trim() || null;
  const tiktok = settings?.tiktokUrl?.trim() || null;

  return (
    <footer className="bg-zay-text text-white">
      <div className="container mx-auto px-4 md:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="inline-block group">
              <span className="font-headline text-3xl tracking-[0.2em] uppercase leading-none group-hover:text-zay-rose transition-colors">
                ZAY
              </span>
            </Link>
            <p className="text-white/60 text-[13px] font-light leading-loose tracking-widest max-w-xs">
              L&apos;excellence du prêt-à-porter féminin. Élégance, modernité et
              raffinement pour la femme contemporaine.
            </p>
            {(instagram || tiktok) && (
              <div className="flex space-x-6 pt-4">
                {instagram && (
                  <Link
                    href={instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/80 hover:text-zay-rose transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </Link>
                )}
                {tiktok && (
                  <Link
                    href={tiktok}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/80 hover:text-zay-rose transition-colors"
                  >
                    <TiktokIcon className="w-5 h-5" />
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="hidden lg:grid lg:grid-cols-3 lg:col-span-4 gap-8">
            {footerSections.map((section) => (
              <div key={section.title} className="space-y-6">
                <h4 className="text-[0.65rem] tracking-[0.4em] font-bold uppercase text-zay-rose">
                  {section.title}
                </h4>
                <ul className="space-y-4 text-[13px] text-white/60 font-light tracking-widest">
                  {section.links.map((link) => (
                    <li key={`${section.title}-${link.name}`}>
                      {link.href === '#cookies' ? (
                        <button
                          type="button"
                          onClick={() => openConsentBanner()}
                          className="hover:text-white transition-colors"
                        >
                          {link.name}
                        </button>
                      ) : (
                        <Link
                          href={link.href}
                          className="hover:text-white transition-colors"
                        >
                          {link.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:hidden space-y-2">
            {isMounted && (
              <Accordion type="single" collapsible className="w-full">
                {footerSections.map((section, idx) => (
                  <AccordionItem
                    key={section.title}
                    value={`item-${idx}`}
                    className="border-b border-white/10"
                  >
                    <AccordionTrigger className="text-[0.65rem] tracking-[0.4em] font-bold uppercase text-zay-rose hover:no-underline py-4">
                      {section.title}
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <ul className="space-y-4 text-[13px] text-white/60 font-light tracking-widest pt-2">
                        {section.links.map((link) => (
                          <li key={`${section.title}-${link.name}`}>
                            {link.href === '#cookies' ? (
                              <button
                                type="button"
                                onClick={() => openConsentBanner()}
                                className="block hover:text-white transition-colors"
                              >
                                {link.name}
                              </button>
                            ) : (
                              <Link
                                href={link.href}
                                className="block hover:text-white transition-colors"
                              >
                                {link.name}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#1E100B] py-6">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-[10px] text-white/40 tracking-[0.3em] uppercase">
              © 2026 ZAY ATELIER. TOUS DROITS RÉSERVÉS.
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-[10px] font-bold tracking-[0.1em] text-white/40 uppercase">
              <span>Carte bancaire</span>
              <span className="opacity-30">·</span>
              <span>Apple Pay</span>
              <span className="opacity-30">·</span>
              <span>Klarna</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
