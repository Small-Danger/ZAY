"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Tag, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  Bell,
  Grid,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  clearSession,
  getSessionUser,
  isAdminSession,
  type SessionUser,
} from '@/lib/auth/session';
import { fetchContactUnreadCount } from '@/lib/api/contact';
import { unlockDocumentBody } from '@/components/ui/dialog';
import { useCartStore } from '@/store/useCartStore';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Produits', href: '/admin/produits', icon: Package },
  { name: 'Catégories', href: '/admin/categories', icon: Grid },
  { name: 'Commandes', href: '/admin/commandes', icon: ShoppingBag },
  { name: 'Promos', href: '/admin/promos', icon: Tag },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
];

const PREFETCH_ROUTES = [
  '/admin/produits',
  '/admin/categories',
  '/admin/commandes',
  '/admin/promos',
  '/admin/clientes',
  '/admin/settings',
  '/admin/messages',
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(() => getSessionUser());
  const [ready, setReady] = useState(() => isAdminSession());
  const [newMessages, setNewMessages] = useState(0);
  const [navPending, setNavPending] = useState(false);

  useEffect(() => {
    if (!isAdminSession()) {
      setReady(false);
      router.replace('/connexion');
      return;
    }
    setUser(getSessionUser());
    setReady(true);
  }, [router]);

  // Débloque l’UI si une modale/menu a laissé body en pointer-events:none
  useEffect(() => {
    unlockDocumentBody();
    setNavPending(false);
  }, [pathname]);

  // Badge messages : COUNT léger, pas la liste complète
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const loadBadge = async () => {
      try {
        const count = await fetchContactUnreadCount();
        if (!cancelled) setNewMessages(count);
      } catch {
        // ignore badge errors
      }
    };
    void loadBadge();
    const id = window.setInterval(loadBadge, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [ready, pathname]);

  // Compile les pages admin en arrière-plan après le premier écran
  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => {
      PREFETCH_ROUTES.forEach((href) => {
        void router.prefetch(href);
      });
    }, 700);
    return () => window.clearTimeout(t);
  }, [ready, router]);

  const handleLogout = () => {
    useCartStore.getState().dropLocalCart();
    clearSession();
    router.push('/connexion');
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'Admin User';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || 'AU';

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-zay-text text-white">
      <div className="p-8 border-b border-white/10">
        <Link href="/admin" className="flex flex-col group">
          <span className="font-headline text-3xl tracking-[0.3em] uppercase leading-none group-hover:text-primary transition-colors">ZAY</span>
          <span className="text-[0.5rem] tracking-[0.5em] font-light uppercase text-white/50 mt-1">Admin Panel</span>
        </Link>
      </div>

      <nav className="flex-grow p-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={() => {
              if (!active) setNavPending(true);
            }}
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-[0.65rem] tracking-[0.2em] font-bold uppercase transition-all rounded-sm",
              active
                ? "bg-primary text-white" 
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon size={16} />
            {item.name}
          </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
          href="/admin/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-3 text-[0.65rem] tracking-[0.2em] font-bold uppercase transition-colors",
            pathname === '/admin/settings'
              ? "bg-primary text-white"
              : "text-white/60 hover:text-white"
          )}
        >
          <Settings size={16} /> Configuration
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-[0.65rem] tracking-[0.2em] font-bold uppercase text-red-400 hover:text-red-300 transition-colors"
        >
          <LogOut size={16} /> Quitter l'admin
        </button>
      </div>
    </div>
  );

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      <aside className="hidden lg:block w-[220px] fixed inset-y-0 left-0 z-50">
        <SidebarContent />
      </aside>

      <div className="flex-grow lg:pl-[220px] flex flex-col">
        <header className="h-16 bg-white border-b border-zay-border flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[220px]">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-[0.65rem] tracking-[0.3em] font-bold uppercase text-zay-text-muted">
              {navItems.find(item => item.href === pathname)?.name
                || (pathname === '/admin/settings'
                  ? 'Configuration'
                  : pathname === '/admin/messages'
                    ? 'Messages'
                    : pathname.startsWith('/admin/clientes/')
                      ? 'Cliente'
                      : 'Admin')}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/admin/messages"
              className="relative text-zay-text-muted hover:text-primary transition-colors"
              aria-label="Messages contact"
            >
              <Bell size={18} />
              {newMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[0.5rem] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                  {newMessages > 9 ? '9+' : newMessages}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-3 pl-6 border-l border-zay-border">
              <div className="text-right">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider">{displayName}</p>
                <p className="text-[0.55rem] text-zay-text-muted uppercase tracking-tighter">
                  {user?.role === 'ADMIN' ? 'Super Admin' : user?.role}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-zay-gray border border-zay-border flex items-center justify-center text-[0.6rem] font-bold">{initials}</div>
            </div>
          </div>
        </header>

        <main className="p-8 relative">
          {navPending && (
            <div className="absolute inset-x-0 top-0 z-10 flex justify-center pointer-events-none">
              <div className="mt-2 flex items-center gap-2 bg-white/90 border border-zay-border px-4 py-2 text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted shadow-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                Chargement…
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
