"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MediaImage } from '@/components/ui/media-image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Plus,
  Minus,
  ChevronRight,
  Check,
  Loader2,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useCartStore } from '@/store/useCartStore';
import { useIsWishlisted, useWishlistStore } from '@/store/useWishlistStore';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';
import { motion, AnimatePresence } from 'framer-motion';
import { useProduct } from '@/hooks/use-products';
import type { UiProduct } from '@/lib/api';
import {
  getColorTotalStock,
  getSizeTotalStock,
  getVariantStock,
  isProductFullyOutOfStock,
  findVariant,
} from '@/lib/product-stock';

export function ProductView({ initialProduct }: { initialProduct: UiProduct }) {
  const { slug } = useParams();
  const idOrSlug = typeof slug === 'string' ? slug : slug?.[0];
  const { data: product, loading } = useProduct(idOrSlug, initialProduct);

  const sizes = useMemo(() => product?.sizes ?? [], [product]);
  const colors = useMemo(() => product?.colors ?? [], [product]);
  const fullyOut = product ? isProductFullyOutOfStock(product) : false;

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<{
    name: string;
    hex: string;
  } | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const gallery = product?.images?.length
    ? product.images
    : product?.image
      ? [product.image]
      : [];

  const availableStock = useMemo(() => {
    if (!product) return 0;
    if (fullyOut) return 0;
    if (product.variants.length === 0) return Math.max(0, product.stock);
    if (sizes.length > 0 && !selectedSize) return 0;
    if (colors.length > 0 && !selectedColor) return 0;
    return getVariantStock(
      product,
      selectedSize,
      selectedColor?.name,
    );
  }, [product, fullyOut, sizes.length, colors.length, selectedSize, selectedColor]);

  useEffect(() => {
    if (!product || colors.length === 0) {
      setSelectedColor(null);
      return;
    }
    setSelectedColor((prev) => {
      if (prev && getColorTotalStock(product, prev.name, selectedSize) > 0) {
        return prev;
      }
      return (
        colors.find(
          (c) => getColorTotalStock(product, c.name, selectedSize) > 0,
        ) || null
      );
    });
  }, [product, colors, selectedSize]);

  useEffect(() => {
    setActiveImage(product?.image ?? null);
  }, [product?.id, product?.image]);

  useEffect(() => {
    if (!product) return;
    if (typeof window === 'undefined') return;
    const fromUrl = new URLSearchParams(window.location.search).get('size');
    if (fromUrl && sizes.includes(fromUrl) && getSizeTotalStock(product, fromUrl) > 0) {
      setSelectedSize(fromUrl);
      return;
    }
    const firstInStock = sizes.find((s) => getSizeTotalStock(product, s) > 0);
    setSelectedSize(firstInStock ?? null);
  }, [product?.id, sizes]);

  useEffect(() => {
    if (availableStock > 0 && quantity > availableStock) {
      setQuantity(availableStock);
    }
    if (availableStock > 0 && quantity < 1) {
      setQuantity(1);
    }
  }, [availableStock, quantity]);

  const { addItem } = useCartStore();
  const { toggleItem } = useWishlistStore();
  const wishlisted = useIsWishlisted(product?.id);

  const handleAddToCart = () => {
    if (!product) return;
    if (fullyOut || availableStock <= 0) {
      notify('Ce produit est en rupture de stock.');
      return;
    }
    if (sizes.length > 0 && !selectedSize) {
      notify('Veuillez sélectionner une taille');
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      notify('Veuillez sélectionner une couleur');
      return;
    }

    const variant =
      findVariant(product.variants, selectedSize, selectedColor?.name) ??
      product.variants.find(
        (v) =>
          (!selectedSize ||
            v.size.toUpperCase() === selectedSize.toUpperCase()) &&
          v.stock > 0,
      );

    const result = addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: variant?.size || selectedSize || 'Unique',
      color: variant?.colorName || selectedColor?.name || 'Standard',
      quantity,
      maxStock: availableStock,
    });

    if (!result.ok) {
      notify(result.reason || 'Stock insuffisant');
      return;
    }

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zay-main">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-zay-main">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center space-y-4">
          <h1 className="text-2xl font-headline italic font-bold">
            Produit introuvable
          </h1>
          <Button asChild variant="outline" className="font-bold">
            <Link href="/catalogue">Retour au catalogue</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const installmentPrice = (product.price / 3).toFixed(2);
  const canAdd = !fullyOut && availableStock > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-grow pt-40 md:pt-52 pb-24">
        <div className="container mx-auto px-4 md:px-8">
          <nav className="flex items-center space-x-2 text-[11px] text-muted-foreground mb-8 uppercase tracking-widest font-bold">
            <Link href="/" className="hover:text-primary">
              Accueil
            </Link>
            <ChevronRight className="w-3 h-3" strokeWidth={1} />
            <Link href="/catalogue" className="hover:text-primary">
              {product.category}
            </Link>
            <ChevronRight className="w-3 h-3" strokeWidth={1} />
            <span className="text-foreground truncate">{product.name}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-12 xl:gap-20">
            <div className="lg:w-[55%] flex flex-col-reverse md:flex-row gap-4">
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar md:w-24 shrink-0">
                {gallery.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveImage(src)}
                    className={cn(
                      'relative aspect-[4/5] w-20 md:w-full flex-shrink-0 border transition-colors',
                      (activeImage || product.image) === src
                        ? 'border-primary/40'
                        : 'border-transparent hover:border-primary/20',
                    )}
                  >
                    <MediaImage
                      src={src}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>

              <div className="flex-grow relative aspect-[4/5] bg-zay-gray overflow-hidden group">
                <MediaImage
                  src={activeImage || product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  priority
                />
                {fullyOut && (
                  <div className="absolute inset-0 bg-white/55 flex items-center justify-center z-10">
                    <Badge className="bg-zay-text text-white text-[9px] tracking-[0.2em] px-4 py-1.5 font-bold uppercase rounded-none border-none">
                      Rupture de stock
                    </Badge>
                  </div>
                )}
                {product.isNew && !fullyOut && (
                  <div className="absolute top-6 left-6 z-10">
                    <Badge className="bg-primary text-white text-[9px] tracking-[0.2em] px-4 py-1.5 font-bold uppercase rounded-none border-none">
                      Nouveauté
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:w-[45%] flex flex-col space-y-8">
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-headline text-zay-text leading-tight font-bold">
                  {product.name}
                </h1>

                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold font-sans text-zay-text">
                    {product.price} €
                  </span>
                  {product.originalPrice != null &&
                    product.originalPrice > product.price && (
                      <span className="text-lg text-muted-foreground line-through font-sans font-light opacity-50">
                        {product.originalPrice} €
                      </span>
                    )}
                </div>

                <p className="text-[11px] text-muted-foreground italic tracking-wide font-bold">
                  ou 3×{' '}
                  <span className="text-zay-text">{installmentPrice} €</span>{' '}
                  sans frais — Klarna · Alma
                </p>
              </div>

              {colors.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zay-text">
                      Couleur
                    </span>
                    <span className="text-[10px] italic text-muted-foreground font-bold">
                      {selectedColor?.name}
                    </span>
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    {colors.map((color) => {
                      const colorStock = getColorTotalStock(
                        product,
                        color.name,
                        selectedSize,
                      );
                      const unavailable = colorStock <= 0;
                      return (
                        <button
                          key={color.name}
                          type="button"
                          disabled={unavailable}
                          onClick={() => setSelectedColor(color)}
                          title={
                            unavailable
                              ? `${color.name} — rupture`
                              : color.name
                          }
                          className={cn(
                            'w-10 h-10 rounded-full border-2 p-1 transition-all duration-300 relative',
                            selectedColor?.name === color.name
                              ? 'border-primary scale-110'
                              : 'border-transparent',
                            unavailable && 'opacity-40 cursor-not-allowed',
                          )}
                        >
                          <div
                            className="w-full h-full rounded-full"
                            style={{ backgroundColor: color.hex }}
                          />
                          {unavailable && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="w-8 h-px bg-zay-text/70 rotate-45" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {sizes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zay-text">
                      Taille
                    </span>
                    <button
                      type="button"
                      className="text-[9px] uppercase tracking-widest text-muted-foreground underline underline-offset-4 hover:text-primary transition-colors font-bold"
                    >
                      Guide des tailles
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      const sizeStock =
                        colors.length > 0 && selectedColor
                          ? getVariantStock(
                              product,
                              size,
                              selectedColor.name,
                            )
                          : getSizeTotalStock(product, size);
                      const unavailable = sizeStock <= 0;
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={unavailable}
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            'px-6 py-3 border text-[10px] font-bold tracking-widest transition-all duration-300 relative',
                            selectedSize === size && !unavailable
                              ? 'bg-zay-text text-white border-zay-text'
                              : 'bg-white text-zay-text border-zay-border hover:border-primary',
                            unavailable &&
                              'opacity-40 cursor-not-allowed line-through hover:border-zay-border',
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSize && availableStock > 0 && availableStock <= 3 && (
                    <p className="text-[0.65rem] text-primary font-bold uppercase tracking-widest">
                      Plus que {availableStock} en stock
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col space-y-4 pt-4">
                <div className="flex gap-4">
                  <div className="flex items-center border border-zay-border px-4 py-2 bg-white">
                    <button
                      type="button"
                      disabled={!canAdd}
                      onClick={() =>
                        setQuantity(Math.max(1, quantity - 1))
                      }
                      className="p-2 text-zay-text hover:text-primary transition-colors disabled:opacity-30"
                    >
                      <Minus className="w-3 h-3" strokeWidth={1} />
                    </button>
                    <span className="px-6 text-xs font-bold tabular-nums min-w-[3rem] text-center">
                      {canAdd ? quantity : 0}
                    </span>
                    <button
                      type="button"
                      disabled={!canAdd || quantity >= availableStock}
                      onClick={() =>
                        setQuantity(
                          Math.min(availableStock, quantity + 1),
                        )
                      }
                      className="p-2 text-zay-text hover:text-primary transition-colors disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" strokeWidth={1} />
                    </button>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    disabled={!canAdd}
                    className={cn(
                      'flex-grow py-8 rounded-none text-[10px] font-bold uppercase tracking-[0.25em] transition-all relative overflow-hidden disabled:opacity-50',
                      isAdded
                        ? 'bg-green-600'
                        : 'bg-primary hover:bg-zay-text',
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {!canAdd ? (
                        <motion.span
                          key="oos"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                        >
                          Rupture de stock
                        </motion.span>
                      ) : isAdded ? (
                        <motion.span
                          key="added"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" strokeWidth={1} />{' '}
                          AJOUTÉ !
                        </motion.span>
                      ) : (
                        <motion.span
                          key="add"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                        >
                          Ajouter au panier
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={() =>
                    toggleItem({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image,
                    })
                  }
                  className="w-full py-8 rounded-none border-zay-border text-zay-text hover:bg-zay-main text-[10px] font-bold uppercase tracking-[0.25em] flex gap-3 transition-colors"
                >
                  <Heart
                    className={cn(
                      'w-4 h-4',
                      wishlisted && 'fill-primary text-primary',
                    )}
                    strokeWidth={1}
                  />
                  {wishlisted
                    ? 'Déjà dans vos favoris'
                    : 'Ajouter aux favoris'}
                </Button>
              </div>

              <div className="pt-8 border-t border-zay-border">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="description" className="border-none">
                    <AccordionTrigger className="text-[10px] font-bold uppercase tracking-[0.2em] hover:no-underline">
                      Description
                    </AccordionTrigger>
                    <AccordionContent className="text-xs leading-relaxed italic text-muted-foreground font-bold tracking-wide pt-4">
                      {product.description ||
                        "Une pièce d'exception conçue pour sublimer votre silhouette."}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
