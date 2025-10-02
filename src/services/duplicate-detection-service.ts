import { createHash } from "node:crypto";
import type { ProcessedTransaction } from "./truelayer-data-processor";

/**
 * Duplicate Detection Result
 */
export interface DuplicateDetectionResult {
	isDuplicate: boolean;
	duplicateOf?: string; // Transaction ID of original
	similarityScore: number;
	reason?: string;
}

/**
 * Duplicate Cluster
 * Groups of potentially duplicate transactions
 */
export interface DuplicateCluster {
	clusterId: string;
	transactions: Array<{
		transactionId: string;
		fingerprint: string;
		data: ProcessedTransaction;
	}>;
	confidence: "high" | "medium" | "low";
}

/**
 * Duplicate Resolution Strategy
 */
export type DuplicateResolutionStrategy =
	| "keep_latest"
	| "keep_oldest"
	| "merge"
	| "flag";

/**
 * DuplicateDetectionService
 * Detects and manages duplicate transactions
 */
export class DuplicateDetectionService {
	/**
	 * Generate unique fingerprint for transaction
	 * Used for exact duplicate detection
	 */
	generateFingerprint(transaction: ProcessedTransaction): string {
		// Create deterministic key from critical fields
		const key = [
			Math.abs(transaction.amount).toFixed(2), // Normalize amount precision
			transaction.date,
			(transaction.merchant_name || "unknown").toLowerCase().trim(),
			transaction.currency.toUpperCase(),
		].join("|");

		return createHash("sha256").update(key).digest("hex");
	}

	/**
	 * Generate fuzzy fingerprint for near-duplicate detection
	 * More lenient than exact fingerprint
	 */
	generateFuzzyFingerprint(transaction: ProcessedTransaction): string {
		// Round amount to nearest pound for fuzzy matching
		const roundedAmount = Math.round(Math.abs(transaction.amount));

		// Use only date without time
		const dateOnly = transaction.date.split("T")[0];

		// Simplify merchant name (remove common words, numbers, special chars)
		const simplifiedMerchant = this.simplifyMerchantName(
			transaction.merchant_name || "",
		);

		const key = [roundedAmount, dateOnly, simplifiedMerchant].join("|");

		return createHash("sha256").update(key).digest("hex");
	}

	/**
	 * Detect if transaction is duplicate of existing transactions
	 */
	async detectDuplicate(
		newTransaction: ProcessedTransaction,
		existingTransactions: ProcessedTransaction[],
	): Promise<DuplicateDetectionResult> {
		const newFingerprint = this.generateFingerprint(newTransaction);
		const newFuzzyFingerprint = this.generateFuzzyFingerprint(newTransaction);

		// Check for exact match
		for (const existing of existingTransactions) {
			const existingFingerprint = this.generateFingerprint(existing);

			if (newFingerprint === existingFingerprint) {
				return {
					isDuplicate: true,
					duplicateOf: existing.truelayer_transaction_id,
					similarityScore: 1.0,
					reason: "Exact match on amount, date, and merchant",
				};
			}
		}

		// Check for fuzzy match
		for (const existing of existingTransactions) {
			const existingFuzzyFingerprint = this.generateFuzzyFingerprint(existing);

			if (newFuzzyFingerprint === existingFuzzyFingerprint) {
				const similarity = this.calculateSimilarity(newTransaction, existing);

				if (similarity > 0.85) {
					return {
						isDuplicate: true,
						duplicateOf: existing.truelayer_transaction_id,
						similarityScore: similarity,
						reason: "High similarity on amount, date, and merchant",
					};
				}
			}
		}

		// Check for transactions within date window
		const dateWindow = this.getTransactionsWithinDateWindow(
			newTransaction,
			existingTransactions,
			3, // 3-day window
		);

		for (const existing of dateWindow) {
			const similarity = this.calculateSimilarity(newTransaction, existing);

			if (similarity > 0.9) {
				return {
					isDuplicate: true,
					duplicateOf: existing.truelayer_transaction_id,
					similarityScore: similarity,
					reason: "Very high similarity within 3-day window",
				};
			}
		}

		return {
			isDuplicate: false,
			similarityScore: 0,
		};
	}

