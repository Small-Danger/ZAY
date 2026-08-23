
"use client"

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zay-main">
      <Header />
      <main className="flex-grow pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          
          {/* Hero Section */}
          <div className="flex flex-col md:flex-row items-center gap-16 mb-32">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full md:w-3/5 space-y-8"
            >
              <div className="space-y-4">
                <span className="text-primary text-[0.65rem] tracking-[0.5em] font-bold uppercase">L'Héritage</span>
                <h1 className="text-5xl md:text-6xl font-headline italic text-zay-text leading-tight">
                  L'élégance comme <br /> signature.
                </h1>
              </div>
              <p className="text-zay-text-muted text-lg italic leading-relaxed tracking-wide">
                ZAY Atelier est né d'une vision simple : sublimer la femme moderne à travers des pièces qui conjuguent minimalisme contemporain et raffinement intemporel.
              </p>
              <div className="pt-4 flex items-center gap-4 text-zay-text font-bold text-[0.65rem] tracking-[0.3em] uppercase">
                <Sparkles className="text-primary w-4 h-4" />
                Savoir-faire artisanal
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full md:w-2/5 relative aspect-[3/4] bg-zay-gray rounded-sm overflow-hidden shadow-2xl max-w-sm mx-auto"
            >
              <Image 
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=800" 
                alt="Atelier ZAY" 
                fill 
                className="object-cover"
                data-ai-hint="fashion atelier"
              />
            </motion.div>
          </div>

          {/* Philosophy Section */}
          <div className="bg-zay-text text-white p-12 md:p-20 mb-32 rounded-sm shadow-xl">
            <div className="max-w-4xl mx-auto text-center space-y-12">
              <h2 className="text-4xl font-headline italic">Notre Philosophie</h2>
              <div className="grid md:grid-cols-3 gap-12">
                <div className="space-y-4">
                  <h3 className="text-primary text-[0.6rem] tracking-[0.4em] font-bold uppercase">Qualité</h3>
                  <p className="text-white/70 text-sm italic leading-relaxed">Nous sélectionnons les matières les plus nobles comme la soie de mûrier et le cachemire pour des pièces qui durent.</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-primary text-[0.6rem] tracking-[0.4em] font-bold uppercase">Design</h3>
                  <p className="text-white/70 text-sm italic leading-relaxed">Une esthétique épurée qui met en valeur la silhouette sans jamais l'entraver.</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-primary text-[0.6rem] tracking-[0.4em] font-bold uppercase">Engagement</h3>
                  <p className="text-white/70 text-sm italic leading-relaxed">Une production raisonnée et respectueuse pour une mode plus consciente.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Founder Section */}
          <div className="flex flex-col-reverse md:flex-row items-center gap-16">
            <div className="w-full md:w-2/5 relative aspect-[3/4] bg-zay-gray rounded-sm overflow-hidden max-w-sm mx-auto">
              <Image 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800" 
                alt="Fondatrice ZAY" 
                fill 
                className="object-cover"
                data-ai-hint="elegant woman"
              />
            </div>
            <div className="w-full md:w-3/5 space-y-8">
              <h2 className="text-4xl font-headline italic text-zay-text">La Vision de la Créatrice</h2>
              <p className="text-zay-text-muted italic leading-loose tracking-wide">
                "ZAY n'est pas seulement une marque de vêtements, c'est une célébration de la confiance en soi. Chaque couture, chaque bouton est pensé pour que la femme qui porte nos créations se sente invincible, élégante et authentique."
              </p>
              <div className="space-y-1">
                <p className="font-headline text-2xl italic">Zaynab A.</p>
                <p className="text-[0.6rem] tracking-[0.3em] font-bold uppercase text-primary">Fondatrice & Directrice Artistique</p>
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
