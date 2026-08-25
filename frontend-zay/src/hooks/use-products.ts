"use client";

import { useCallback, useEffect, useState } from 'react';
import { fetchProduct, fetchProducts, type ProductListParams, type UiProduct } from '@/lib/api/products';
import { memoryGet, memorySet } from '@/lib/memory-cache';

type AsyncState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useProducts(
  params: ProductListParams = {},
  initial?: UiProduct[],
): AsyncState<UiProduct[]> {
  const key = JSON.stringify(params);
  const cacheKey = `products:${key}`;
  const cached = memoryGet<UiProduct[]>(cacheKey);
  const ssrHasProducts = Array.isArray(initial) && initial.length > 0;

  const [data, setData] = useState<UiProduct[]>(() => initial ?? cached ?? []);
  const [loading, setLoading] = useState(
    () => !ssrHasProducts && cached === undefined,
  );
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (ssrHasProducts && initial && tick === 0 && key === '{}') {
      memorySet(cacheKey, initial);
      setLoading(false);
      return;
    }

    const hit = memoryGet<UiProduct[]>(cacheKey);
    if (hit) {
      setData(hit);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    let cancelled = false;

    fetchProducts(params)
      .then((products) => {
        if (!cancelled) {
          memorySet(cacheKey, products);
          setData(products);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setData(hit ?? []);
          setError(err instanceof Error ? err.message : 'Erreur API produits');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key encapsule params
  }, [key, tick]);

  return { data, loading, error, refetch };
}

export function useProduct(
  idOrSlug: string | undefined,
  initial?: UiProduct | null,
): AsyncState<UiProduct | null> {
  const [data, setData] = useState<UiProduct | null>(() => initial ?? null);
  const [loading, setLoading] = useState(() => initial === undefined);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!idOrSlug) {
      setData(null);
      setLoading(false);
      return;
    }

    if (
      initial !== undefined &&
      tick === 0 &&
      initial &&
      (initial.slug === idOrSlug || initial.id === idOrSlug)
    ) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProduct(idOrSlug)
      .then((product) => {
        if (!cancelled) setData(product);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : 'Produit introuvable');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idOrSlug, tick]);

  return { data, loading, error, refetch };
}
