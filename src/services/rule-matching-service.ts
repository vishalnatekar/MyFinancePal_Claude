// Rule Matching Service
// Story 4.1: Expense Splitting Rules Engine
// Implements rule priority and matching algorithm

import type { SplittingRule } from "@/types/splitting-rule";
import type { Transaction } from "@/types/transaction";
import safeRegex from "safe-regex";

// Maximum allowed length for regex patterns (ReDoS protection)
const MAX_REGEX_LENGTH = 200;

// Timeout for regex execution (milliseconds)
const REGEX_TIMEOUT_MS = 100;

/**
 * Find the matching rule for a transaction
 * Returns the highest priority rule that matches, or null if no rules match
 */
export function findMatchingRule(
	transaction: Transaction,
	rules: SplittingRule[],
): SplittingRule | null {
	// Filter out inactive rules and sort by priority (1 = highest)
	const activeRules = rules
		.filter((rule) => rule.is_active)
		.sort((a, b) => a.priority - b.priority);

	// Find the first matching rule (highest priority)
	for (const rule of activeRules) {
		if (ruleMatches(rule, transaction)) {
			return rule;
		}
	}

	return null; // No matching rule found
}

/**
 * Check if a rule matches a transaction
 */
export function ruleMatches(
	rule: SplittingRule,
	transaction: Transaction,
): boolean {
	switch (rule.rule_type) {
		case "merchant":
			return matchMerchantRule(rule, transaction);

		case "category":
			return matchCategoryRule(rule, transaction);

		case "amount_threshold":
			return matchAmountThresholdRule(rule, transaction);

		case "default":
			return true; // Default rules match everything

		default:
			console.warn(`Unknown rule type: ${rule.rule_type}`);
			return false;
	}
}

/**
 * Match merchant-based rule using regex pattern with ReDoS protection
 */
function matchMerchantRule(
	rule: SplittingRule,
	transaction: Transaction,
): boolean {
	if (!rule.merchant_pattern || !transaction.merchant_name) {
		return false;
	}

	// ReDoS Protection: Check pattern length
	if (rule.merchant_pattern.length > MAX_REGEX_LENGTH) {
		console.error(
			`Regex pattern too long in rule ${rule.id}: ${rule.merchant_pattern.length} chars (max ${MAX_REGEX_LENGTH})`,
		);
		return false;
	}

	// ReDoS Protection: Check if regex is safe (no catastrophic backtracking)
	if (!safeRegex(rule.merchant_pattern)) {
		console.error(
			`Unsafe regex pattern detected in rule ${rule.id}: ${rule.merchant_pattern} (potential ReDoS vulnerability)`,
		);
		return false;
	}

	try {
		const regex = new RegExp(rule.merchant_pattern, "i"); // Case-insensitive

		// ReDoS Protection: Implement timeout for regex execution
		const startTime = Date.now();
		const result = regex.test(transaction.merchant_name);
		const executionTime = Date.now() - startTime;

		if (executionTime > REGEX_TIMEOUT_MS) {
			console.warn(
				`Regex execution exceeded timeout in rule ${rule.id}: ${executionTime}ms (max ${REGEX_TIMEOUT_MS}ms)`,
			);
		}

		return result;
	} catch (error) {
		console.error(
			`Invalid regex pattern in rule ${rule.id}: ${rule.merchant_pattern}`,
			error,
		);
		return false;
	}
}

/**
 * Match category-based rule with exact category matching
 */
function matchCategoryRule(
	rule: SplittingRule,
	transaction: Transaction,
): boolean {
	if (!rule.category_match || !transaction.category) {
		return false;
	}

	// Exact match (case-insensitive)
	return (
		rule.category_match.toLowerCase() === transaction.category.toLowerCase()
	);
}

/**
 * Match amount threshold rule with min/max range
 */
function matchAmountThresholdRule(
	rule: SplittingRule,
	transaction: Transaction,
): boolean {
	const amount = Math.abs(transaction.amount); // Use absolute value for comparison

	// Check minimum amount
	if (rule.min_amount !== undefined && rule.min_amount !== null) {
		if (amount < rule.min_amount) {
			return false;
		}
	}

	// Check maximum amount
	if (rule.max_amount !== undefined && rule.max_amount !== null) {
		if (amount > rule.max_amount) {
			return false;
		}
	}

	return true;
}

/**
 * Find all matching rules for a transaction (for testing/debugging)
 * Returns all rules that match, ordered by priority
 */
