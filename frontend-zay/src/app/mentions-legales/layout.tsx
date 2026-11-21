import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales de ZAY Atelier.',
  alternates: { canonical: '/mentions-legales' },
};

export default function MentionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
