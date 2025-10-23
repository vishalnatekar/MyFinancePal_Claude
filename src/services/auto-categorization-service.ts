// Auto-Categorization Service
// Story 4.2: Automatic Transaction Categorization
// Applies splitting rules automatically to new transactions with confidence scoring

import { createClient } from "@/lib/supabase";
import type { SplittingRule } from "@/types/splitting-rule";
import type { Transaction, TransactionSplit } from "@/types/transaction";
import { findMatchingRule } from "./rule-matching-service";

/**
 * Result of applying a rule to a transaction
 */
export interface RuleApplicationResult {
	transaction_id: string;
	rule_applied: boolean;
	rule_id?: string;
	rule_name?: string;
	confidence_score: number;
	is_shared_expense: boolean;
	shared_with_household_id?: string;
	split_percentage?: Record<string, number>;
}

/**
 * Batch application result
 */
export interface BatchCategorizationResult {
	total: number;
	categorized: number;
	uncategorized: number;
	results: RuleApplicationResult[];
}

/**
 * Calculate confidence score based on rule type and match quality
 */
export function calculateConfidenceScore(
	transaction: Transaction,
	rule: SplittingRule,
): number {
	switch (rule.rule_type) {
		case "merchant": {
			// Check if exact match (no regex wildcards)
			const isExactMatch =
				rule.merchant_pattern &&
				!rule.merchant_pattern.includes(".*") &&
				!rule.merchant_pattern.includes(".+") &&
				transaction.merchant_name?.toLowerCase() ===
					rule.merchant_pattern.toLowerCase();

			return isExactMatch ? 100 : 85; // Exact = 100, Pattern = 85
		}

		case "category":
			// Exact category match = 95
			return 95;

		case "amount_threshold":
			// Amount threshold = 80 (less certain than merchant/category)
			return 80;

		case "default":
			// Default rule = 60 (lowest confidence)
			return 60;

		default:
			// Unknown rule type
			return 50;
	}
}

/**
 * Get confidence level for display
 */
export function getConfidenceLevel(
	score: number | null | undefined,
): "high" | "medium" | "low" | "none" {
	if (score === null || score === undefined) return "none";
	if (score >= 95) return "high";
	if (score >= 70) return "medium";
	if (score >= 50) return "low";
	return "none";
}

/**
 * Apply rules to a single transaction
 * Updates the transaction with categorization details
 */
export async function applyRulesToTransaction(
	transaction: Transaction,
	rules: SplittingRule[],
	householdId?: string,
): Promise<RuleApplicationResult> {
	const supabase = createClient();

	// Find the matching rule
	const matchedRule = findMatchingRule(transaction, rules);

	if (!matchedRule) {
		// No rule matched - transaction needs manual review
		return {
			transaction_id: transaction.id,
			rule_applied: false,
			confidence_score: 0,
			is_shared_expense: false,
		};
	}

	// Calculate confidence score
	const confidenceScore = calculateConfidenceScore(transaction, matchedRule);

	// Determine if shared based on split_percentage
	const hasSharedSplit =
		matchedRule.split_percentage &&
		Object.keys(matchedRule.split_percentage).length > 0;

	// Update transaction with rule application
	const { error } = await supabase
		.from("transactions")
		.update({
			splitting_rule_id: matchedRule.id,
			is_shared_expense: hasSharedSplit,
			shared_with_household_id: hasSharedSplit
				? matchedRule.household_id
				: null,
			confidence_score: confidenceScore,
			manual_override: false,
		})
		.eq("id", transaction.id);

	if (error) {
		console.error(
			`Failed to apply rule to transaction ${transaction.id}:`,
			error,
		);
		throw error;
	}

	// Log the rule match
	console.log(
		`[Auto-Categorization] Transaction ${transaction.id} matched rule "${matchedRule.rule_name}" (confidence: ${confidenceScore})`,
	);

	return {
		transaction_id: transaction.id,
		rule_applied: true,
		rule_id: matchedRule.id,
		rule_name: matchedRule.rule_name,
		confidence_score: confidenceScore,
		is_shared_expense: hasSharedSplit,
		shared_with_household_id: hasSharedSplit
			? matchedRule.household_id
			: undefined,
		split_percentage: matchedRule.split_percentage,
	};
}

