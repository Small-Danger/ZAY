"use client"

import React, { useEffect } from 'react';
import { Instagram } from 'lucide-react';
import { motion } from 'framer-motion';

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.617a8.171 8.171 0 0 0 4.773 1.574V6.686h-.003z"/>
  </svg>
);

const INSTAGRAM_POSTS = [
  "https://www.instagram.com/reel/DaGNHgJNsZg/",
  "https://www.instagram.com/reel/DWBxOWOjIAD/",
  "https://www.instagram.com/reel/DSx5aE0jH9F/",
];

export const InstagramFeed = () => {
  useEffect(() => {
    const process = () => {
      (window as unknown as { instgrm?: { Embeds?: { process: () => void } } }).instgrm?.Embeds?.process();
    };

    if ((window as unknown as { instgrm?: unknown }).instgrm) {
      process();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src*="instagram.com/embed.js"]');
    if (existing) {
      existing.addEventListener('load', process);
      return () => existing.removeEventListener('load', process);
    }

    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.onload = process;
    document.body.appendChild(script);
  }, []);

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-10 md:mb-16">
          <div className="space-y-4">
            <h2 className="text-[1.2rem] md:text-[1.6rem] lg:text-[2.2rem] font-black tracking-[0.25em] uppercase text-black border-l-8 border-primary pl-6">
              L&apos;UNIVERS ZAY
            </h2>
            <p className="text-zay-text-muted text-sm italic tracking-widest pl-8 max-w-lg">
              Rejoignez-nous sur nos réseaux pour plus d&apos;inspirations quotidiennes.
            </p>
          </div>

          <div className="flex items-center gap-6 pl-8 md:pl-0">
            <a href="https://www.instagram.com/zay_dresss/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[0.7rem] font-black tracking-[0.2em] uppercase text-black hover:text-primary transition-colors">
              <Instagram size={16} /> INSTAGRAM
            </a>
            <span className="w-px h-4 bg-zay-border" />
            <a href="https://www.tiktok.com/@zay_dresss" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[0.7rem] font-black tracking-[0.2em] uppercase text-black hover:text-primary transition-colors">
              <TiktokIcon className="w-4 h-4" /> TIKTOK
            </a>
          </div>
        </div>

        <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 md:gap-8 md:grid md:grid-cols-2 lg:grid-cols-3 pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible md:snap-none">
          {INSTAGRAM_POSTS.map((url, index) => (
            <motion.div
              key={url}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="min-w-[min(78vw,340px)] max-w-[400px] snap-center shrink-0 md:min-w-0 md:w-full md:max-w-none"
            >
              <div className="zay-ig-crop group">
                <blockquote
                  className="instagram-media"
                  data-instgrm-permalink={url}
                  data-instgrm-version="14"
                >
                  <a href={url} target="_blank" rel="noopener noreferrer" className="flex h-full items-center justify-center">
                    <Instagram className="text-white/25" size={36} strokeWidth={1} />
                  </a>
                </blockquote>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
