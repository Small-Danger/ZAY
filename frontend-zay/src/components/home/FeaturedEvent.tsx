"use client"

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { PublicStoreSettings } from '@/lib/api/store-settings-public';

function isEventVisible(settings: PublicStoreSettings): boolean {
  const title = settings.eventTitle?.trim();
  if (!title) return false;
  if (!settings.eventDate) return true;
  const date = new Date(settings.eventDate);
  if (Number.isNaN(date.getTime())) return true;
  return date.getTime() > Date.now();
}

function formatEventDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FeaturedEvent({
  settings,
}: {
  settings: PublicStoreSettings;
}) {
  if (!isEventVisible(settings)) return null;

  const title = settings.eventTitle!.trim();
  const subtitle = settings.eventSubtitle?.trim() || null;
  const image = settings.eventImageUrl?.trim() || null;
  const link = settings.eventLink?.trim() || null;
  const partners = settings.eventPartners?.trim() || null;
  const dateLabel = formatEventDate(settings.eventDate);

  const content = (
    <div className="relative max-w-5xl mx-auto aspect-[3/4] md:aspect-video bg-black overflow-hidden shadow-[0_0_50px_rgba(255,20,147,0.25)] rounded-sm">
      {image ? (
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover opacity-60 mix-blend-screen"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zay-text via-primary/40 to-black" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-3"
        >
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black italic tracking-tight text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg md:text-2xl font-headline italic text-orange-200 tracking-[0.15em]">
              {subtitle}
            </p>
          )}
        </motion.div>

        {(dateLabel || partners) && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-4 text-primary">
              <div className="h-px w-12 bg-primary" />
              <Sparkles className="w-5 h-5 fill-primary" />
              <div className="h-px w-12 bg-primary" />
            </div>
            {dateLabel && (
              <p className="text-base md:text-xl font-bold tracking-[0.2em] text-orange-100 uppercase">
                {dateLabel}
              </p>
            )}
            {partners && (
              <p className="text-[0.65rem] md:text-xs font-bold tracking-[0.25em] uppercase text-white/70">
                {partners}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <section className="bg-white py-16 md:py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="mb-12 lg:mb-20">
          <h2 className="text-[1.2rem] md:text-[1.6rem] lg:text-[2.2rem] font-black tracking-[0.25em] uppercase text-black border-l-8 border-primary pl-6">
            À la une
          </h2>
        </div>
        {link ? (
          <Link href={link} target="_blank" rel="noreferrer" className="block">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    </section>
  );
}
