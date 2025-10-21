"use client";

import { BulkTransactionSharingControls } from "@/components/transactions/BulkTransactionSharingControls";
import {
	type SharingStatus,
	SharingStatusFilter,
} from "@/components/transactions/SharingStatusFilter";
import { TransactionDetailModal } from "@/components/transactions/TransactionDetailModal";
import { TransactionFilterBar } from "@/components/transactions/TransactionFilterBar";
import { TransactionFiltersDialog } from "@/components/transactions/TransactionFiltersDialog";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionSearchBar } from "@/components/transactions/TransactionSearchBar";
import { Button } from "@/components/ui/button";
import { useTransactionFilters } from "@/hooks/use-transaction-filters";
import { useTransactions } from "@/hooks/use-transactions";
import { supabase } from "@/lib/supabase";
import { TransactionExportService } from "@/services/transaction-export-service";
import type { Database } from "@/types/database";
import type {
	PaginatedTransactions,
	Transaction,
	TransactionFilter,
} from "@/types/transaction";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type AccountSummary = Pick<
	Database["public"]["Tables"]["financial_accounts"]["Row"],
	"id" | "account_name"
>;

interface HouseholdMemberWithHousehold {
	household_id: string;
	households: {
		id: string;
		name: string;
	} | null;
}

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
	const [accountsMap, setAccountsMap] = useState<Map<string, string>>(
		new Map(),
	);
	const [households, setHouseholds] = useState<
		Array<{ id: string; name: string }>
	>([]);
	const [selectedTransactionIds, setSelectedTransactionIds] = useState<
		Set<string>
	>(new Set());
	const [sharingStatus, setSharingStatus] = useState<SharingStatus>("all");
	const queryClient = useQueryClient();

	const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
		useTransactions(filters);

	// Flatten paginated data into single array
	const transactions: Transaction[] =
		data?.pages.flatMap((page) => page.transactions) ?? [];

	// Fetch user accounts and households for display
	useEffect(() => {
		async function fetchData() {
			// Fetch accounts
			const { data: accounts } = await supabase
				.from("financial_accounts")
				.select("id, account_name")
				.returns<AccountSummary[]>();

			if (accounts) {
				const map = new Map(accounts.map((acc) => [acc.id, acc.account_name]));
				setAccountsMap(map);
			}

			// Fetch households
			const { data: householdsData } = await supabase
				.from("household_members")
				.select("household_id, households(id, name)")
				.returns<HouseholdMemberWithHousehold[]>();

			if (householdsData) {
				const uniqueHouseholds = Array.from(
					new Map(
						householdsData
							.filter(
								(
									householdMembership,
								): householdMembership is HouseholdMemberWithHousehold & {
									households: { id: string; name: string };
								} => householdMembership.households !== null,
							)
							.map((householdMembership) => [
								householdMembership.households.id,
								{
									id: householdMembership.households.id,
									name: householdMembership.households.name,
								},
							]),
					).values(),
				);
				setHouseholds(uniqueHouseholds);
			}
		}
		fetchData();
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
		queryClient.setQueryData<InfiniteData<PaginatedTransactions>>(
			["transactions", filters],
			(oldData) => {
				if (!oldData) return oldData;

				return {
					...oldData,
					pages: oldData.pages.map((page) => ({
						...page,
						transactions: page.transactions.map((tx: Transaction) =>
							tx.id === updatedTransaction.id ? updatedTransaction : tx,
						),
					})),
				};
			},
		);

		setSelectedTransaction(updatedTransaction);
	};

	const handleSearch = useCallback(
		(query: string) => {
			updateFilters({
				merchant_search: query.length >= 2 ? query : undefined,
			});
		},
		[updateFilters],
	);

	const handleApplyFilters = useCallback(
		(newFilters: TransactionFilter) => {
			clearFilters();
			updateFilters(newFilters);
		},
		[clearFilters, updateFilters],
	);

	const handleExport = async () => {
		try {
			if (transactions.length === 0) {
				alert("No transactions to export");
				return;
			}

			await TransactionExportService.exportTransactions(transactions);
		} catch (error) {
			console.error("Export failed:", error);
			alert("Failed to export transactions");
		}
	};

	const handleToggleSelect = useCallback((transactionId: string) => {
		setSelectedTransactionIds((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(transactionId)) {
				newSet.delete(transactionId);
			} else {
				newSet.add(transactionId);
			}
			return newSet;
		});
	}, []);

	const handleClearSelection = useCallback(() => {
		setSelectedTransactionIds(new Set());
	}, []);

	const handleSharingComplete = useCallback(() => {
		// Refresh transactions after sharing change
		queryClient.invalidateQueries({ queryKey: ["transactions"] });
	}, [queryClient]);

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
				<div className="flex items-center justify-between gap-4">
					<TransactionFilterBar
						filters={filters}
						onRemoveFilter={removeFilter}
						onClearAll={clearFilters}
						onOpenFilters={() => setFiltersDialogOpen(true)}
					/>
					{households.length > 0 && (
						<SharingStatusFilter
							currentStatus={sharingStatus}
							onStatusChange={setSharingStatus}
						/>
					)}
				</div>
			</div>

			{/* Transaction list */}
			<TransactionList
				transactions={transactions}
				loading={isFetching}
				hasMore={hasNextPage ?? false}
				onLoadMore={handleLoadMore}
				onTransactionEdit={handleTransactionEdit}
				accountsMap={accountsMap}
				showSharing={households.length > 0}
				households={households}
				onChange={handleSharingComplete}
				selectable={households.length > 0}
				selectedIds={selectedTransactionIds}
				onToggleSelect={handleToggleSelect}
			/>

			{/* Bulk sharing controls */}
			{households.length > 0 && (
				<BulkTransactionSharingControls
					selectedTransactionIds={Array.from(selectedTransactionIds)}
					households={households}
					onClearSelection={handleClearSelection}
					onComplete={handleSharingComplete}
				/>
			)}

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
