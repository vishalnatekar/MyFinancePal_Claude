import type {
	PaginatedTransactions,
	TransactionFilter,
} from "@/types/transaction";
import { useInfiniteQuery } from "@tanstack/react-query";

/**
 * Custom hook for fetching transactions with infinite scroll pagination
 * Uses React Query for caching and optimistic updates
 */

async function fetchTransactions(
	filters: TransactionFilter & { cursor?: string },
): Promise<PaginatedTransactions> {
	const params = new URLSearchParams();

	if (filters.account_ids && filters.account_ids.length > 0) {
		params.set("account_ids", filters.account_ids.join(","));
	}

	if (filters.categories && filters.categories.length > 0) {
		params.set("categories", filters.categories.join(","));
	}

	if (filters.merchant_search) {
		params.set("merchant_search", filters.merchant_search);
	}

	if (filters.amount_min !== undefined) {
		params.set("amount_min", filters.amount_min.toString());
	}

	if (filters.amount_max !== undefined) {
		params.set("amount_max", filters.amount_max.toString());
	}

	if (filters.date_from) {
		params.set("date_from", filters.date_from);
	}

	if (filters.date_to) {
		params.set("date_to", filters.date_to);
	}

	if (filters.limit) {
		params.set("limit", filters.limit.toString());
	}

	if (filters.cursor) {
		params.set("cursor", filters.cursor);
	}

	const response = await fetch(`/api/transactions?${params.toString()}`);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to fetch transactions");
	}

	return response.json();
}

export function useTransactions(filters: TransactionFilter = {}) {
	return useInfiniteQuery<PaginatedTransactions, Error>({
		queryKey: ["transactions", filters],
		queryFn: ({ pageParam }) =>
			fetchTransactions({ ...filters, cursor: pageParam }),
		getNextPageParam: (lastPage) =>
			lastPage.has_more ? lastPage.cursor : undefined,
		initialPageParam: undefined,
		staleTime: 5 * 60 * 1000, // 5 minutes cache
	});
}
