import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À propos',
  description:
    'ZAY Atelier — maison de mode féminine, élégance contemporaine et pièces raffinées.',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
