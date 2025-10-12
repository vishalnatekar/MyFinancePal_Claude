import type { FinancialAccount } from "@/types/account";
import type {
	TrueLayerAccount,
	TrueLayerBalance,
	TrueLayerTransaction,
} from "@/types/truelayer";
import { TransactionCategorizationService } from "./transaction-categorization-service";

/**
 * TrueLayerDataProcessor
 * Transforms raw TrueLayer API responses into internal data models
 */
export class TrueLayerDataProcessor {
	/**
	 * Process raw TrueLayer account data into internal FinancialAccount model
	 */
	async processAccountData(
		rawAccount: TrueLayerAccount,
		balance: TrueLayerBalance,
		userId: string,
		connectionId: string,
		encryptedAccessToken: string,
	): Promise<Omit<FinancialAccount, "id" | "created_at" | "updated_at">> {
		return {
			user_id: userId,
			truelayer_account_id: rawAccount.account_id,
			truelayer_connection_id: connectionId,
			account_type: this.normalizeAccountType(rawAccount.account_type),
			account_name: rawAccount.display_name,
			institution_name: rawAccount.provider.display_name,
			current_balance: this.normalizeAmount(balance.current),
			is_shared: false,
			last_synced: new Date().toISOString(),
			is_manual: false,
			connection_status: "active",
			encrypted_access_token: encryptedAccessToken,
		};
	}

	/**
	 * Process raw TrueLayer transaction data
	 */
	async processTransactionData(
		rawTransaction: TrueLayerTransaction,
		accountId: string,
	): Promise<ProcessedTransaction> {
		const normalizedAmount = this.normalizeTransactionAmount(
			rawTransaction.amount,
			rawTransaction.transaction_type,
		);

		return {
			account_id: accountId,
			truelayer_transaction_id: rawTransaction.transaction_id,
			amount: normalizedAmount,
			merchant_name: rawTransaction.merchant_name || null,
			category: this.normalizeCategory(
				rawTransaction.transaction_category,
				rawTransaction.merchant_name,
				normalizedAmount,
				rawTransaction.description,
			),
			date: this.normalizeDate(rawTransaction.timestamp),
			description: rawTransaction.description,
			currency: rawTransaction.currency,
			transaction_type: rawTransaction.transaction_type,
			is_shared_expense: false,
			manual_override: false,
		};
	}

	/**
	 * Process batch of transactions
	 */
	async processTransactionBatch(
		rawTransactions: TrueLayerTransaction[],
		accountId: string,
	): Promise<ProcessedTransaction[]> {
		return Promise.all(
			rawTransactions.map((tx) => this.processTransactionData(tx, accountId)),
		);
	}

	/**
	 * Normalize TrueLayer account type to internal account type
	 */
	private normalizeAccountType(
		trueLayerType: TrueLayerAccount["account_type"],
	): "checking" | "savings" | "investment" | "credit" {
		switch (trueLayerType) {
			case "TRANSACTION":
				return "checking";
			case "SAVINGS":
				return "savings";
			case "CREDIT_CARD":
				return "credit";
			default:
				// Default to checking for unknown types
				return "checking";
		}
	}

	/**
	 * Normalize financial amount with proper precision
	 * Ensures consistent decimal handling for financial calculations
	 */
	normalizeAmount(amount: number): number {
		// Round to 2 decimal places for currency precision
		return Math.round(amount * 100) / 100;
	}

	/**
	 * Normalize transaction amount based on type
	 * DEBIT transactions are negative, CREDIT transactions are positive
	 */
	private normalizeTransactionAmount(
		amount: number,
		type: "DEBIT" | "CREDIT",
	): number {
		const normalizedAmount = this.normalizeAmount(Math.abs(amount));
		return type === "DEBIT" ? -normalizedAmount : normalizedAmount;
	}

	/**
	 * Normalize transaction category
	 * Uses TrueLayer category if available, falls back to our categorization service
	 */
	private normalizeCategory(
		category: string,
		merchantName?: string,
		amount?: number,
		description?: string,
	): string {
		// If TrueLayer provided a category, use it
		if (category && category !== "UNCATEGORIZED") {
			// Clean up category string
			return category
				.split("_")
				.map(
					(word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
				)
				.join(" ");
		}

		// Fallback: Use our categorization service for transactions without TrueLayer category
		if (merchantName && amount !== undefined) {
			return TransactionCategorizationService.categorizeTransaction(
				merchantName,
				amount,
				description,
			);
		}

		return "other";
	}

	/**
	 * Normalize date from TrueLayer timestamp to YYYY-MM-DD format
	 */
	private normalizeDate(timestamp: string): string {
		const date = new Date(timestamp);
		return date.toISOString().split("T")[0];
	}

	/**
	 * Validate account balance data
	 */
	validateBalanceData(balance: TrueLayerBalance): boolean {
		// Check for valid currency
		if (!balance.currency || balance.currency.length !== 3) {
			return false;
		}

		// Check for valid balance values
		if (
			typeof balance.current !== "number" ||
			!Number.isFinite(balance.current)
		) {
			return false;
		}

		return true;
	}

	/**
	 * Validate transaction data
	 */
	validateTransactionData(transaction: TrueLayerTransaction): boolean {
		// Check required fields
		if (!transaction.transaction_id || !transaction.timestamp) {
			return false;
		}

		// Check amount is valid
		if (
			typeof transaction.amount !== "number" ||
			!Number.isFinite(transaction.amount)
		) {
			return false;
		}

		// Check currency code
		if (!transaction.currency || transaction.currency.length !== 3) {
			return false;
		}

		// Check transaction type
		if (
			transaction.transaction_type !== "DEBIT" &&
			transaction.transaction_type !== "CREDIT"
		) {
			return false;
		}

		return true;
	}
}

/**
 * Processed transaction type for internal use
 */
export interface ProcessedTransaction {
	account_id: string;
	truelayer_transaction_id: string;
	amount: number;
	merchant_name: string | null;
	category: string;
	date: string;
	description: string;
	currency: string;
	transaction_type: "DEBIT" | "CREDIT";
	is_shared_expense: boolean;
	manual_override: boolean;
}

// Singleton instance
export const trueLayerDataProcessor = new TrueLayerDataProcessor();
