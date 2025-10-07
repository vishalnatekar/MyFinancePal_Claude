'use client';

import { useState, useEffect } from 'react';
import type { NetWorthSummary, NetWorthHistoryPoint, DateRange } from '@/types/dashboard';
import type { FinancialAccount } from '@/types/account';

interface UseDashboardDataReturn {
  netWorth: NetWorthSummary | null;
  accounts: FinancialAccount[];
  history: NetWorthHistoryPoint[];
  loading: boolean;
  error: string | null;
  refetchAll: () => Promise<void>;
  updateDateRange: (range: DateRange) => Promise<void>;
}

export function useDashboardData(initialDateRange: DateRange = '6M'): UseDashboardDataReturn {
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [history, setHistory] = useState<NetWorthHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);

  const fetchNetWorth = async () => {
    const response = await fetch('/api/dashboard/net-worth', {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch net worth: ${response.statusText}`);
    }
    return response.json();
  };

  const fetchAccounts = async () => {
    const response = await fetch('/api/accounts', {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.statusText}`);
    }
    const data = await response.json();
    return data.accounts || data; // Handle both { accounts: [] } and direct array
  };

  const fetchHistory = async (range: DateRange) => {
    const response = await fetch(`/api/dashboard/net-worth/history?range=${range}&includeTrend=true`, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }
    return response.json();
  };

  const fetchAllData = async (range: DateRange = dateRange) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch accounts first (most critical)
      const accountsData = await fetchAccounts().catch(err => {
        console.error('Failed to fetch accounts:', err);
        return [];
      });
      setAccounts(accountsData);

      // Fetch net worth and history in parallel (less critical)
      const [netWorthData, historyData] = await Promise.allSettled([
        fetchNetWorth(),
        fetchHistory(range)
      ]);

      if (netWorthData.status === 'fulfilled') {
        setNetWorth(netWorthData.value);
      } else {
        console.error('Failed to fetch net worth:', netWorthData.reason);
      }

      if (historyData.status === 'fulfilled') {
        setHistory(historyData.value.history || []);
      } else {
        console.error('Failed to fetch history:', historyData.reason);
        setHistory([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateDateRange = async (newRange: DateRange) => {
    setDateRange(newRange);

    try {
      setError(null);
      const historyData = await fetchHistory(newRange);
      setHistory(historyData.history || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch history';
      setError(errorMessage);
      console.error('History fetch error:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    netWorth,
    accounts,
    history,
    loading,
    error,
    refetchAll: () => fetchAllData(dateRange),
    updateDateRange
  };
}