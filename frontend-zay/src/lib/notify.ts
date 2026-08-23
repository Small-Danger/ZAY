import { toast } from '@/hooks/use-toast';

export function notify(message: string) {
  toast({ description: message });
}

export function notifyError(
  err: unknown,
  fallback = 'Une erreur est survenue',
) {
  toast({
    variant: 'destructive',
    description: err instanceof Error ? err.message : fallback,
  });
}
