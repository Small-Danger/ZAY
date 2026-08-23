
"use client"

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const FAQ_DATA = [
  {
    category: "Commandes & Paiement",
    items: [
      { q: "Quels sont les moyens de paiement acceptés ?", a: "Nous acceptons les cartes bancaires (Visa, Mastercard, Amex), Apple Pay, ainsi que le paiement en 3 fois sans frais avec Klarna et Alma." },
      { q: "Puis-je modifier ma commande après validation ?", a: "Une fois validée, une commande est rapidement transmise à notre atelier. Si vous souhaitez faire une modification, contactez notre service client sous 2 heures." },
    ]
  },
  {
    category: "Livraison & Suivi",
    items: [
      { q: "Quels sont les délais de livraison ?", a: "Pour la France, comptez 48h à 72h ouvrés. Pour l'international, les délais varient entre 5 et 8 jours selon la destination." },
      { q: "La livraison est-elle offerte ?", a: "La livraison est offerte en France métropolitaine pour toute commande supérieure à 120€." },
    ]
  },
  {
    category: "Retours & Échanges",
    items: [
      { q: "Comment effectuer un retour ?", a: "Vous disposez de 14 jours après réception pour nous retourner un article. Les pièces doivent être dans leur état d'origine avec l'étiquette ZAY intacte." },
      { q: "Les retours sont-ils gratuits ?", a: "Oui, les retours sont offerts pour toutes les commandes expédiées en France métropolitaine." },
    ]
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zay-main">
      <Header />
      <main className="flex-grow pt-40 md:pt-52 pb-24">
        <div className="container mx-auto px-4 max-w-3xl">
          
          <div className="text-center mb-16 space-y-4">
            <span className="text-primary text-[0.65rem] tracking-[0.5em] font-light uppercase">Aide</span>
            <h1 className="text-5xl md:text-6xl font-headline italic text-zay-text font-light">Questions Fréquentes</h1>
            <div className="relative max-w-md mx-auto mt-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zay-text-muted" strokeWidth={1} />
              <Input placeholder="Rechercher une réponse..." className="pl-12 h-12 border-zay-border bg-white rounded-none italic text-sm tracking-wide font-light" />
            </div>
          </div>

          <div className="space-y-16">
            {FAQ_DATA.map((section, idx) => (
              <div key={idx} className="space-y-6">
                <h2 className="text-[0.7rem] tracking-[0.3em] font-light uppercase text-primary border-b border-zay-border pb-4">{section.category}</h2>
                <Accordion type="single" collapsible className="w-full">
                  {section.items.map((item, itemIdx) => (
                    <AccordionItem key={itemIdx} value={`item-${idx}-${itemIdx}`} className="border-b border-zay-border/50">
                      <AccordionTrigger className="text-left text-xs font-light uppercase tracking-widest hover:no-underline py-6">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-zay-text-muted italic leading-loose tracking-wide pb-6 font-light">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="mt-20 p-10 bg-zay-text text-white text-center space-y-6 rounded-none">
            <h3 className="text-2xl font-headline italic font-light">Vous ne trouvez pas votre réponse ?</h3>
            <p className="text-white/60 text-sm tracking-widest italic font-light">Notre équipe est disponible du lundi au vendredi de 9h à 18h.</p>
            <div className="pt-2">
              <a href="/contact" className="inline-block border border-white/20 px-8 py-4 text-[0.65rem] tracking-[0.3em] font-light uppercase hover:bg-white hover:text-zay-text transition-all">
                Nous contacter
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
