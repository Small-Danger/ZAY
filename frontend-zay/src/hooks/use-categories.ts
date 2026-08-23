"use client";

import { useCallback, useEffect, useState } from 'react';
import {
  fetchCategories,
  type ApiCategory,
  type ApiSubcategory,
} from '@/lib/api/categories';
import { memoryGet, memorySet } from '@/lib/memory-cache';

export function useCategories(initial?: ApiCategory[]) {
  const cacheKey = 'categories';
  const cached = memoryGet<ApiCategory[]>(cacheKey);
  const [data, setData] = useState<ApiCategory[]>(() => initial ?? cached ?? []);
  const [loading, setLoading] = useState(() => initial === undefined && cached === undefined);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (initial !== undefined && tick === 0) {
      memorySet(cacheKey, initial);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const hit = memoryGet<ApiCategory[]>(cacheKey);
    if (hit) {
      setData(hit);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    fetchCategories()
      .then((cats) => {
        if (!cancelled) {
          memorySet(cacheKey, cats);
          setData(cats);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setData(hit ?? []);
          setError(err instanceof Error ? err.message : 'Erreur catégories');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { data, loading, error, refetch };
}

/** Sous-catégories d’une catégorie (depuis le cache useCategories ou vide). */
export function getSubcategoriesFor(
  categories: ApiCategory[],
  categoryId: string | null | undefined,
): ApiSubcategory[] {
  if (!categoryId) return [];
  return categories.find((c) => c.id === categoryId)?.subcategories ?? [];
}