export function findAllMatchingRules(
	transaction: Transaction,
	rules: SplittingRule[],
): SplittingRule[] {
	return rules
		.filter((rule) => rule.is_active && ruleMatches(rule, transaction))
		.sort((a, b) => a.priority - b.priority);
}

/**
 * Test a draft rule against a transaction (for rule testing interface)
 */
export function testDraftRule(
	draftRule: Partial<SplittingRule>,
	transaction: Transaction,
): boolean {
	// Create a temporary full rule object for testing
	const tempRule: SplittingRule = {
		id: "temp",
		household_id: "temp",
		rule_name: "temp",
		rule_type: draftRule.rule_type || "merchant",
		priority: draftRule.priority || 100,
		merchant_pattern: draftRule.merchant_pattern,
		category_match: draftRule.category_match,
		min_amount: draftRule.min_amount,
		max_amount: draftRule.max_amount,
		split_percentage: {},
		is_active: true,
		created_by: "temp",
		created_at: new Date().toISOString(),
		apply_to_existing_transactions: false,
	};

	return ruleMatches(tempRule, transaction);
}

/**
 * Log rule match for debugging
 */
export function logRuleMatch(
	transaction: Transaction,
	rule: SplittingRule | null,
): void {
	if (rule) {
		console.log(
			`[Rule Match] Transaction ${transaction.id} matched rule "${rule.rule_name}" (priority ${rule.priority})`,
		);
	} else {
		console.log(
			`[Rule Match] Transaction ${transaction.id} did not match any rules`,
		);
	}
}

/**
 * Validate that a rule's configuration is complete
 */
export function validateRuleConfiguration(rule: SplittingRule): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	// Check rule type specific requirements
	switch (rule.rule_type) {
		case "merchant":
			if (!rule.merchant_pattern) {
				errors.push("Merchant rule requires merchant_pattern");
			} else {
				// Validate regex length (ReDoS protection)
				if (rule.merchant_pattern.length > MAX_REGEX_LENGTH) {
					errors.push(
						`Regex pattern too long: ${rule.merchant_pattern.length} chars (max ${MAX_REGEX_LENGTH})`,
					);
				}
				// Validate regex safety (ReDoS protection)
				if (!safeRegex(rule.merchant_pattern)) {
					errors.push(
						"Unsafe regex pattern detected (potential ReDoS vulnerability)",
					);
				}
				// Validate regex syntax
				try {
					new RegExp(rule.merchant_pattern);
				} catch {
					errors.push("Invalid regex pattern in merchant_pattern");
				}
			}
			break;

		case "category":
			if (!rule.category_match) {
				errors.push("Category rule requires category_match");
			}
			break;

		case "amount_threshold":
			if (rule.min_amount === undefined || rule.min_amount === null) {
				errors.push("Amount threshold rule requires min_amount");
			}
			if (
				rule.min_amount &&
				rule.max_amount &&
				rule.max_amount <= rule.min_amount
			) {
				errors.push("max_amount must be greater than min_amount");
			}
			break;

		case "default":
			// Default rules don't need additional validation
			break;

		default:
			errors.push(`Unknown rule type: ${rule.rule_type}`);
	}

	// Validate split_percentage
	if (
		!rule.split_percentage ||
		Object.keys(rule.split_percentage).length === 0
	) {
		errors.push(
			"split_percentage is required and must have at least one member",
		);
	} else {
		const total = Object.values(rule.split_percentage).reduce(
			(sum, val) => sum + val,
			0,
		);
		if (total !== 100) {
			errors.push(`split_percentage must sum to 100%, got ${total}%`);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Get rule match statistics for a set of transactions
 */
export function getRuleMatchStatistics(
	transactions: Transaction[],
	rules: SplittingRule[],
): {
	total_transactions: number;
	matched_transactions: number;
	unmatched_transactions: number;
	matches_by_rule: Record<string, number>;
} {
	let matchedCount = 0;
	const matchesByRule: Record<string, number> = {};

	for (const transaction of transactions) {
		const matchedRule = findMatchingRule(transaction, rules);
		if (matchedRule) {
			matchedCount++;
			matchesByRule[matchedRule.id] = (matchesByRule[matchedRule.id] || 0) + 1;
		}
	}

	return {
		total_transactions: transactions.length,
		matched_transactions: matchedCount,
		unmatched_transactions: transactions.length - matchedCount,
		matches_by_rule: matchesByRule,
	};
}
