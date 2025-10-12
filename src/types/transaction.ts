/**
 * Transaction-related TypeScript interfaces and types
 */

export type TransactionCategory =
	| "groceries"
	| "utilities"
	| "entertainment"
	| "transport"
	| "dining"
	| "shopping"
	| "healthcare"
	| "housing"
	| "income"
	| "transfer"
	| "other";

export interface Transaction {
	id: string;
	account_id: string;
	truelayer_transaction_id?: string;
	amount: number;
	merchant_name: string;
	category: string;
	date: string;
	description?: string;
	is_shared_expense: boolean;
	shared_with_household_id?: string; // NEW: which household sees this transaction
	shared_at?: string; // NEW: when it was shared
	shared_by?: string; // NEW: who shared it
	splitting_rule_id?: string;
	manual_override: boolean;
	created_at: string;
}

export interface TransactionFilter {
	account_ids?: string[];
	categories?: TransactionCategory[];
	merchant_search?: string;
	amount_min?: number;
	amount_max?: number;
	date_from?: string;
	date_to?: string;
	limit?: number;
	cursor?: string;
}

export interface PaginatedTransactions {
	transactions: Transaction[];
	total_count: number;
	has_more: boolean;
	cursor?: string;
}

export interface TransactionUpdateData {
	merchant_name?: string;
	category?: TransactionCategory;
	description?: string;
}

// Transaction sharing types
export interface TransactionSharingHistory {
	id: string;
	transaction_id: string;
	household_id: string;
	action: "shared" | "unshared";
	changed_by: string;
	changed_at: string;
}

// Extended type for household view with owner info
export interface SharedTransactionWithOwner extends Transaction {
	owner_name: string;
	owner_email: string;
}

export interface UpdateTransactionSharingRequest {
	household_id: string | null;
	is_shared: boolean;
}

export interface BulkTransactionSharingRequest {
	transaction_ids: string[];
	household_id: string | null;
	is_shared: boolean;
}

export interface BulkTransactionSharingResponse {
	success_count: number;
	failed_count: number;
	errors: Array<{
		transaction_id: string;
		error: string;
	}>;
}

export interface TransactionSharingHistoryFilters {
	household_id?: string;
	start_date?: string;
	end_date?: string;
	action?: "shared" | "unshared";
}
