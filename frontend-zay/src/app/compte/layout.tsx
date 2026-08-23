"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { User, ShoppingBag, Heart, MapPin, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  clearSession,
  getAccessToken,
  getSessionUser,
  type SessionUser,
} from '@/lib/auth/session';
import { fetchMe } from '@/lib/api/auth';
import { useCartStore } from '@/store/useCartStore';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/connexion');
      return;
    }
    setUser(getSessionUser());
    void fetchMe()
      .then(setUser)
      .catch(() => {
        useCartStore.getState().dropLocalCart();
        clearSession();
        router.replace('/connexion');
      });
  }, [router, pathname]);

  const handleLogout = () => {
    useCartStore.getState().dropLocalCart();
    clearSession();
    router.push('/connexion');
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'Cliente';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || 'CL';

  const menuItems = [
    { name: 'Mon Profil', href: '/compte', icon: User },
    { name: 'Mes Commandes', href: '/compte/commandes', icon: ShoppingBag },
    { name: 'Mes Favoris', href: '/compte/favoris', icon: Heart },
    { name: 'Mes Adresses', href: '/compte/adresses', icon: MapPin },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zay-main">
      <Header />
      <main className="flex-grow pt-40 md:pt-52 pb-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            
            {/* Sidebar Desktop */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="bg-white p-8 space-y-8 border border-zay-border">
                <div className="flex items-center gap-4 border-b border-zay-border pb-6">
                  <div className="w-12 h-12 rounded-full bg-zay-rose-pale flex items-center justify-center text-primary font-light">{initials}</div>
                  <div>
                    <h3 className="text-sm font-light tracking-tight">{displayName}</h3>
                    <p className="text-[0.65rem] text-zay-text-muted font-light">{user?.email || ''}</p>
                  </div>
                </div>
                
                <nav className="flex flex-col space-y-2">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-[0.65rem] tracking-[0.2em] font-light uppercase transition-all",
                        pathname === item.href 
                          ? "bg-primary text-white" 
                          : "text-zay-text-muted hover:bg-zay-main hover:text-primary"
                      )}
                    >
                      <item.icon size={16} strokeWidth={1} />
                      {item.name}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-[0.65rem] tracking-[0.2em] font-light uppercase text-red-500 hover:bg-red-50 transition-all mt-4"
                  >
                    <LogOut size={16} strokeWidth={1} /> Déconnexion
                  </button>
                </nav>
              </div>
            </aside>

            {/* Mobile Horizontal Menu */}
            <div className="lg:hidden -mx-4 px-4 overflow-x-auto no-scrollbar border-b border-zay-border pb-4 mb-2">
              <div className="flex gap-3 min-w-max">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-5 py-3 text-[0.6rem] tracking-[0.15em] font-light uppercase border transition-all",
                      pathname === item.href 
                        ? "border-primary bg-primary text-white" 
                        : "border-zay-border bg-white text-zay-text-muted"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow bg-white p-6 md:p-12 border border-zay-border shadow-sm min-h-[500px]">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
