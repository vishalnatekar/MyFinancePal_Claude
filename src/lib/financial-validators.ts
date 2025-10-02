import { z } from "zod";

/**
 * Financial Account Validation Schema
 * Validates account data for accuracy and integrity
 */
export const FinancialAccountSchema = z.object({
	id: z.string().uuid(),
	user_id: z.string().uuid(),
	truelayer_account_id: z.string().optional(),
	truelayer_connection_id: z.string().optional(),
	account_type: z.enum(["checking", "savings", "investment", "credit"]),
	account_name: z.string().min(1).max(100),
	institution_name: z.string().min(1).max(100),
	current_balance: z.number().finite(),
	is_shared: z.boolean(),
	last_synced: z.string().datetime().optional(),
	is_manual: z.boolean(),
	connection_status: z.enum(["active", "expired", "failed"]).optional(),
	encrypted_access_token: z.string().optional(),
	created_at: z.string().datetime().optional(),
	updated_at: z.string().datetime().optional(),
});

/**
 * Transaction Validation Schema
 * Validates transaction data with financial constraints
 */
export const TransactionSchema = z.object({
	id: z.string().uuid().optional(),
	account_id: z.string().uuid(),
	truelayer_transaction_id: z.string().optional(),
	amount: z.number().finite(),
	merchant_name: z.string().nullable().optional(),
	category: z.string().optional(),
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
	description: z.string().optional(),
	currency: z.string().length(3, "Currency must be ISO 4217 code"),
	transaction_type: z.enum(["DEBIT", "CREDIT"]).optional(),
	is_shared_expense: z.boolean().default(false),
	manual_override: z.boolean().default(false),
});

/**
 * Balance Validation Schema
 * Validates balance data from TrueLayer
 */
export const BalanceSchema = z.object({
	currency: z.string().length(3, "Currency must be ISO 4217 code"),
	available: z.number().finite(),
	current: z.number().finite(),
	overdraft: z.number().finite().optional(),
	update_timestamp: z.string().datetime(),
});

/**
 * Account Balance History Schema
 * Validates historical balance records
 */
export const AccountBalanceHistorySchema = z.object({
	id: z.string().uuid().optional(),
	account_id: z.string().uuid(),
	balance: z.number().finite(),
	currency: z.string().length(3),
	recorded_at: z.string().datetime().optional(),
});

/**
 * Transaction Processing Metadata Schema
 * Validates transaction processing metadata
 */
export const TransactionProcessingMetadataSchema = z.object({
	id: z.string().uuid().optional(),
	transaction_id: z.string().uuid(),
	fingerprint: z.string(),
	duplicate_cluster_id: z.string().uuid().optional(),
	processing_status: z.enum(["pending", "processed", "duplicate", "error"]),
	processed_at: z.string().datetime().optional(),
});

/**
 * Data Sync Log Schema
 * Validates data sync operation logs
 */
export const DataSyncLogSchema = z.object({
	id: z.string().uuid().optional(),
	account_id: z.string().uuid(),
	sync_type: z.enum(["manual", "scheduled", "retry"]),
	status: z.enum(["started", "processing", "completed", "failed"]),
	transactions_processed: z.number().int().nonnegative().default(0),
	duplicates_found: z.number().int().nonnegative().default(0),
	errors_encountered: z.array(z.string()).default([]),
	started_at: z.string().datetime().optional(),
	completed_at: z.string().datetime().optional(),
});

/**
 * Currency Code Validation
 * Validates ISO 4217 currency codes
 */
export const CurrencyCodeSchema = z
	.string()
	.length(3)
	.regex(/^[A-Z]{3}$/);

/**
 * Account Type-specific Balance Validation
 * Different account types have different balance constraints
 */
export function validateBalanceForAccountType(
	balance: number,
	accountType: "checking" | "savings" | "investment" | "credit",
): { valid: boolean; error?: string } {
	switch (accountType) {
		case "checking":
		case "savings":
		case "investment":
			// Asset accounts should typically have non-negative balances
			// Allow overdraft with warning
			if (balance < -10000) {
				return {
					valid: false,
					error: "Balance too negative for asset account (possible data error)",
				};
			}
			return { valid: true };

		case "credit":
			// Credit card balances can be negative (credit) or positive (debt)
			// No strict constraint, but validate reasonable range
			if (balance > 100000 || balance < -100000) {
				return {
					valid: false,
					error: "Credit card balance outside reasonable range",
				};
			}
			return { valid: true };

		default:
			return { valid: false, error: "Unknown account type" };
	}
}

