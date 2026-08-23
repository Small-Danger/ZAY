'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchMyOrders,
  fetchOrders,
  type ApiOrder,
  type ApiOrderStatus,
} from '@/lib/api/orders';
import { getAccessToken } from '@/lib/auth/session';
import { memoryGet, memorySet } from '@/lib/memory-cache';

export function useMyOrders(enabled = true) {
  const [data, setData] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled || !getAccessToken()) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await fetchMyOrders());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur commandes');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useAdminOrders(params?: {
  status?: ApiOrderStatus;
  search?: string;
  from?: string;
  to?: string;
}) {
  const cacheKey = `admin-orders:${params?.status ?? ''}:${params?.search ?? ''}:${params?.from ?? ''}:${params?.to ?? ''}`;
  const cached = memoryGet<ApiOrder[]>(cacheKey);
  const [data, setData] = useState<ApiOrder[]>(() => cached ?? []);
  const [loading, setLoading] = useState(() => cached === undefined);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    const hit = memoryGet<ApiOrder[]>(cacheKey);
    if (hit) {
      setData(hit);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    fetchOrders(params)
      .then((orders) => {
        if (cancelled) return;
        memorySet(cacheKey, orders);
        setData(orders);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erreur commandes');
        setData(hit ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cacheKey, tick, params?.status, params?.search, params?.from, params?.to]);

  return { data, loading, error, refetch };
}
