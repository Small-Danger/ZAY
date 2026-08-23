
"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useIsWishlisted, useWishlistStore } from '@/store/useWishlistStore';
import { cn } from '@/lib/utils';
import { MediaImage } from '@/components/ui/media-image';

interface ProductCardProps {
  id: string;
  /** Slug API Nest — utilisé pour l’URL PDP si fourni (sans impact visuel). */
  slug?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  badge?: string;
  badgeType?: 'default' | 'new' | 'discount';
  /** Tailles réelles issues des variantes produit. */
  sizes?: string[];
  /** Stock par taille (0 = rupture). */
  sizeStock?: Record<string, number>;
  /** Produit entièrement en rupture. */
  outOfStock?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  id,
  slug,
  name, 
  price, 
  originalPrice,
  image, 
  badge,
  sizes = [],
  sizeStock = {},
  outOfStock = false,
}) => {
  const { toggleItem } = useWishlistStore();
  const wishlisted = useIsWishlisted(id);
  const href = `/produit/${slug || id}`;
  const availableSizes = sizes.filter(Boolean);
  const [sizesOpen, setSizesOpen] = useState(false);

  const imageSrc = image && image.length > 0 ? image : 'https://picsum.photos/seed/placeholder/600/800';

  return (
    <div
      className="flex flex-col space-y-4 relative group w-full"
      onMouseEnter={() => setSizesOpen(true)}
      onMouseLeave={() => setSizesOpen(false)}
    >
      <div className="relative aspect-[3/4] bg-[#F5F5F5] overflow-hidden rounded-none shadow-sm group-hover:shadow-md transition-shadow">
        <Link href={href} className="block w-full h-full">
          <MediaImage
            src={imageSrc}
            alt={name}
            fill
            className={cn(
              "object-cover transition-transform duration-700 group-hover:scale-105",
              outOfStock && "opacity-60",
            )}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </Link>

        {outOfStock && (
          <div className="absolute top-3 left-3 z-20 bg-zay-text text-white text-[0.55rem] font-bold px-3 py-1 uppercase tracking-[0.2em]">
            Rupture
          </div>
        )}

        {/* Tailles : hover desktop + tap mobile */}
        {availableSizes.length > 0 && !outOfStock && (
          <>
            <button
              type="button"
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 md:hidden bg-white/95 border border-black/10 px-3 py-1.5 text-[0.55rem] font-bold uppercase tracking-widest"
              onClick={(e) => {
                e.preventDefault();
                setSizesOpen((o) => !o);
              }}
            >
              Tailles
            </button>
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 bg-white/90 backdrop-blur-md border-t border-black/5 z-20",
                sizesOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-full opacity-0 pointer-events-none md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-hover:pointer-events-auto",
              )}
            >
              <p className="text-[9px] uppercase tracking-[0.2em] text-black/60 mb-3 font-bold text-center">
                Sélectionner votre taille
              </p>
              <div className="flex justify-center flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const stock = sizeStock[size];
                  const unavailable = stock != null ? stock <= 0 : false;
                  if (unavailable) {
                    return (
                      <span
                        key={size}
                        className="min-w-8 h-8 px-1.5 flex items-center justify-center text-[10px] font-bold border border-black/10 bg-white/60 text-black/30 line-through cursor-not-allowed"
                        title="Rupture"
                      >
                        {size}
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={size}
                      href={`${href}?size=${encodeURIComponent(size)}`}
                      className="min-w-8 h-8 px-1.5 flex items-center justify-center text-[10px] font-bold border border-black/10 bg-white/90 hover:bg-black hover:text-white hover:border-black transition-all"
                    >
                      {size}
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <button 
          onClick={(e) => {
            e.preventDefault();
            toggleItem({ id, name, price, image: imageSrc });
          }}
          className="absolute top-3 right-3 z-30 p-2.5 bg-white/80 rounded-full backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
        >
          <Heart 
            className={cn(
              "w-4 h-4 md:w-5 md:h-5 transition-all",
              wishlisted ? "fill-primary text-primary" : "text-black/40"
            )} 
          />
        </button>

        {badge && !outOfStock && (
          <div className="absolute top-3 left-3 z-10 bg-primary text-white text-[0.55rem] md:text-[0.65rem] font-bold px-4 py-1.5 rounded-none uppercase tracking-[0.25em]">
            {badge}
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-1.5 px-0.5">
        <h3 className="text-[12px] md:text-[14px] font-bold text-black tracking-widest uppercase line-clamp-1 group-hover:text-primary transition-colors">
          {name}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm md:text-base font-bold font-sans">{price} €</span>
          {originalPrice != null && originalPrice > price && (
            <span className="text-xs md:text-sm text-muted-foreground line-through italic font-light opacity-50">{originalPrice} €</span>
          )}
        </div>
      </div>
    </div>
  );
};