/**
 * Transaction Date Validation
 * Ensures transaction dates are reasonable
 */
export function validateTransactionDate(dateStr: string): {
	valid: boolean;
	error?: string;
} {
	try {
		const date = new Date(dateStr);
		const now = new Date();
		const tenYearsAgo = new Date();
		tenYearsAgo.setFullYear(now.getFullYear() - 10);
		const oneYearFuture = new Date();
		oneYearFuture.setFullYear(now.getFullYear() + 1);

		// Transaction date should be within reasonable range
		if (date < tenYearsAgo) {
			return {
				valid: false,
				error: "Transaction date is more than 10 years in the past",
			};
		}

		if (date > oneYearFuture) {
			return {
				valid: false,
				error: "Transaction date is more than 1 year in the future",
			};
		}

		return { valid: true };
	} catch (error) {
		return { valid: false, error: "Invalid date format" };
	}
}

/**
 * Transaction Amount Validation
 * Validates transaction amounts are within reasonable bounds
 */
export function validateTransactionAmount(amount: number): {
	valid: boolean;
	error?: string;
} {
	if (!Number.isFinite(amount)) {
		return { valid: false, error: "Amount must be a finite number" };
	}

	// Check for unreasonably large transactions (likely data error)
	if (Math.abs(amount) > 1000000) {
		return {
			valid: false,
			error: "Transaction amount exceeds reasonable limit (£1,000,000)",
		};
	}

	// Check for zero amounts (might be valid, but flag for review)
	if (amount === 0) {
		return {
			valid: true,
			error: "Warning: Zero amount transaction",
		};
	}

	// Check for precision (should not have more than 2 decimal places)
	const decimalPlaces = (amount.toString().split(".")[1] || "").length;
	if (decimalPlaces > 2) {
		return {
			valid: false,
			error: "Amount should not have more than 2 decimal places",
		};
	}

	return { valid: true };
}

/**
 * Data Integrity Check Result
 */
export interface IntegrityCheckResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

/**
 * Comprehensive Data Integrity Check
 * Validates multiple aspects of financial data
 */
export function checkDataIntegrity(data: {
	accounts?: unknown[];
	transactions?: unknown[];
	balances?: unknown[];
}): IntegrityCheckResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Validate accounts
	if (data.accounts) {
		for (const [index, account] of data.accounts.entries()) {
			try {
				FinancialAccountSchema.parse(account);
			} catch (error) {
				if (error instanceof z.ZodError) {
					errors.push(
						`Account ${index}: ${error.errors.map((e) => e.message).join(", ")}`,
					);
				}
			}
		}
	}

	// Validate transactions
	if (data.transactions) {
		for (const [index, transaction] of data.transactions.entries()) {
			try {
				TransactionSchema.parse(transaction);
			} catch (error) {
				if (error instanceof z.ZodError) {
					errors.push(
						`Transaction ${index}: ${error.errors.map((e) => e.message).join(", ")}`,
					);
				}
			}
		}
	}

	// Validate balances
	if (data.balances) {
		for (const [index, balance] of data.balances.entries()) {
			try {
				BalanceSchema.parse(balance);
			} catch (error) {
				if (error instanceof z.ZodError) {
					errors.push(
						`Balance ${index}: ${error.errors.map((e) => e.message).join(", ")}`,
					);
				}
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

// Type exports for use in other modules
export type FinancialAccountType = z.infer<typeof FinancialAccountSchema>;
export type TransactionType = z.infer<typeof TransactionSchema>;
export type BalanceType = z.infer<typeof BalanceSchema>;
export type AccountBalanceHistoryType = z.infer<
	typeof AccountBalanceHistorySchema
>;
export type TransactionProcessingMetadataType = z.infer<
	typeof TransactionProcessingMetadataSchema
>;
export type DataSyncLogType = z.infer<typeof DataSyncLogSchema>;
