"use client";

import { useState, useEffect, useCallback } from "react";

export function useApi<T>(
  fetcher: () => Promise<T>,
  interval?: number
): { data: T | null; error: string | null; loading: boolean; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    setLoading(true);
    fetcher()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [fetcher]);

  useEffect(() => {
    refetch();
    if (interval) {
      const id = setInterval(refetch, interval);
      return () => clearInterval(id);
    }
  }, [refetch, interval]);

  return { data, error, loading, refetch };
}
