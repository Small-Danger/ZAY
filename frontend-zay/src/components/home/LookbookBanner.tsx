
"use client"

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';

export const LookbookBanner = () => {
  const imgData = PlaceHolderImages.find(img => img.id === "look-parisienne");

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative flex flex-col lg:flex-row items-stretch bg-black rounded-[2px] shadow-2xl">
          {/* Content Side */}
          <div className="w-full lg:w-1/2 p-12 md:p-24 flex flex-col justify-center space-y-10 z-10">
            <div className="space-y-4">
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 0.6, x: 0 }}
                viewport={{ once: true }}
                className="text-white text-[0.65rem] tracking-[0.6em] font-black uppercase"
              >
                EDITORIAL
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-white text-5xl md:text-7xl font-headline italic leading-[0.9]"
              >
                Lookbook <br /> 
                <span className="text-primary glow-pink">Printemps 2026</span>
              </motion.h2>
            </div>

            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.8, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-white/80 italic font-light tracking-[0.1em] max-w-md leading-loose text-sm md:text-lg"
            >
              Une exploration de la féminité moderne à travers des textures nobles et des silhouettes audacieuses. Découvrez l'essence même de l'Atelier ZAY.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                asChild
                className="bg-primary text-white hover:bg-white hover:text-black px-12 py-8 rounded-none text-[0.7rem] tracking-[0.4em] font-black uppercase transition-all duration-500 shadow-xl shadow-primary/20 group"
              >
                <Link href="/catalogue">
                  VOIR LA COLLECTION <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-2" />
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Image Side */}
          <div className="w-full lg:w-1/2 h-[500px] lg:h-auto relative">
            <Image
              src={imgData?.imageUrl || 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=1200'}
              alt="Editorial ZAY"
              fill
              className="object-cover grayscale hover:grayscale-0 transition-all duration-1000"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {/* Artistic overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent lg:block hidden" />
          </div>
        </div>
      </div>
    </section>
  );
};
