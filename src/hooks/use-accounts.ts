"use client";

import type { FinancialAccount } from "@/types/account";
import { useCallback, useEffect, useState } from "react";

export interface UseAccountsResult {
	accounts: FinancialAccount[];
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
	syncAccount: (accountId: string) => Promise<void>;
	deleteAccount: (accountId: string) => Promise<void>;
}

export function useAccounts(): UseAccountsResult {
	const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAccounts = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await fetch("/api/accounts", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "same-origin", // Include cookies for authentication
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(errorData?.error || "Failed to fetch accounts");
			}

			const data = await response.json();
			setAccounts(data.accounts || []);
		} catch (err) {
			console.error("Error fetching accounts:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Failed to fetch accounts";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const syncAccount = useCallback(async (accountId: string) => {
		try {
			setError(null);

			const response = await fetch("/api/accounts/sync", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "same-origin", // Include cookies for authentication
				body: JSON.stringify({ accountId }),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(errorData?.error || "Failed to sync account");
			}

			const data = await response.json();

			// Update the account in the local state
			setAccounts((prev) =>
				prev.map((account) =>
					account.id === accountId
						? {
								...account,
								current_balance:
									data.account?.current_balance ?? account.current_balance,
								last_synced: data.account?.last_synced ?? account.last_synced,
								connection_status:
									data.account?.connection_status ?? account.connection_status,
								updated_at: new Date().toISOString(),
							}
						: account,
				),
			);
		} catch (err) {
			console.error("Error syncing account:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Failed to sync account";
			setError(errorMessage);
			throw err; // Re-throw so component can handle it
		}
	}, []);

	const deleteAccount = useCallback(async (accountId: string) => {
		try {
			setError(null);

			const response = await fetch(`/api/accounts/${accountId}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "same-origin", // Include cookies for authentication
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(errorData?.error || "Failed to delete account");
			}

			// Remove the account from local state
			setAccounts((prev) => prev.filter((account) => account.id !== accountId));
		} catch (err) {
			console.error("Error deleting account:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Failed to delete account";
			setError(errorMessage);
			throw err; // Re-throw so component can handle it
		}
	}, []);

	const refetch = useCallback(async () => {
		await fetchAccounts();
	}, [fetchAccounts]);

	// Initial fetch
	useEffect(() => {
		fetchAccounts();
	}, [fetchAccounts]);

	return {
		accounts,
		isLoading,
		error,
		refetch,
		syncAccount,
		deleteAccount,
	};
}
