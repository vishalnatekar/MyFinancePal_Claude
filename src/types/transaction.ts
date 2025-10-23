/**
 * Transaction-related TypeScript interfaces and types
 */

// Using string instead of strict enum to support any TrueLayer category
export type TransactionCategory = string;

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
	// Story 4.2: Automatic categorization fields
	confidence_score?: number | null; // 0-100, NULL = not categorized
	original_rule_id?: string | null; // Original rule before override
	split_details?: TransactionSplit | null; // For partially shared transactions
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

// Story 4.2: Transaction Categorization Types

/**
 * Split transaction details for partially shared expenses
 * Example: £100 total -> £80 shared, £20 personal
 */
export interface TransactionSplit {
	personal_amount: number; // Amount that is NOT shared
	shared_amount: number; // Amount that IS shared
	split_percentage: Record<string, number>; // user_id -> percentage for shared amount
}

/**
 * Transaction override history
 */
export interface TransactionOverride {
	id: string;
	transaction_id: string;
	original_rule_id?: string | null;
	override_by: string;
	override_at: string;
	old_is_shared_expense: boolean;
	new_is_shared_expense: boolean;
	old_split_percentage?: Record<string, number>;
	new_split_percentage?: Record<string, number>;
	override_reason?: string;
}

/**
 * Rule feedback for analytics
 */
export interface RuleFeedback {
	id: string;
	transaction_id: string;
	rule_id?: string;
	household_id: string;
	user_action: "accepted" | "rejected" | "overridden";
	original_confidence_score?: number;
	override_details?: any;
	created_at: string;
}

/**
 * Uncategorized transaction queue item
 */
export interface UncategorizedQueueItem {
	transaction: Transaction;
	suggested_rule?: {
		id: string;
		rule_name: string;
		split_percentage: Record<string, number>;
	};
	suggested_confidence?: number;
	requires_review_reason: string; // "No matching rule" | "Low confidence" | "Default rule applied"
}

/**
 * Confidence level enum for display
 */
export type ConfidenceLevel = "high" | "medium" | "low" | "none";

/**
 * Request to override transaction categorization
 */
export interface TransactionOverrideRequest {
	is_shared_expense: boolean;
	split_percentage?: Record<string, number>;
	reason?: string;
}

/**
 * Request to split a transaction
 */
export interface TransactionSplitRequest {
	personal_amount: number;
	shared_amount: number;
	split_percentage: Record<string, number>;
}

/**
 * Batch categorization request
 */
export interface BatchCategorizationRequest {
	transaction_ids: string[];
	action: "mark_personal" | "apply_rule";
	rule_id?: string;
}
