'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { memoryGet, memorySet } from '@/lib/memory-cache';

/**
 * Affiche tout de suite la dernière réponse connue, puis rafraîchit en silence.
 * Évite le spinner plein écran à chaque navigation admin.
 */
export function useCachedResource<T>(
  key: string,
  fetcher: () => Promise<T>,
) {
  const cached = memoryGet<T>(key);
  const [data, setData] = useState<T | undefined>(() => cached);
  const [loading, setLoading] = useState(cached === undefined);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refetch = useCallback(async () => {
    setError(null);
    const value = await fetcherRef.current();
    memorySet(key, value);
    setData(value);
    return value;
  }, [key]);

  useEffect(() => {
    let cancelled = false;
    const hit = memoryGet<T>(key);
    if (hit !== undefined) {
      setData(hit);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    fetcherRef
      .current()
      .then((value) => {
        if (cancelled) return;
        memorySet(key, value);
        setData(value);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return { data, loading, error, refetch };
}
