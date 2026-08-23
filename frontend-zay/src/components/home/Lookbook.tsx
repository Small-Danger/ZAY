
"use client"

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';

const looks = [
  {
    id: 1,
    title: "La Parisienne",
    text: "Un matin d'avril, entre deux rendez-vous.",
    imageId: "look-parisienne",
    products: [
      { name: "Veste Tailoring", price: 189, href: "/produit/veste-tailoring" },
      { name: "Pantalon Fluide", price: 129, href: "/produit/pantalon-fluide" }
    ],
    reverse: false
  },
  {
    id: 2,
    title: "Week-end Riviera",
    text: "La douceur du soleil, la légèreté du lin.",
    imageId: "look-riviera",
    products: [
      { name: "Robe Aurore", price: 189, href: "/produit/robe-aurore" },
      { name: "Mules Dorées", price: 89, href: "/produit/mules-dorees" }
    ],
    reverse: true
  },
  {
    id: 3,
    title: "Soirée Minimaliste",
    text: "Quand moins devient tout.",
    imageId: "look-minimaliste",
    products: [
      { name: "Top Soie Noir", price: 149, href: "/produit/top-soie-noir" },
      { name: "Jupe Midi", price: 159, href: "/produit/jupe-midi" }
    ],
    reverse: false
  }
];

export const Lookbook = () => {
  return (
    <section className="bg-zay-main">
      <div className="container mx-auto px-4 py-24">
        {/* Header Section */}
        <div className="text-center mb-24 space-y-4">
          <h2 className="text-5xl md:text-7xl font-headline italic text-zay-text">Lookbook — Printemps 26</h2>
          <p className="text-zay-text-muted tracking-[0.2em] italic text-sm md:text-base">
            L'élégance du quotidien, réinventée.
          </p>
        </div>

        {/* Looks List */}
        <div className="space-y-0">
          {looks.map((look) => {
            const imgData = PlaceHolderImages.find(img => img.id === look.imageId);
            return (
              <div 
                key={look.id} 
                className={`flex flex-col ${look.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center min-h-[600px] w-full`}
              >
                {/* Image Area */}
                <div className="w-full md:w-1/2 h-[500px] md:h-[700px] relative overflow-hidden">
                  <Image
                    src={imgData?.imageUrl || 'https://picsum.photos/seed/placeholder/800/1200'}
                    alt={look.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* Content Area */}
                <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center space-y-12">
                  <div className="space-y-4">
                    <h3 className="text-4xl md:text-5xl font-headline italic text-zay-text">{look.title}</h3>
                    <p className="text-[#5C4A3A] text-lg md:text-xl italic font-light tracking-wide leading-relaxed">
                      "{look.text}"
                    </p>
                  </div>

                  {/* Product Tagging */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {look.products.map((product) => (
                      <Link 
                        key={product.name}
                        href={product.href}
                        className="group flex flex-col space-y-2 bg-white/50 p-4 backdrop-blur-sm border border-zay-border hover:shadow-lg transition-all duration-300"
                      >
                        <span className="text-[0.65rem] tracking-[0.2em] font-bold uppercase text-zay-text-muted">Featured</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium tracking-tight group-hover:underline decoration-zay-rose/30 underline-offset-4">{product.name}</span>
                          <span className="text-sm font-bold text-zay-rose">{product.price} €</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final CTA */}
        <div className="mt-24 text-center">
          <Button 
            asChild
            className="bg-zay-rose text-white px-12 py-7 rounded-full text-[0.7rem] tracking-[0.4em] font-bold uppercase hover:bg-zay-text transition-all shadow-xl shadow-zay-rose/20"
          >
            <Link href="/catalogue">
              VOIR TOUTE LA COLLECTION <ArrowRight className="ml-3 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
