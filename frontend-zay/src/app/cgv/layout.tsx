import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CGV',
  description: 'Conditions générales de vente de ZAY Atelier.',
};

export default function CgvLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
