import { useState, useEffect, useCallback } from 'react';
import type { AccountSync } from '@/components/dashboard/AccountSyncStatus';
import type { ManagedAccount } from '@/components/dashboard/AccountManagementSection';

interface AccountManagementData {
  syncStatus: AccountSync[];
  managedAccounts: ManagedAccount[];
  loading: boolean;
  error: string | null;
  handleRefresh: (accountId: string) => Promise<void>;
  handleRemoveAccount: (accountId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAccountManagement(): AccountManagementData {
  const [syncStatus, setSyncStatus] = useState<AccountSync[]>([]);
  const [managedAccounts, setManagedAccounts] = useState<ManagedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountsStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/accounts-status');

      if (!response.ok) {
        throw new Error('Failed to fetch account status');
      }

      const data = await response.json();

      setSyncStatus(data.syncStatus || []);
      setManagedAccounts(data.managedAccounts || []);
    } catch (err) {
      console.error('Error fetching account status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load account status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccountsStatus();
  }, [fetchAccountsStatus]);

  const handleRefresh = async (accountId: string) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}/sync`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sync account');
      }

      // Refresh the account status after successful sync
      await fetchAccountsStatus();
    } catch (err) {
      console.error('Error syncing account:', err);
      throw err; // Re-throw to let component handle the error display
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove account');
      }

      // Refresh the account list after successful removal
      await fetchAccountsStatus();
    } catch (err) {
      console.error('Error removing account:', err);
      throw err; // Re-throw to let component handle the error display
    }
  };

  return {
    syncStatus,
    managedAccounts,
    loading,
    error,
    handleRefresh,
    handleRemoveAccount,
    refetch: fetchAccountsStatus,
  };
}
