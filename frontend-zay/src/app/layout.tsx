import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Mr_Dafoe } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageTransition } from '@/components/layout/PageTransition';
import { CartHydration } from '@/components/cart/CartHydration';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '800'],
  variable: '--font-body',
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'sans-serif'],
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-headline',
  display: 'swap',
});

const dafoe = Mr_Dafoe({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-cursive',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Mode féminine`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Mode féminine`,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} ${cormorant.variable} ${dafoe.variable} font-body antialiased bg-background text-foreground pb-[60px] md:pb-0`}
        suppressHydrationWarning
      >
        <CartHydration />
        <PageTransition>
          {children}
        </PageTransition>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