	/**
	 * Find all potential duplicates in a batch of transactions
	 */
	async findDuplicatesInBatch(
		transactions: ProcessedTransaction[],
	): Promise<DuplicateCluster[]> {
		const clusters: DuplicateCluster[] = [];
		const processed = new Set<string>();

		for (let i = 0; i < transactions.length; i++) {
			const transaction = transactions[i];
			const txId = transaction.truelayer_transaction_id;

			if (processed.has(txId)) continue;

			const duplicates: DuplicateCluster["transactions"] = [
				{
					transactionId: txId,
					fingerprint: this.generateFingerprint(transaction),
					data: transaction,
				},
			];

			// Find duplicates of this transaction
			for (let j = i + 1; j < transactions.length; j++) {
				const other = transactions[j];
				const otherId = other.truelayer_transaction_id;

				if (processed.has(otherId)) continue;

				const similarity = this.calculateSimilarity(transaction, other);

				if (similarity > 0.85) {
					duplicates.push({
						transactionId: otherId,
						fingerprint: this.generateFingerprint(other),
						data: other,
					});
					processed.add(otherId);
				}
			}

			// If we found duplicates, create a cluster
			if (duplicates.length > 1) {
				const avgSimilarity = duplicates.reduce((sum, d) => {
					return (
						sum +
						this.calculateSimilarity(transaction, d.data) / duplicates.length
					);
				}, 0);

				clusters.push({
					clusterId: this.generateClusterId(duplicates),
					transactions: duplicates,
					confidence:
						avgSimilarity > 0.95
							? "high"
							: avgSimilarity > 0.85
								? "medium"
								: "low",
				});

				processed.add(txId);
			}
		}

		return clusters;
	}

	/**
	 * Calculate similarity score between two transactions
	 */
	private calculateSimilarity(
		tx1: ProcessedTransaction,
		tx2: ProcessedTransaction,
	): number {
		let score = 0;

		// Amount similarity (40% weight)
		const amountDiff = Math.abs(Math.abs(tx1.amount) - Math.abs(tx2.amount));
		const avgAmount = (Math.abs(tx1.amount) + Math.abs(tx2.amount)) / 2;
		const amountSimilarity = amountDiff / avgAmount;
		score += (1 - Math.min(amountSimilarity, 1)) * 0.4;

		// Date similarity (30% weight)
		const dateSimilarity = this.calculateDateSimilarity(tx1.date, tx2.date);
		score += dateSimilarity * 0.3;

		// Merchant similarity (20% weight)
		const merchantSimilarity = this.calculateStringSimilarity(
			tx1.merchant_name || "",
			tx2.merchant_name || "",
		);
		score += merchantSimilarity * 0.2;

		// Description similarity (10% weight)
		const descriptionSimilarity = this.calculateStringSimilarity(
			tx1.description || "",
			tx2.description || "",
		);
		score += descriptionSimilarity * 0.1;

		return score;
	}

	/**
	 * Calculate date similarity (closer dates = higher score)
	 */
	private calculateDateSimilarity(date1: string, date2: string): number {
		const d1 = new Date(date1);
		const d2 = new Date(date2);
		const diffDays =
			Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);

