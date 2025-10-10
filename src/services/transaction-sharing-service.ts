/**
 * Transaction Sharing Service
 * Handles API calls for transaction-level privacy controls
 */

import type {
	BulkTransactionSharingRequest,
	BulkTransactionSharingResponse,
	TransactionSharingHistory,
	TransactionSharingHistoryFilters,
	UpdateTransactionSharingRequest,
} from "@/types/transaction";

export const transactionSharingService = {
	/**
	 * Update sharing settings for a single transaction
	 */
	updateSharing: async (
		transactionId: string,
		request: UpdateTransactionSharingRequest,
	): Promise<void> => {
		const response = await fetch(`/api/transactions/${transactionId}/sharing`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify(request),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to update transaction sharing");
		}
	},

	/**
	 * Bulk update sharing settings for multiple transactions
	 */
	bulkUpdateSharing: async (
		request: BulkTransactionSharingRequest,
	): Promise<BulkTransactionSharingResponse> => {
		const response = await fetch("/api/transactions/bulk-sharing", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify(request),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to bulk update transaction sharing");
		}

		return response.json();
	},

	/**
	 * Get sharing history for a specific transaction
	 */
	getSharingHistory: async (
		transactionId: string,
		filters?: TransactionSharingHistoryFilters,
	): Promise<TransactionSharingHistory[]> => {
		const queryParams = new URLSearchParams();

		if (filters?.household_id) {
			queryParams.append("household_id", filters.household_id);
		}
		if (filters?.start_date) {
			queryParams.append("start_date", filters.start_date);
		}
		if (filters?.end_date) {
			queryParams.append("end_date", filters.end_date);
		}
		if (filters?.action) {
			queryParams.append("action", filters.action);
		}

		const url = `/api/transactions/${transactionId}/sharing-history${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

		const response = await fetch(url, {
			method: "GET",
			credentials: "include",
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(
				error.error || "Failed to fetch transaction sharing history",
			);
		}

		const data = await response.json();
		return data.history || [];
	},
};
