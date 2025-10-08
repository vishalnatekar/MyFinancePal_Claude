'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTransactions } from '@/hooks/use-transactions';
import { useTransactionFilters } from '@/hooks/use-transaction-filters';
import { supabase } from '@/lib/supabase';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionSearchBar } from '@/components/transactions/TransactionSearchBar';
import { TransactionFilterBar } from '@/components/transactions/TransactionFilterBar';
import { TransactionFiltersDialog } from '@/components/transactions/TransactionFiltersDialog';
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal';
import { Transaction, TransactionFilter } from '@/types/transaction';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { TransactionExportService } from '@/services/transaction-export-service';

/**
 * Transactions page - displays transaction history with filtering and search
 */
export default function TransactionsPage() {
  const { filters, updateFilters, clearFilters, removeFilter } =
    useTransactionFilters();
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [accountsMap, setAccountsMap] = useState<Map<string, string>>(new Map());
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useTransactions(filters);

  // Flatten paginated data into single array
  const transactions = data?.pages.flatMap((page: any) => page.transactions) ?? [];

  // Fetch user accounts for display
  useEffect(() => {
    async function fetchAccounts() {
      const { data: accounts } = await supabase
        .from('financial_accounts')
        .select('id, account_name');

      if (accounts) {
        const map = new Map(
          accounts.map((acc) => [acc.id, acc.account_name])
        );
        setAccountsMap(map);
      }
    }
    fetchAccounts();
  }, []);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleTransactionEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailModalOpen(true);
  };

  const handleTransactionUpdate = (updatedTransaction: Transaction) => {
    // Optimistic update: update the cached transaction data
    queryClient.setQueryData(
      ['transactions', filters],
      (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            transactions: page.transactions.map((tx: Transaction) =>
              tx.id === updatedTransaction.id ? updatedTransaction : tx
            ),
          })),
        };
      }
    );

    setSelectedTransaction(updatedTransaction);
  };

  const handleSearch = useCallback((query: string) => {
    updateFilters({
      merchant_search: query.length >= 2 ? query : undefined,
    });
  }, [updateFilters]);

  const handleApplyFilters = useCallback((newFilters: TransactionFilter) => {
    clearFilters();
    updateFilters(newFilters);
  }, [clearFilters, updateFilters]);

  const handleExport = async () => {
    try {
      if (transactions.length === 0) {
        alert('No transactions to export');
        return;
      }

      await TransactionExportService.exportTransactions(transactions);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export transactions');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-2">
            View and manage your transaction history
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Search and filters */}
      <div className="space-y-4 mb-6">
        <TransactionSearchBar onSearch={handleSearch} />
        <TransactionFilterBar
          filters={filters}
          onRemoveFilter={removeFilter}
          onClearAll={clearFilters}
          onOpenFilters={() => setFiltersDialogOpen(true)}
        />
      </div>

      {/* Transaction list */}
      <TransactionList
        transactions={transactions}
        loading={isFetching}
        hasMore={hasNextPage ?? false}
        onLoadMore={handleLoadMore}
        onTransactionEdit={handleTransactionEdit}
        accountsMap={accountsMap}
      />

      {/* Filters dialog */}
      <TransactionFiltersDialog
        open={filtersDialogOpen}
        onClose={() => setFiltersDialogOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />

      {/* Transaction detail modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedTransaction(null);
        }}
        onUpdate={handleTransactionUpdate}
      />
    </div>
  );
}
