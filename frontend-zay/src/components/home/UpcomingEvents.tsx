
"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const events = [
  {
    title: "Vente Privée - Showroom Paris",
    date: "15 JUIN 2024",
    location: "12 RUE DE LA PAIX, PARIS",
    description: "Une immersion exclusive dans l'univers ZAY. Découvrez les pièces de la collection Automne en avant-première.",
    status: "SUR INVITATION"
  },
  {
    title: "Lancement Collection Capsule Été",
    date: "01 JUILLET 2024",
    location: "EN LIGNE & BOUTIQUES",
    description: "Une ode à la lumière et à la légèreté. Des soies aériennes et des coupes solaires.",
    status: "OUVERT À TOUS"
  },
  {
    title: "Pop-up Store - Casablanca",
    date: "10 SEPTEMBRE 2024",
    location: "ANFA PLACE, CASABLANCA",
    description: "ZAY Atelier s'installe au Maroc pour une semaine de mode et de rencontres.",
    status: "ÉVÉNEMENT"
  }
];

export const UpcomingEvents = () => {
  return (
    <section className="py-24 bg-zay-text text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-4">
            <h2 className="text-[1.2rem] md:text-[2.2rem] font-black tracking-[0.25em] uppercase border-l-8 border-primary pl-6">
              ÉVÉNEMENTS EXCLUSIFS
            </h2>
            <p className="text-white/60 text-sm md:text-base italic tracking-widest pl-8">
              Inscrivez ces rendez-vous dans votre agenda ZAY.
            </p>
          </div>
        </div>

        <div className="grid gap-8">
          {events.map((event, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white/5 border border-white/10 p-8 md:p-12 hover:bg-white/10 transition-all duration-500"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-16">
                <div className="flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 border border-primary/30 text-primary">
                  <Calendar size={24} className="mb-2" />
                  <span className="text-[0.6rem] font-bold tracking-tighter text-center leading-tight">
                    {event.date}
                  </span>
                </div>

                <div className="flex-grow space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-[0.6rem] font-black tracking-[0.2em] text-primary uppercase">
                      {event.status}
                    </span>
                    <div className="flex items-center gap-2 text-white/40 text-[0.65rem] tracking-widest uppercase font-bold">
                      <MapPin size={12} /> {event.location}
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-headline italic tracking-wide">
                    {event.title}
                  </h3>
                  <p className="text-white/60 text-sm italic font-light tracking-wide max-w-2xl leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <Button variant="outline" className="rounded-none border-white/20 text-white hover:bg-primary hover:border-primary tracking-[0.2em] text-[0.6rem] font-bold uppercase h-12 px-8">
                    S'INSCRIRE <ArrowRight size={14} className="ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
