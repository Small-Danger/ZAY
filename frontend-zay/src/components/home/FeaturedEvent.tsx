
"use client"

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Sparkles } from 'lucide-react';

export const FeaturedEvent = () => {
  const imgData = PlaceHolderImages.find(img => img.id === "event-summer-break");

  return (
    <section className="bg-white py-16 md:py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <div className="mb-12 lg:mb-20">
          <h2 className="text-[1.2rem] md:text-[1.6rem] lg:text-[2.2rem] font-black tracking-[0.25em] uppercase text-black border-l-8 border-primary pl-6">
            PROCHAINS ÉVÉNEMENTS
          </h2>
        </div>

        {/* Event Flyer Container */}
        <div className="relative max-w-5xl mx-auto aspect-[3/4] md:aspect-video bg-black overflow-hidden shadow-[0_0_50px_rgba(255,20,147,0.25)] rounded-sm">
          {/* Background Image */}
          <Image
            src={imgData?.imageUrl || "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1200"}
            alt="Summer Break Event"
            fill
            className="object-cover opacity-60 mix-blend-screen"
            priority
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

          {/* Flyer Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-2"
            >
              <h2 className="text-5xl md:text-8xl lg:text-[9rem] font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-orange-400 via-pink-500 to-primary drop-shadow-[0_0_15px_rgba(255,20,147,0.8)]">
                SUMMER
              </h2>
              <h2 className="text-5xl md:text-8xl lg:text-[9rem] font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-primary via-purple-600 to-blue-600 drop-shadow-[0_0_15px_rgba(255,20,147,0.8)]">
                BREAK
              </h2>
              <p className="text-xl md:text-4xl font-headline italic text-orange-200 glow-pink tracking-[0.2em] mt-4">
                PART 2
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center gap-4 text-primary">
                <div className="h-px w-12 bg-primary" />
                <Sparkles className="w-5 h-5 fill-primary" />
                <div className="h-px w-12 bg-primary" />
              </div>
              
              <div className="space-y-2">
                <p className="text-xl md:text-3xl font-bold tracking-[0.3em] text-orange-100 uppercase">
                  VENDREDI 3 JUILLET
                </p>
                <p className="text-lg md:text-2xl font-light tracking-[0.5em] text-primary">
                  00 : 30
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-8"
            >
              <span className="text-[0.6rem] md:text-[0.75rem] font-bold tracking-[0.3em] uppercase text-white/70">
                ZAY ATELIER
              </span>
              <span className="text-white/30">×</span>
              <span className="text-[0.6rem] md:text-[0.75rem] font-black italic tracking-[0.1em] uppercase text-primary">
                la NOCHE
              </span>
              <span className="text-white/30">×</span>
              <span className="text-[0.6rem] md:text-[0.75rem] font-bold tracking-[0.2em] uppercase text-orange-400">
                LA DÉBANDADE
              </span>
              <div className="w-6 h-6 rounded-full border border-pink-500 flex items-center justify-center text-pink-500 text-[10px]">
                😊
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
