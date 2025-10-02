import type { TrueLayerAccount } from "@/types/truelayer";

/**
 * Account Type
 */
export type AccountType = "checking" | "savings" | "investment" | "credit";

/**
 * Account Categorization Service
 * Automatically categorizes accounts based on TrueLayer metadata
 */
export class AccountCategorizationService {
	/**
	 * Detect account type from TrueLayer account data
	 */
	detectAccountType(account: TrueLayerAccount): AccountType {
		const truelayerType = account.account_type;
		const displayName = account.display_name?.toLowerCase() || "";
		const providerId = account.provider?.provider_id?.toLowerCase() || "";

		// Map TrueLayer account type to internal type
		let detectedType = this.mapTruelayerType(truelayerType);

		// Apply institution-specific rules
		detectedType = this.applyInstitutionRules(
			detectedType,
			displayName,
			providerId,
		);

		// Apply name-based heuristics
		detectedType = this.applyNameHeuristics(detectedType, displayName);

		return detectedType;
	}

	/**
	 * Map TrueLayer account type to internal account type
	 */
	private mapTruelayerType(
		truelayerType: TrueLayerAccount["account_type"],
	): AccountType {
		switch (truelayerType) {
			case "TRANSACTION":
				return "checking";
			case "SAVINGS":
				return "savings";
			case "CREDIT_CARD":
				return "credit";
			default:
				return "checking"; // Default fallback
		}
	}

	/**
	 * Apply institution-specific mapping rules
	 */
	private applyInstitutionRules(
		currentType: AccountType,
		displayName: string,
		providerId: string,
	): AccountType {
		// Lloyds Bank specific rules
		if (providerId.includes("lloyds")) {
			if (displayName.includes("club")) return "savings";
			if (displayName.includes("saver")) return "savings";
			if (displayName.includes("isa")) return "savings";
		}

		// Barclays specific rules
		if (providerId.includes("barclays")) {
			if (displayName.includes("everyday saver")) return "savings";
			if (displayName.includes("rainy day saver")) return "savings";
		}

		// HSBC specific rules
		if (providerId.includes("hsbc")) {
			if (displayName.includes("advance")) return "checking";
			if (displayName.includes("premier")) return "checking";
			if (displayName.includes("flexible saver")) return "savings";
		}

		// Nationwide specific rules
		if (providerId.includes("nationwide")) {
			if (displayName.includes("flexaccount")) return "checking";
			if (displayName.includes("flexdirect")) return "checking";
		}

		// Santander specific rules
		if (providerId.includes("santander")) {
			if (displayName.includes("123")) return "checking";
			if (displayName.includes("everyday")) return "checking";
		}

		// First Direct specific rules
		if (providerId.includes("firstdirect")) {
			if (displayName.includes("1st")) return "checking";
		}

		// Monzo specific rules
		if (providerId.includes("monzo")) {
			if (displayName.includes("pot")) return "savings";
		}

		// Starling specific rules
		if (providerId.includes("starling")) {
			if (displayName.includes("space")) return "savings";
		}

		return currentType;
	}

	/**
	 * Apply name-based heuristics for account categorization
	 */
	private applyNameHeuristics(
		currentType: AccountType,
		displayName: string,
	): AccountType {
		// Savings account indicators
		const savingsKeywords = [
			"savings",
			"saver",
			"isa",
			"deposit",
			"reserve",
			"rainy day",
			"emergency",
			"goal",
			"pot",
			"space",
		];

		for (const keyword of savingsKeywords) {
			if (displayName.includes(keyword)) {
				return "savings";
			}
		}

		// Checking account indicators
		const checkingKeywords = [
			"current",
			"checking",
			"everyday",
			"transaction",
			"main",
			"primary",
			"day-to-day",
		];

		for (const keyword of checkingKeywords) {
			if (displayName.includes(keyword)) {
				return "checking";
			}
		}

		// Credit card indicators
		const creditKeywords = [
			"credit",
			"card",
			"mastercard",
			"visa",
			"amex",
			"american express",
		];

		for (const keyword of creditKeywords) {
			if (displayName.includes(keyword)) {
				return "credit";
			}
		}

		// Investment account indicators
		const investmentKeywords = [
			"investment",
			"stocks",
			"shares",
			"portfolio",
			"trading",
			"brokerage",
		];

		for (const keyword of investmentKeywords) {
			if (displayName.includes(keyword)) {
				return "investment";
			}
		}

		return currentType;
	}

	/**
	 * Validate account type against account characteristics
	 */
	validateAccountType(
		accountType: AccountType,
		accountData: {
			balance?: number;
			hasOverdraft?: boolean;
			hasTransactions?: boolean;
		},
	): {
		valid: boolean;
		confidence: "high" | "medium" | "low";
		suggestedType?: AccountType;
		reason?: string;
	} {
		const {
			balance = 0,
			hasOverdraft = false,
			hasTransactions = true,
		} = accountData;

		// Credit cards typically have negative balances or zero
		if (accountType === "credit") {
			if (balance > 1000 && hasTransactions) {
				return {
					valid: false,
					confidence: "low",
					suggestedType: "checking",
					reason:
						"Credit card with unusually high positive balance, might be checking account",
				};
			}
			return { valid: true, confidence: "high" };
		}

		// Savings accounts typically don't have overdrafts
		if (accountType === "savings") {
			if (hasOverdraft) {
				return {
					valid: false,
					confidence: "medium",
					suggestedType: "checking",
					reason: "Savings account with overdraft, likely checking account",
				};
			}
			return { valid: true, confidence: "high" };
		}

		// Checking accounts can have overdrafts
		if (accountType === "checking") {
			return { valid: true, confidence: "high" };
		}

		// Investment accounts
		if (accountType === "investment") {
			return { valid: true, confidence: "medium" };
		}

		return { valid: true, confidence: "medium" };
	}

	/**
	 * Get account type display name
	 */
	getAccountTypeDisplayName(accountType: AccountType): string {
		const displayNames: Record<AccountType, string> = {
			checking: "Current Account",
			savings: "Savings Account",
			investment: "Investment Account",
			credit: "Credit Card",
		};

		return displayNames[accountType];
	}

	/**
	 * Get account type icon
	 */
	getAccountTypeIcon(accountType: AccountType): string {
		const icons: Record<AccountType, string> = {
			checking: "💳",
			savings: "🏦",
			investment: "📈",
			credit: "💳",
		};

		return icons[accountType];
	}

	/**
	 * Get all supported account types
	 */
	getSupportedAccountTypes(): AccountType[] {
		return ["checking", "savings", "investment", "credit"];
	}

	/**
	 * Suggest account type based on usage patterns
	 */
	suggestAccountTypeFromUsage(usage: {
		transactionCount: number;
		averageBalance: number;
		withdrawalCount: number;
		depositCount: number;
	}): AccountType {
		const { transactionCount, averageBalance, withdrawalCount, depositCount } =
			usage;

		// High transaction count suggests checking account
		if (transactionCount > 20) {
			return "checking";
		}

		// Low transaction count with high balance suggests savings
		if (transactionCount < 5 && averageBalance > 1000) {
			return "savings";
		}

		// Mostly withdrawals suggests checking
		if (withdrawalCount > depositCount * 2) {
			return "checking";
		}

		// Default to checking
		return "checking";
	}
}

// Singleton instance
export const accountCategorizationService = new AccountCategorizationService();
