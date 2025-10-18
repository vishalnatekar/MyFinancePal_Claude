import type { TransactionCategory } from "@/types/transaction";

/**
 * Service for automatic transaction categorization based on merchant patterns
 *
 * NOTE: This service is a FALLBACK for TrueLayer categorization.
 * TrueLayer provides transaction_category in their API, which is used as the primary source.
 * This service is used for:
 * - Manual transactions (not from TrueLayer)
 * - Transactions where TrueLayer didn't provide a category
 * - User overrides of TrueLayer categories
 */
export class TransactionCategorizationService {
	private static categoryPatterns: Record<TransactionCategory, RegExp[]> = {
		groceries: [
			/tesco/i,
			/sainsbury/i,
			/asda/i,
			/aldi/i,
			/lidl/i,
			/waitrose/i,
			/morrisons/i,
			/coop|co-op/i,
			/marks & spencer|m&s/i,
			/iceland/i,
			/whole foods/i,
			/trader joe/i,
		],
		utilities: [
			/british gas/i,
			/thames water/i,
			/edf energy/i,
			/scottish power/i,
			/ovo energy/i,
			/octopus energy/i,
			/bulb energy/i,
			/water|electric|gas|energy/i,
			/council tax/i,
		],
		entertainment: [
			/netflix/i,
			/spotify/i,
			/amazon prime/i,
			/cinema|odeon|vue/i,
			/apple music/i,
			/disney\+|disney plus/i,
			/hbo|hulu/i,
			/theatre|theater/i,
			/concert|gig/i,
			/museum|gallery/i,
		],
		transport: [
			/uber/i,
			/\btfl\b|transport for london/i,
			/trainline/i,
			/shell|bp|esso|texaco/i,
			/petrol|fuel/i,
			/parking/i,
			/taxi|cab/i,
			/bus|coach/i,
			/train|rail/i,
			/oyster/i,
		],
		dining: [
			/restaurant/i,
			/cafe|coffee/i,
			/pizza/i,
			/deliveroo/i,
			/uber eats/i,
			/just eat/i,
			/mcdonald|burger king|kfc/i,
			/starbucks|costa|nero/i,
			/nando|wagamama|prezzo/i,
			/pub|bar/i,
		],
		healthcare: [
			/boots pharmacy/i,
			/pharmacy/i,
			/hospital/i,
			/doctor|gp/i,
			/dental|dentist/i,
			/optician/i,
			/medical|health/i,
			/nhs/i,
		],
		shopping: [
			/amazon(?! prime)/i,
			/ebay/i,
			/argos/i,
			/john lewis/i,
			/next|zara|h&m/i,
			/boots(?! pharmacy)/i,
			/superdrug/i,
			/clothing|fashion/i,
		],
		housing: [
			/rent|landlord/i,
			/mortgage/i,
			/estate agent|letting/i,
			/home insurance/i,
			/furniture|ikea/i,
			/diy|b&q|homebase/i,
		],
		income: [
			/salary|wage/i,
			/payroll/i,
			/transfer from|payment from/i,
			/refund/i,
			/dividend/i,
			/interest/i,
		],
		transfer: [
			/transfer to/i,
			/transfer/i,
			/payment to/i,
			/atm withdrawal/i,
			/cash/i,
		],
		other: [],
	};

	/**
	 * Categorize a transaction based on merchant name and amount
	 */
	static categorizeTransaction(
		merchantName: string,
		amount: number,
		description?: string,
	): TransactionCategory {
		const searchText = `${merchantName} ${description || ""}`.toLowerCase();

		// Check for income first (positive amounts with certain keywords)
		if (amount > 0) {
			for (const pattern of TransactionCategorizationService.categoryPatterns
				.income) {
				if (pattern.test(searchText)) {
					return "income";
				}
			}
			// Large positive amounts without keywords likely income
			if (amount > 500) {
				return "income";
			}
		}

		// Check all other categories in priority order
		// More specific categories first
		const priorityOrder: TransactionCategory[] = [
			"healthcare",
			"utilities",
			"housing",
			"groceries",
			"transport",
			"entertainment",
			"dining",
			"shopping",
			"transfer",
		];

		for (const category of priorityOrder) {
			const patterns =
				TransactionCategorizationService.categoryPatterns[category];
			for (const pattern of patterns) {
				if (pattern.test(searchText)) {
					return category;
				}
			}
		}

		// Default to other if no match found
		return "other";
	}

	/**
	 * Bulk categorize transactions
	 */
	static categorizeTransactions(
		transactions: Array<{
			merchant_name: string;
			amount: number;
			description?: string;
		}>,
	): TransactionCategory[] {
		return transactions.map((tx) =>
			TransactionCategorizationService.categorizeTransaction(
				tx.merchant_name,
				tx.amount,
				tx.description,
			),
		);
	}

	/**
	 * Get all available categories
	 */
	static getAvailableCategories(): TransactionCategory[] {
		return Object.keys(
			TransactionCategorizationService.categoryPatterns,
		) as TransactionCategory[];
	}

	/**
	 * Get category color scheme (for UI consistency)
	 */
	static getCategoryColor(category: TransactionCategory): {
		bg: string;
		text: string;
	} {
		const colors: Record<TransactionCategory, { bg: string; text: string }> = {
			groceries: { bg: "bg-green-100", text: "text-green-800" },
			utilities: { bg: "bg-blue-100", text: "text-blue-800" },
			entertainment: { bg: "bg-purple-100", text: "text-purple-800" },
			transport: { bg: "bg-yellow-100", text: "text-yellow-800" },
			dining: { bg: "bg-orange-100", text: "text-orange-800" },
			shopping: { bg: "bg-pink-100", text: "text-pink-800" },
			healthcare: { bg: "bg-red-100", text: "text-red-800" },
			housing: { bg: "bg-indigo-100", text: "text-indigo-800" },
			income: { bg: "bg-green-100", text: "text-green-800" },
			transfer: { bg: "bg-gray-100", text: "text-gray-800" },
			other: { bg: "bg-gray-100", text: "text-gray-800" },
		};

		return colors[category] || colors.other;
	}
}
