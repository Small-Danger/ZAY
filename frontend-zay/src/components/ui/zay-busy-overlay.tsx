'use client';

import { cn } from '@/lib/utils';

type Props = {
  show: boolean;
  label?: string;
  /** `fixed` = toute la fenêtre */
  placement?: 'absolute' | 'fixed';
};

/**
 * Voile de chargement ZAY : le logo tourne pour qu’on voie
 * que quelque chose est en cours, au lieu d’un écran figé.
 */
export function ZayBusyOverlay({
  show,
  label = 'Chargement…',
  placement = 'absolute',
}: Props) {
  if (!show) return null;

  return (
    <div
      className={cn(
        'z-[60] flex flex-col items-center justify-center bg-white/88 backdrop-blur-[3px]',
        placement === 'fixed' ? 'fixed inset-0' : 'absolute inset-0',
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex h-[5.75rem] w-[5.75rem] items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-primary/20" />
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/50 animate-spin" />
        <span className="font-headline text-lg tracking-[0.32em] uppercase text-primary">
          ZAY
        </span>
      </div>
      <p className="mt-5 text-[0.65rem] font-bold uppercase tracking-[0.28em] text-zay-text-muted">
        {label}
      </p>
    </div>
  );
}
