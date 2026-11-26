import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageTransition } from '@/components/layout/PageTransition';
import { CartHydration } from '@/components/cart/CartHydration';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

const inter = localFont({
  src: [
    {
      path: './fonts/inter-latin-300-normal.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './fonts/inter-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/inter-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/inter-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/inter-latin-800-normal.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  variable: '--font-body',
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'sans-serif'],
});

const cormorant = localFont({
  src: [
    {
      path: './fonts/cormorant-garamond-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/cormorant-garamond-latin-400-italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './fonts/cormorant-garamond-latin-600-normal.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './fonts/cormorant-garamond-latin-600-italic.woff2',
      weight: '600',
      style: 'italic',
    },
    {
      path: './fonts/cormorant-garamond-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/cormorant-garamond-latin-700-italic.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-headline',
  display: 'swap',
});

const dafoe = localFont({
  src: [
    {
      path: './fonts/mr-dafoe-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
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
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Mode féminine`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
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
        <CookieConsent />
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
