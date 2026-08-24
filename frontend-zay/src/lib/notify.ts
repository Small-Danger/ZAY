import { toast } from '@/hooks/use-toast';

export function notify(message: string, title?: string) {
  toast({ title, description: message });
}

export function notifySuccess(message: string) {
  toast({
    title: 'C’est enregistré',
    description: message,
  });
}

export function notifyError(
  err: unknown,
  fallback = 'Une erreur est survenue',
) {
  toast({
    variant: 'destructive',
    title: 'Erreur',
    description: err instanceof Error ? err.message : fallback,
  });
}
