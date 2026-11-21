import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CGV',
  description: 'Conditions générales de vente de ZAY Atelier.',
  alternates: { canonical: '/cgv' },
};

export default function CgvLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
