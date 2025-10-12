"use client";

import type { Transaction } from "@/types/transaction";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { TransactionListItem } from "./TransactionListItem";

interface TransactionListProps {
	transactions: Transaction[];
	loading: boolean;
	hasMore: boolean;
	onLoadMore: () => void;
	onTransactionEdit: (transaction: Transaction) => void;
	accountsMap?: Map<string, string>;
	showSharing?: boolean;
	households?: Array<{ id: string; name: string }>;
	onSharingChange?: () => void;
	selectable?: boolean;
	selectedIds?: Set<string>;
	onToggleSelect?: (transactionId: string) => void;
}

/**
 * Transaction list component with infinite scroll
 */
export function TransactionList({
	transactions,
	loading,
	hasMore,
	onLoadMore,
	onTransactionEdit,
	accountsMap,
	showSharing = false,
	households = [],
	onSharingChange,
	selectable = false,
	selectedIds = new Set(),
	onToggleSelect,
}: TransactionListProps) {
	const observerTarget = useRef<HTMLDivElement>(null);

	// Infinite scroll implementation using Intersection Observer
	useEffect(() => {
		const target = observerTarget.current;
		if (!target) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loading) {
					onLoadMore();
				}
			},
			{ threshold: 0.1 },
		);

		observer.observe(target);

		return () => {
			if (target) observer.unobserve(target);
		};
	}, [hasMore, loading, onLoadMore]);

	// Empty state
	if (!loading && transactions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 px-4">
				<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
					<svg
						className="w-8 h-8 text-gray-400"
						fill="none"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">
					No transactions found
				</h3>
				<p className="text-gray-500 text-center max-w-sm">
					No transactions match your current filters. Try adjusting your search
					criteria or connect an account to see transactions.
				</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
			{/* Loading skeleton */}
			{loading && transactions.length === 0 && (
				<div className="divide-y divide-gray-200">
					{[...Array(5)].map((_, i) => (
						<div key={i} className="p-4 animate-pulse">
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
									<div className="h-3 bg-gray-200 rounded w-1/4"></div>
								</div>
								<div className="h-6 bg-gray-200 rounded w-20"></div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Transaction list */}
			{transactions.length > 0 && (
				<div className="divide-y divide-gray-200">
					{transactions.map((transaction) => (
						<TransactionListItem
							key={transaction.id}
							transaction={transaction}
							onEdit={onTransactionEdit}
							accountName={accountsMap?.get(transaction.account_id)}
							showSharing={showSharing}
							households={households}
							onSharingChange={onSharingChange}
							selectable={selectable}
							selected={selectedIds.has(transaction.id)}
							onToggleSelect={onToggleSelect}
						/>
					))}
				</div>
			)}

			{/* Infinite scroll trigger */}
			{hasMore && (
				<div ref={observerTarget} className="p-4 flex justify-center">
					{loading && (
						<Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
					)}
				</div>
			)}
		</div>
	);
}
