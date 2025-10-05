'use client';

import { useState, useEffect } from 'react';
import type { NetWorthSummary } from '@/types/dashboard';

interface UseNetWorthReturn {
  netWorth: NetWorthSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useNetWorth(): UseNetWorthReturn {
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNetWorth = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/net-worth');

      if (!response.ok) {
        throw new Error(`Failed to fetch net worth: ${response.statusText}`);
      }

      const data = await response.json();
      setNetWorth(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch net worth';
      setError(errorMessage);
      console.error('Net worth fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetWorth();
  }, []);

  return {
    netWorth,
    loading,
    error,
    refetch: fetchNetWorth
  };
}