
"use client"

import React from 'react';
import { Truck, RotateCcw, ShieldCheck, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

const badges = [
  { 
    icon: Truck, 
    title: 'Livraison rapide', 
    desc: 'Chez vous en 48/72h'
  },
  { 
    icon: RotateCcw, 
    title: 'Retours 14j', 
    desc: 'Satisfaite ou remboursée'
  },
  { 
    icon: ShieldCheck, 
    title: 'Paiement sécurisé', 
    desc: 'SSL 256-bit encryption'
  },
  { 
    icon: CreditCard, 
    title: '3× sans frais', 
    desc: 'Avec Klarna ou Alma'
  },
];

export const TrustBadges = () => {
  return (
    <section className="py-16 bg-white border-t border-zay-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-0">
          {badges.map((badge, index) => (
            <motion.div 
              key={badge.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`flex flex-col items-center text-center px-4 space-y-3 ${
                index !== badges.length - 1 ? 'lg:border-r lg:border-zay-border' : ''
              }`}
            >
              <div className="w-10 h-10 flex items-center justify-center text-zay-nude">
                <badge.icon className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h3 className="text-[13px] font-bold text-zay-text uppercase tracking-wider">{badge.title}</h3>
                <p className="text-[11px] text-zay-text-muted italic">{badge.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
