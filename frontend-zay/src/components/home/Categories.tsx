"use client"

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, GraduationCap, Moon, Palmtree, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/use-categories';
import { resolveMediaUrl } from '@/lib/api';
import { MediaImage } from '@/components/ui/media-image';

const RingIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="15" r="6" />
    <path d="M9 7l3-4 3 4-3 2-3-2z" />
  </svg>
);

const occasions = [
  { icon: Sparkles, name: 'NEW IN', sub: 'Les nouveautés', href: '/catalogue?new=true' },
  { icon: RingIcon, name: 'OCCASIONS', sub: 'Mariages, cérémonies', href: '/catalogue?category=Robes' },
  { icon: GraduationCap, name: 'BAL / GRADUATION', sub: 'Brillez le grand jour', href: '/catalogue?category=Robes' },
  { icon: Moon, name: 'NIGHT OUT', sub: 'Soirées & events', href: '/catalogue?category=Ensembles' },
  { icon: Palmtree, name: 'IBIZA EDIT', sub: 'Vacances & sunset', href: '/catalogue?category=Ensembles' },
];

/** Fallback si la catégorie API n’a pas encore d’image uploadée */
const FALLBACK_IMAGES: Record<string, string> = {
  ROBES: '/robes.png',
  JUPES: '/jupes.png',
  ENSEMBLES: '/ensembles.png',
  TAILLEURS: '/ensembles-tailleurs.png',
  'TOPS & CHEMISES': '/tops.png',
  ACCESSOIRES: '/accessoires.png',
};

export const Categories = () => {
  const { data: categories, loading } = useCategories();

  const displayCategories =
    categories.length > 0
      ? categories.map((cat) => ({
          name: cat.name,
          image: resolveMediaUrl(
            cat.image,
            FALLBACK_IMAGES[cat.name] || '/robes.png',
          ),
        }))
      : Object.entries(FALLBACK_IMAGES).map(([name, image]) => ({
          name,
          image,
        }));

  return (
    <section className="bg-white">
      <div className="border-b border-gray-50 overflow-hidden">
        <div className="container mx-auto px-0">
          <div className="flex overflow-x-auto no-scrollbar md:justify-center items-stretch">
            {occasions.map((occ, i) => (
              <Link 
                key={i} 
                href={occ.href} 
                className={cn(
                  "flex flex-col items-center text-center py-8 md:py-12 px-6 min-w-[150px] md:min-w-[200px] flex-1 group transition-colors hover:bg-gray-50/50",
                  i !== occasions.length - 1 && "border-r border-black/[0.04]"
                )}
              >
                <div className="w-10 h-10 flex items-center justify-center text-primary mb-3">
                  <occ.icon strokeWidth={1.2} size={28} />
                </div>
                <span className="text-[0.6rem] md:text-[0.7rem] font-bold tracking-[0.15em] uppercase mb-1 text-black">
                  {occ.name}
                </span>
                <span className="text-[0.5rem] md:text-[0.6rem] text-muted-foreground uppercase tracking-tight italic">
                  {occ.sub}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 lg:mb-20">
          <h2 className="text-[1.1rem] md:text-[1.8rem] lg:text-[2.2rem] font-black tracking-[0.2em] md:tracking-[0.25em] uppercase text-black border-l-8 border-primary pl-6">
            SHOPPEZ PAR CATÉGORIE
          </h2>
          <Link href="/catalogue" className="text-primary text-[0.7rem] md:text-[0.9rem] font-black tracking-[0.2em] flex items-center gap-2 uppercase group md:ml-auto">
            VOIR TOUT <span className="transition-transform group-hover:translate-x-2">→</span>
          </Link>
        </div>
        
        {loading && categories.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex overflow-x-auto no-scrollbar gap-6 md:gap-10 lg:gap-14 pb-4 md:justify-between">
            {displayCategories.map((cat, i) => (
              <Link
                key={`${cat.name}-${i}`}
                href={`/catalogue?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center text-center min-w-[110px] md:min-w-[150px] group"
              >
                <div className="relative w-28 h-28 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden mb-5 border border-gray-50 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:shadow-primary/10">
                  <MediaImage
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    data-ai-hint="fashion item close up"
                  />
                </div>
                <span className="text-[0.6rem] md:text-[0.75rem] lg:text-[0.85rem] font-black tracking-[0.2em] uppercase whitespace-nowrap text-black transition-colors group-hover:text-primary">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
