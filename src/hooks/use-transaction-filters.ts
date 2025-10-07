import { useState, useCallback } from 'react';
import { TransactionFilter } from '@/types/transaction';

/**
 * Hook for managing transaction filter state
 */
export function useTransactionFilters(initialFilters: TransactionFilter = {}) {
  const [filters, setFilters] = useState<TransactionFilter>(initialFilters);

  const updateFilters = useCallback(
    (updates: Partial<TransactionFilter>) => {
      setFilters((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const removeFilter = useCallback((key: keyof TransactionFilter) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  return {
    filters,
    updateFilters,
    clearFilters,
    removeFilter,
  };
}
