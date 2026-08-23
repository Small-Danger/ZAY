"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';

export const BottomNav = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((state) => state.totalItems());

  useEffect(() => {
    setMounted(true);
    void useWishlistStore.persist.rehydrate();
  }, []);

  const navItems = [
    { icon: Home, label: 'ACCUEIL', href: '/' },
    { icon: Search, label: 'BOUTIQUE', href: '/catalogue' },
    { icon: ShoppingBag, label: 'PANIER', href: '/panier', badge: true },
    { icon: Heart, label: 'FAVORIS', href: '/compte/favoris' },
    { icon: User, label: 'MON ZAY', href: '/compte' },
  ];

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black text-white h-[65px] px-2 z-50 flex items-center justify-around md:hidden border-t border-white/5">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-16 transition-all",
              isActive ? "text-primary" : "text-white/60"
            )}
          >
            <div className="relative">
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {item.badge && mounted && totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[0.5rem] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-black">
                  {totalItems}
                </span>
              )}
            </div>
            <span className={cn(
              "text-[0.5rem] font-bold tracking-tight uppercase",
              isActive ? "text-primary" : "text-white/40"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};