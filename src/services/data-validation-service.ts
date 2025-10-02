import {
	BalanceSchema,
	FinancialAccountSchema,
	type IntegrityCheckResult,
	TransactionSchema,
	checkDataIntegrity,
	validateBalanceForAccountType,
	validateTransactionAmount,
	validateTransactionDate,
} from "@/lib/financial-validators";
import type { FinancialAccount } from "@/types/account";
import type { TrueLayerBalance, TrueLayerTransaction } from "@/types/truelayer";
import { z } from "zod";
import type { ProcessedTransaction } from "./truelayer-data-processor";

/**
 * Validation Result Interface
 */
export interface ValidationResult<T> {
	valid: boolean;
	data?: T;
	errors: ValidationError[];
	warnings: ValidationWarning[];
}

export interface ValidationError {
	field: string;
	message: string;
	code: string;
}

export interface ValidationWarning {
	field: string;
	message: string;
}

/**
 * DataValidationService
 * Provides comprehensive validation for financial data
 */
export class DataValidationService {
	/**
	 * Validate financial account data
	 */
	validateAccount(
		account: unknown,
	): ValidationResult<z.infer<typeof FinancialAccountSchema>> {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		try {
			const validatedAccount = FinancialAccountSchema.parse(account);

			// Additional business logic validation
			const balanceCheck = validateBalanceForAccountType(
				validatedAccount.current_balance,
				validatedAccount.account_type,
			);

			if (!balanceCheck.valid) {
				errors.push({
					field: "current_balance",
					message: balanceCheck.error || "Invalid balance",
					code: "INVALID_BALANCE",
				});
			}

			// Warn about negative balances for asset accounts
			if (
				["checking", "savings", "investment"].includes(
					validatedAccount.account_type,
				) &&
				validatedAccount.current_balance < 0
			) {
				warnings.push({
					field: "current_balance",
					message: "Asset account has negative balance (possible overdraft)",
				});
			}

			return {
				valid: errors.length === 0,
				data: validatedAccount,
				errors,
				warnings,
			};
		} catch (error) {
			if (error instanceof z.ZodError) {
				for (const issue of error.errors) {
					errors.push({
						field: issue.path.join("."),
						message: issue.message,
						code: issue.code,
					});
				}
			} else {
				errors.push({
					field: "unknown",
					message: "Unknown validation error",
					code: "UNKNOWN_ERROR",
				});
			}

			return {
				valid: false,
				errors,
				warnings,
			};
		}
	}

	/**
	 * Validate transaction data
	 */
	validateTransaction(
		transaction: unknown,
	): ValidationResult<z.infer<typeof TransactionSchema>> {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		try {
			const validatedTransaction = TransactionSchema.parse(transaction);

			// Validate transaction amount
			const amountCheck = validateTransactionAmount(
				validatedTransaction.amount,
			);
			if (!amountCheck.valid) {
				errors.push({
					field: "amount",
					message: amountCheck.error || "Invalid amount",
					code: "INVALID_AMOUNT",
				});
			} else if (amountCheck.error) {
				// Has warning
				warnings.push({
					field: "amount",
					message: amountCheck.error,
				});
			}

			// Validate transaction date
			const dateCheck = validateTransactionDate(validatedTransaction.date);
			if (!dateCheck.valid) {
				errors.push({
					field: "date",
					message: dateCheck.error || "Invalid date",
					code: "INVALID_DATE",
				});
			}

			return {
				valid: errors.length === 0,
				data: validatedTransaction,
				errors,
				warnings,
			};
		} catch (error) {
			if (error instanceof z.ZodError) {
				for (const issue of error.errors) {
					errors.push({
						field: issue.path.join("."),
						message: issue.message,
						code: issue.code,
					});
				}
			} else {
				errors.push({
					field: "unknown",
					message: "Unknown validation error",
					code: "UNKNOWN_ERROR",
				});
			}

			return {
				valid: false,
				errors,
				warnings,
			};
		}
	}