/**
 * Apply rules to multiple transactions in batch
 * Processes in chunks for performance
 */
export async function applyRulesToTransactions(
	transactions: Transaction[],
	rules: SplittingRule[],
	householdId?: string,
): Promise<BatchCategorizationResult> {
	const results: RuleApplicationResult[] = [];
	const BATCH_SIZE = 50; // Process 50 at a time

	// Process in batches
	for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
		const batch = transactions.slice(i, i + BATCH_SIZE);

		// Apply rules to each transaction in the batch
		const batchResults = await Promise.all(
			batch.map((txn) => applyRulesToTransaction(txn, rules, householdId)),
		);

		results.push(...batchResults);
	}

	// Calculate summary statistics
	const categorized = results.filter((r) => r.rule_applied).length;
	const uncategorized = results.length - categorized;

	console.log(
		`[Batch Categorization] Processed ${results.length} transactions: ${categorized} categorized, ${uncategorized} need review`,
	);

	return {
		total: results.length,
		categorized,
		uncategorized,
		results,
	};
}

/**
 * Get uncategorized transactions for a household
 * Returns transactions that need manual review
 */
export async function getUncategorizedTransactions(
	householdId: string,
	options: {
		min_confidence?: number;
		max_confidence?: number;
		limit?: number;
		offset?: number;
	} = {},
): Promise<Transaction[]> {
	const supabase = createClient();

	const {
		min_confidence = 0,
		max_confidence = 70,
		limit = 50,
		offset = 0,
	} = options;

	// Query transactions that need review
	const { data, error } = await supabase
		.from("transactions")
		.select("*")
		.eq("household_id", householdId)
		.or(
			`confidence_score.is.null,and(confidence_score.gte.${min_confidence},confidence_score.lte.${max_confidence})`,
		)
		.eq("manual_override", false)
		.order("date", { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) {
		console.error("Failed to fetch uncategorized transactions:", error);
		throw error;
	}

	return data || [];
}

/**
 * Validate split transaction amounts
 */
export function validateSplitTransaction(
	transaction: Transaction,
	splitDetails: TransactionSplit,
): { isValid: boolean; error?: string } {
	const totalAmount = Math.abs(transaction.amount);
	const splitTotal = splitDetails.personal_amount + splitDetails.shared_amount;

	// Check if amounts sum to transaction total
	if (Math.abs(splitTotal - totalAmount) > 0.01) {
		// Allow 1 cent rounding difference
		return {
			isValid: false,
			error: `Split amounts (${splitTotal}) must equal transaction total (${totalAmount})`,
		};
	}

	// Validate split percentage sums to 100%
	const percentageTotal = Object.values(splitDetails.split_percentage).reduce(
		(sum, val) => sum + val,
		0,
	);

	if (Math.abs(percentageTotal - 100) > 0.01) {
		return {
			isValid: false,
			error: `Split percentages must sum to 100%, got ${percentageTotal}%`,
		};
	}

	// Validate amounts are non-negative
	if (splitDetails.personal_amount < 0 || splitDetails.shared_amount < 0) {
		return {
			isValid: false,
			error: "Split amounts must be non-negative",
		};
	}

	return { isValid: true };
}

/**
 * Record rule feedback for analytics
 */
export async function recordRuleFeedback(
	transactionId: string,
	ruleId: string | null,
	householdId: string,
	action: "accepted" | "rejected" | "overridden",
	originalConfidenceScore?: number,
	overrideDetails?: Record<string, unknown>,
): Promise<void> {
	const supabase = createClient();

	const { error } = await supabase.from("rule_feedback").insert({
		transaction_id: transactionId,
		rule_id: ruleId,
		household_id: householdId,
		user_action: action,
		original_confidence_score: originalConfidenceScore,
		override_details: overrideDetails,
	});

	if (error) {
		console.error("Failed to record rule feedback:", error);
		throw error;
	}

	console.log(`[Feedback] Recorded ${action} for transaction ${transactionId}`);
}
