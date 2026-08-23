import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  updatedAt: string;
  intro?: string;
  sections: LegalSection[];
  related?: { label: string; href: string }[];
};

export function LegalPageShell({
  eyebrow,
  title,
  updatedAt,
  intro,
  sections,
  related,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-zay-main">
      <Header />
      <main className="flex-grow pt-40 md:pt-52 pb-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-14 space-y-4">
            <span className="text-primary text-[0.65rem] tracking-[0.5em] font-light uppercase">
              {eyebrow}
            </span>
            <h1 className="text-4xl md:text-5xl font-headline italic text-zay-text font-light">
              {title}
            </h1>
            <p className="text-[0.65rem] tracking-[0.25em] uppercase text-zay-text-muted font-light">
              Dernière mise à jour : {updatedAt}
            </p>
            {intro && (
              <p className="text-zay-text-muted italic leading-loose tracking-wide font-light pt-2">
                {intro}
              </p>
            )}
          </div>

          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.title} className="space-y-4">
                <h2 className="text-[0.7rem] tracking-[0.3em] font-light uppercase text-primary border-b border-zay-border pb-4">
                  {section.title}
                </h2>
                {section.paragraphs.map((p) => (
                  <p
                    key={p.slice(0, 48)}
                    className="text-zay-text-muted italic leading-loose tracking-wide font-light text-sm md:text-[15px]"
                  >
                    {p}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="space-y-2 pl-1">
                    {section.bullets.map((item) => (
                      <li
                        key={item.slice(0, 48)}
                        className="text-zay-text-muted italic leading-loose tracking-wide font-light text-sm md:text-[15px] flex gap-3"
                      >
                        <span className="text-primary mt-2 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {related && related.length > 0 && (
            <nav className="mt-16 pt-8 border-t border-zay-border flex flex-wrap gap-x-8 gap-y-3">
              {related.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[0.65rem] tracking-[0.3em] uppercase font-light text-zay-text-muted hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
