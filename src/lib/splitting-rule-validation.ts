// Splitting Rule Validation Schemas
// Story 4.1: Expense Splitting Rules Engine

import { z } from "zod";

/**
 * Rule type enum
 */
export const RuleTypeSchema = z.enum([
	"merchant",
	"category",
	"amount_threshold",
	"default",
]);

/**
 * Split percentage validation
 * - Must be an object with user_id keys and percentage values
 * - Each percentage must be between 0 and 100
 * - Total must sum to exactly 100
 */
export const SplitPercentageSchema = z
	.record(z.string().uuid(), z.number().int().min(0).max(100))
	.refine(
		(split) => {
			const total = Object.values(split).reduce((sum, val) => sum + val, 0);
			return total === 100;
		},
		{
			message: "Split percentages must sum to exactly 100%",
		},
	)
	.refine((split) => Object.keys(split).length > 0, {
		message: "At least one household member must be included in the split",
	})
	.refine((split) => Object.values(split).some((val) => val > 0), {
		message:
			"At least one household member must have a percentage greater than 0",
	});

/**
 * Create Splitting Rule Request Schema
 */
export const CreateSplittingRuleSchema = z
	.object({
		rule_name: z.string().min(1).max(100),
		rule_type: RuleTypeSchema,
		priority: z.number().int().min(1).max(1000).optional().default(100),

		// Matching criteria
		merchant_pattern: z.string().min(1).optional(),
		category_match: z.string().min(1).optional(),
		min_amount: z.number().positive().optional(),
		max_amount: z.number().positive().optional(),

		// Splitting configuration
		split_percentage: SplitPercentageSchema,

		// Options
		apply_to_existing_transactions: z.boolean().optional().default(false),
	})
	// Validate merchant_pattern is required for merchant rules
	.refine(
		(data) => data.rule_type !== "merchant" || Boolean(data.merchant_pattern),
		{
			message: 'merchant_pattern is required when rule_type is "merchant"',
			path: ["merchant_pattern"],
		},
	)
	// Validate category_match is required for category rules
	.refine(
		(data) => data.rule_type !== "category" || Boolean(data.category_match),
		{
			message: 'category_match is required when rule_type is "category"',
			path: ["category_match"],
		},
	)
	// Validate min_amount is required for amount_threshold rules
	.refine(
		(data) => data.rule_type !== "amount_threshold" || Boolean(data.min_amount),
		{
			message: 'min_amount is required when rule_type is "amount_threshold"',
			path: ["min_amount"],
		},
	)
	// Validate merchant_pattern is a valid regex
	.refine(
		(data) => {
			if (!data.merchant_pattern) return true;
			try {
				new RegExp(data.merchant_pattern);
				return true;
			} catch {
				return false;
			}
		},
		{
			message: "merchant_pattern must be a valid regular expression",
			path: ["merchant_pattern"],
		},
	)
	// Validate max_amount > min_amount if both are provided
	.refine(
		(data) => {
			if (data.min_amount && data.max_amount) {
				return data.max_amount > data.min_amount;
			}
			return true;
		},
		{
			message: "max_amount must be greater than min_amount",
			path: ["max_amount"],
		},
	);

/**
 * Update Splitting Rule Request Schema
 */
export const UpdateSplittingRuleSchema = z
	.object({
		rule_name: z.string().min(1).max(100).optional(),
		priority: z.number().int().min(1).max(1000).optional(),
		split_percentage: SplitPercentageSchema.optional(),
		is_active: z.boolean().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	});

/**
 * Bulk Apply Rule Request Schema
 */
export const BulkApplyRuleSchema = z
	.object({
		start_date: z.string().datetime().optional(),
		end_date: z.string().datetime().optional(),
	})
	.refine(
		(data) => {
			if (data.start_date && data.end_date) {
				return new Date(data.end_date) > new Date(data.start_date);
			}
			return true;
		},
		{
			message: "end_date must be after start_date",
		},
	);

/**
 * Test Rule Request Schema
 */
export const TestRuleSchema = z.object({
	rule: z.object({
		rule_type: RuleTypeSchema,
		merchant_pattern: z.string().min(1).optional(),
		category_match: z.string().min(1).optional(),
		min_amount: z.number().positive().optional(),
		max_amount: z.number().positive().optional(),
	}),
});

/**
 * Create Rule From Template Request Schema
 */
export const CreateRuleFromTemplateSchema = z.object({
	template_id: z.string().min(1),
	customizations: z.object({
		rule_name: z.string().min(1).max(100).optional(),
		priority: z.number().int().min(1).max(1000).optional(),
		split_percentage: SplitPercentageSchema.optional(),
		merchant_pattern: z.string().min(1).optional(),
		category_match: z.string().min(1).optional(),
		min_amount: z.number().positive().optional(),
		max_amount: z.number().positive().optional(),
	}),
});

/**
 * Type exports for use in API routes
 */
export type CreateSplittingRuleRequest = z.infer<
	typeof CreateSplittingRuleSchema
>;
export type UpdateSplittingRuleRequest = z.infer<
	typeof UpdateSplittingRuleSchema
>;
export type BulkApplyRuleRequest = z.infer<typeof BulkApplyRuleSchema>;
export type TestRuleRequest = z.infer<typeof TestRuleSchema>;
export type CreateRuleFromTemplateRequest = z.infer<
	typeof CreateRuleFromTemplateSchema
>;
