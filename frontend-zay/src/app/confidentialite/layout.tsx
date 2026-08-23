import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Confidentialité',
  description: 'Politique de confidentialité de ZAY Atelier.',
};

export default function ConfidentialiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
