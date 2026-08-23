"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/product/ProductCard';
import { isProductFullyOutOfStock, sizeStockMap } from '@/lib/product-stock';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useProducts } from '@/hooks/use-products';
import type { UiProduct } from '@/lib/api';

export const NewArrivals = ({
  initialProducts,
}: {
  initialProducts?: UiProduct[];
}) => {
  const { data: products, loading } = useProducts({}, initialProducts);
  const displayProducts = products.slice(0, 8);

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12 lg:mb-20">
          <h2 className="text-[1.2rem] md:text-[1.6rem] lg:text-[2.2rem] font-black tracking-[0.25em] uppercase text-black border-l-8 border-primary pl-6">NOS COUPS DE CŒUR</h2>
          <Link href="/catalogue" className="text-primary text-[0.7rem] md:text-[0.9rem] font-black tracking-[0.2em] flex items-center gap-2 uppercase group">
            VOIR TOUT <span className="transition-transform group-hover:translate-x-2">→</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20 italic text-muted-foreground text-sm">
            La nouvelle sélection arrive bientôt dans l'atelier ZAY.
          </div>
        ) : (
          <div className="flex overflow-x-auto no-scrollbar gap-6 md:grid md:grid-cols-2 lg:grid-cols-4 pb-4">
            {displayProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="min-w-[280px] md:min-w-0"
              >
                <ProductCard 
                  id={product.id}
                  slug={product.slug}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  image={product.image}
                  category={product.category}
                  badge={product.badge || "NEW"}
                  badgeType={product.isPromo ? 'discount' : (product.isNew ? 'new' : 'default')}
                  sizes={product.sizes}
                  sizeStock={sizeStockMap(product)}
                  outOfStock={isProductFullyOutOfStock(product)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