		if (diffDays === 0) return 1.0;
		if (diffDays <= 1) return 0.9;
		if (diffDays <= 3) return 0.7;
		if (diffDays <= 7) return 0.5;
		return 0.0;
	}

	/**
	 * Calculate string similarity using Levenshtein distance
	 */
	private calculateStringSimilarity(str1: string, str2: string): number {
		const s1 = str1.toLowerCase().trim();
		const s2 = str2.toLowerCase().trim();

		if (s1 === s2) return 1.0;
		if (s1.length === 0 && s2.length === 0) return 1.0;
		if (s1.length === 0 || s2.length === 0) return 0.0;

		// Simple implementation of Levenshtein distance
		const matrix: number[][] = [];

		for (let i = 0; i <= s2.length; i++) {
			matrix[i] = [i];
		}

		for (let j = 0; j <= s1.length; j++) {
			matrix[0][j] = j;
		}

		for (let i = 1; i <= s2.length; i++) {
			for (let j = 1; j <= s1.length; j++) {
				if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1,
						matrix[i][j - 1] + 1,
						matrix[i - 1][j] + 1,
					);
				}
			}
		}

		const distance = matrix[s2.length][s1.length];
		const maxLength = Math.max(s1.length, s2.length);

		return 1 - distance / maxLength;
	}

	/**
	 * Get transactions within date window
	 */
	private getTransactionsWithinDateWindow(
		transaction: ProcessedTransaction,
		allTransactions: ProcessedTransaction[],
		windowDays: number,
	): ProcessedTransaction[] {
		const txDate = new Date(transaction.date);
		const windowStart = new Date(txDate);
		windowStart.setDate(windowStart.getDate() - windowDays);
		const windowEnd = new Date(txDate);
		windowEnd.setDate(windowEnd.getDate() + windowDays);

		return allTransactions.filter((tx) => {
			const date = new Date(tx.date);
			return date >= windowStart && date <= windowEnd;
		});
	}

	/**
	 * Simplify merchant name for fuzzy matching
	 */
	private simplifyMerchantName(name: string): string {
		return name
			.toLowerCase()
			.trim()
			.replace(/[^a-z\s]/g, "") // Remove numbers and special chars
			.replace(/\s+/g, " ") // Normalize whitespace
			.replace(/\b(ltd|limited|plc|inc|llc|corp|co)\b/g, "") // Remove company suffixes
			.trim();
	}

	/**
	 * Generate cluster ID from duplicate transactions
	 */
	private generateClusterId(
		transactions: DuplicateCluster["transactions"],
	): string {
		const ids = transactions
			.map((t) => t.transactionId)
			.sort()
			.join("|");
		return createHash("sha256").update(ids).digest("hex").substring(0, 16);
	}

	/**
	 * Apply resolution strategy to duplicate cluster
	 */
	async resolveDuplicates(
		cluster: DuplicateCluster,
		strategy: DuplicateResolutionStrategy,
	): Promise<{
		keep: string[];
		remove: string[];
		flag: string[];
	}> {
		const transactions = cluster.transactions;

		switch (strategy) {
			case "keep_latest": {
				// Sort by date (most recent first)
				const sorted = [...transactions].sort((a, b) => {
					return (
						new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
					);
				});
				return {
					keep: [sorted[0].transactionId],
					remove: sorted.slice(1).map((t) => t.transactionId),
					flag: [],
				};
			}

			case "keep_oldest": {
				// Sort by date (oldest first)
				const sorted = [...transactions].sort((a, b) => {
					return (
						new Date(a.data.date).getTime() - new Date(b.data.date).getTime()
					);
				});
				return {
					keep: [sorted[0].transactionId],
					remove: sorted.slice(1).map((t) => t.transactionId),
					flag: [],
				};
			}

			case "merge": {
				// Keep the most complete transaction (most non-null fields)
				const scored = transactions.map((t) => ({
					transaction: t,
					score: this.calculateCompletenessScore(t.data),
				}));
				scored.sort((a, b) => b.score - a.score);

				return {
					keep: [scored[0].transaction.transactionId],
					remove: scored.slice(1).map((s) => s.transaction.transactionId),
					flag: [],
				};
			}

			case "flag": {
				// Don't remove anything, just flag for manual review
				return {
					keep: [],
					remove: [],
					flag: transactions.map((t) => t.transactionId),
				};
			}

			default:
				throw new Error(`Unknown resolution strategy: ${strategy}`);
		}
	}

	/**
	 * Calculate completeness score for transaction
	 * Higher score = more complete data
	 */
	private calculateCompletenessScore(
		transaction: ProcessedTransaction,
	): number {
		let score = 0;

		if (transaction.merchant_name) score += 2;
		if (transaction.category && transaction.category !== "Uncategorized")
			score += 1;
		if (transaction.description) score += 1;
		if (transaction.truelayer_transaction_id) score += 1;

		return score;
	}
}

// Singleton instance
export const duplicateDetectionService = new DuplicateDetectionService();
