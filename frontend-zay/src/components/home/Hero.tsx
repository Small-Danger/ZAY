
"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export const Hero = () => {
  return (
    <section className="relative h-[600px] md:h-[800px] lg:h-[850px] mt-[135px] md:mt-[105px] lg:mt-[125px] bg-black overflow-hidden">
      <Image
        src="/hero.png"
        alt="ZAY Moment"
        fill
        className="object-cover object-center md:object-[center_20%] opacity-90"
        priority
        data-ai-hint="elegant woman pink dress night palms"
      />
      
      {/* Overlay for depth */}
      <div className="absolute inset-0 hero-overlay" />

      <div className="container mx-auto px-6 h-full flex items-center relative z-10">
        <div className="max-w-xl lg:max-w-2xl space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <span className="text-primary glow-pink text-[0.6rem] md:text-[0.85rem] tracking-[0.5em] md:tracking-[0.6em] font-bold uppercase mb-2">
              FIND YOUR
            </span>
            <h1 className="text-7xl md:text-[140px] lg:text-[180px] font-headline text-primary leading-[0.85] logo-spacing glow-pink-strong uppercase mb-2">
              ZAY
            </h1>
            <span className="text-primary glow-pink text-[0.6rem] md:text-[0.85rem] tracking-[0.5em] md:tracking-[0.6em] font-bold uppercase mt-2">
              MOMENT
            </span>
            {/* Pink horizontal line */}
            <div className="w-10 md:w-16 h-[1.5px] bg-primary glow-pink mt-6 md:mt-10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-6 md:space-y-10"
          >
            <div className="space-y-1 md:space-y-3">
              <p className="text-white text-base md:text-2xl font-light tracking-widest">
                Des robes pour vos moments
              </p>
              <p className="text-primary text-3xl md:text-6xl font-cursive glow-pink">
                inoubliables
              </p>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link 
                href="/catalogue"
                className="inline-block border-2 border-primary box-glow-pink text-white px-8 md:px-14 py-4 md:py-6 rounded-xl text-[0.65rem] md:text-[0.75rem] tracking-[0.3em] md:tracking-[0.4em] font-bold uppercase hover:bg-primary transition-all duration-300"
              >
                DÉCOUVRIR LA COLLECTION
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
