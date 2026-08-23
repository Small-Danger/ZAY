
"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const PromoBanner = () => {
  return (
    <section className="bg-zay-text py-6 md:py-8 border-y border-white/5">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-center"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary glow-pink" />
            <span className="text-white text-[0.6rem] md:text-[0.75rem] tracking-[0.4em] font-black uppercase">
              OFFRE EXCEPTIONNELLE
            </span>
          </div>
          
          <div className="h-4 w-px bg-white/10 hidden md:block" />

          <p className="text-white text-[0.7rem] md:text-[0.9rem] tracking-[0.2em] font-medium uppercase">
            <span className="text-primary glow-pink font-bold">-15%</span> SUR VOTRE PREMIÈRE COMMANDE AVEC LE CODE : <span className="text-primary glow-pink font-black border-b-2 border-primary/30 pb-0.5 ml-2">ZAY15</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