	/**
	 * Validate balance data
	 */
	validateBalance(
		balance: unknown,
	): ValidationResult<z.infer<typeof BalanceSchema>> {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		try {
			const validatedBalance = BalanceSchema.parse(balance);

			// Check if current and available make sense
			if (
				validatedBalance.available > validatedBalance.current &&
				!validatedBalance.overdraft
			) {
				warnings.push({
					field: "available",
					message:
						"Available balance exceeds current balance without overdraft",
				});
			}

			return {
				valid: errors.length === 0,
				data: validatedBalance,
				errors,
				warnings,
			};
		} catch (error) {
			if (error instanceof z.ZodError) {
				for (const issue of error.errors) {
					errors.push({
						field: issue.path.join("."),
						message: issue.message,
						code: issue.code,
					});
				}
			} else {
				errors.push({
					field: "unknown",
					message: "Unknown validation error",
					code: "UNKNOWN_ERROR",
				});
			}

			return {
				valid: false,
				errors,
				warnings,
			};
		}
	}

	/**
	 * Validate batch of transactions
	 */
	validateTransactionBatch(transactions: unknown[]): {
		valid: boolean;
		validTransactions: z.infer<typeof TransactionSchema>[];
		invalidTransactions: Array<{
			index: number;
			transaction: unknown;
			errors: ValidationError[];
		}>;
		warnings: ValidationWarning[];
	} {
		const validTransactions: z.infer<typeof TransactionSchema>[] = [];
		const invalidTransactions: Array<{
			index: number;
			transaction: unknown;
			errors: ValidationError[];
		}> = [];
		const warnings: ValidationWarning[] = [];

		for (const [index, transaction] of transactions.entries()) {
			const result = this.validateTransaction(transaction);

			if (result.valid && result.data) {
				validTransactions.push(result.data);
				warnings.push(...result.warnings);
			} else {
				invalidTransactions.push({
					index,
					transaction,
					errors: result.errors,
				});
			}
		}

		return {
			valid: invalidTransactions.length === 0,
			validTransactions,
			invalidTransactions,
			warnings,
		};
	}

	/**
	 * Check data integrity for corrupted API responses
	 */
	checkApiResponseIntegrity(response: {
		accounts?: unknown[];
		transactions?: unknown[];
		balances?: unknown[];
	}): IntegrityCheckResult {
		return checkDataIntegrity(response);
	}

	/**
	 * Validate TrueLayer API response structure
	 */
	validateTrueLayerResponse(
		response: unknown,
		expectedType: "account" | "transaction" | "balance",
	): ValidationResult<unknown> {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		// Check if response is an object
		if (typeof response !== "object" || response === null) {
			errors.push({
				field: "response",
				message: "Response is not a valid object",
				code: "INVALID_RESPONSE",
			});
			return { valid: false, errors, warnings };
		}

		// Check for TrueLayer error response
		if ("error" in response && "error_description" in response) {
			errors.push({
				field: "response",
				message: `TrueLayer API error: ${(response as { error_description: string }).error_description}`,
				code: "API_ERROR",
			});
			return { valid: false, errors, warnings };
		}

		// Check for results array (standard TrueLayer response format)
		if (
			"results" in response &&
			Array.isArray((response as { results: unknown[] }).results)
		) {
			return { valid: true, data: response, errors, warnings };
		}

		// Check if response is directly an array (some endpoints return arrays)
		if (Array.isArray(response)) {
			return { valid: true, data: response, errors, warnings };
		}

		// Single object response (valid for some endpoints)
		return { valid: true, data: response, errors, warnings };
	}
}

/**
 * Data Processing Error
 * Custom error for data validation failures
 */
export class DataValidationError extends Error {
	constructor(
		message: string,
		public errors: ValidationError[],
		public data?: unknown,
	) {
		super(message);
		this.name = "DataValidationError";
	}
}

// Singleton instance
export const dataValidationService = new DataValidationService();
