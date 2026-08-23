
"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Search, User } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { cn } from '@/lib/utils';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.totalItems());

  useEffect(() => {
    setMounted(true);
    void useWishlistStore.persist.rehydrate();
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Accueil', href: '/' },
    { name: 'Catalogue', href: '/catalogue' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* 1. Top Announcement Bar */}
        <div className="bg-black text-white py-2.5 flex items-center justify-center gap-1">
          <span className="text-[0.6rem] md:text-[0.65rem] tracking-[0.2em] font-light uppercase text-white">
            ✦ NOUVELLE <span className="text-primary">COLLECTION</span> DISPONIBLE ✦
          </span>
        </div>

        {/* 2. Main Header */}
        <header className={cn(
          "bg-white transition-all duration-300 px-4 md:px-8",
          isScrolled ? "py-2 md:py-3 shadow-sm" : "py-4 md:py-6"
        )}>
          <div className="container mx-auto flex flex-col gap-3 md:gap-0">
            <div className="flex items-center justify-between">
              {/* Left: Search Icon (Mobile) & Nav (Desktop) */}
              <div className="flex items-center gap-6">
                <Link href="/catalogue" className="md:hidden p-1">
                  <Search className="w-6 h-6 text-black" />
                </Link>
                <nav className="hidden md:flex items-center gap-8">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      className={cn(
                        "text-[0.65rem] tracking-[0.2em] font-light uppercase hover:text-primary transition-colors",
                        pathname === link.href ? "text-primary" : "text-black"
                      )}
                    >
                      {link.name}
                    </Link>
                  ))}
                </nav>
              </div>
              
              {/* Center: Logo */}
              <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                <span className="font-headline text-[28px] md:text-[42px] lg:text-[52px] logo-spacing text-black uppercase leading-none transition-all font-light">
                  Z A Y
                </span>
              </Link>

              {/* Right: User & Cart */}
              <div className="flex items-center gap-2 md:gap-6">
                <Link href="/compte" className="hidden md:flex items-center gap-2 text-[0.6rem] tracking-widest font-light uppercase hover:text-primary">
                   <User className="w-5 h-5" />
                   <span className="hidden lg:inline">Mon Compte</span>
                </Link>
                <Link href="/compte" className="md:hidden">
                  <User className="w-6 h-6 text-black" />
                </Link>
                <button onClick={() => setIsCartOpen(true)} className="relative flex items-center gap-2 text-[0.6rem] tracking-widest font-light uppercase hover:text-primary">
                  <ShoppingBag className="w-6 h-6 md:w-5 md:h-5 text-black hover:text-primary transition-colors" />
                  <span className="hidden lg:inline">Panier</span>
                  {mounted && (
                    <span className="absolute -top-1.5 -right-1.5 md:static bg-primary text-white text-[0.55rem] font-light w-4 h-4 rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
