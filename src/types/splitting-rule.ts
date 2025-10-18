// Splitting Rule Types for Story 4.1: Expense Splitting Rules Engine

import type { Transaction } from "./transaction";

/**
 * Rule type enum defining different matching strategies
 */
export type RuleType = "merchant" | "category" | "amount_threshold" | "default";

/**
 * Splitting Rule interface
 * Defines automated rules for splitting shared expenses within a household
 */
export interface SplittingRule {
	id: string;
	household_id: string;
	rule_name: string;
	rule_type: RuleType;
	priority: number; // 1 = highest priority

	// Matching criteria (only one should be set based on rule_type)
	merchant_pattern?: string; // Regex pattern for merchant rules
	category_match?: string; // Category name for category rules
	min_amount?: number; // Minimum amount for threshold rules
	max_amount?: number; // Maximum amount for threshold rules

	// Splitting configuration
	split_percentage: Record<string, number>; // { "user_id": percentage }

	// Metadata
	is_active: boolean;
	created_by: string;
	created_at: string;
	updated_at?: string;
	apply_to_existing_transactions: boolean;
}

/**
 * Rule template for common household scenarios
 */
export interface RuleTemplate {
	id: string;
	name: string;
	description: string;
	rule_type: RuleType;
	default_config: Partial<SplittingRule>;
	example_transactions: string[]; // Example merchant names or categories
}

/**
 * Result of testing a rule against transactions
 */
export interface RuleTestResult {
	rule: Partial<SplittingRule>;
	matching_transactions: Transaction[];
	match_count: number;
	total_amount: number;
	date_range: {
		start: string;
		end: string;
	};
}

/**
 * Result of bulk rule application to historical transactions
 */
export interface BulkApplicationResult {
	rule_id: string;
	affected_transaction_count: number;
	total_amount_affected: number;
	errors: string[];
}

/**
 * Request payload for creating a new splitting rule
 */
export interface CreateSplittingRuleRequest {
	rule_name: string;
	rule_type: RuleType;
	priority?: number; // Optional, defaults to 100
	merchant_pattern?: string;
	category_match?: string;
	min_amount?: number;
	max_amount?: number;
	split_percentage: Record<string, number>;
	apply_to_existing_transactions?: boolean;
}

/**
 * Request payload for updating an existing splitting rule
 */
export interface UpdateSplittingRuleRequest {
	rule_name?: string;
	priority?: number;
	split_percentage?: Record<string, number>;
	is_active?: boolean;
}

/**
 * Request payload for bulk applying a rule
 */
export interface BulkApplyRuleRequest {
	start_date?: string;
	end_date?: string;
}

/**
 * Request payload for testing a rule
 */
export interface TestRuleRequest {
	rule: Partial<SplittingRule>;
}

/**
 * Request payload for creating a rule from a template
 */
export interface CreateRuleFromTemplateRequest {
	template_id: string;
	customizations: Partial<SplittingRule>;
}

/**
 * Rule with creator details for display
 */
export interface SplittingRuleWithCreator extends SplittingRule {
	creator_name?: string;
	creator_avatar?: string;
}
