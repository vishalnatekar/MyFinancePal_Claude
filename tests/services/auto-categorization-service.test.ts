/**
 * Tests for Auto-Categorization Service
 * Story 4.2: Automatic Transaction Categorization
 */

import {
	calculateConfidenceScore,
	getConfidenceLevel,
	validateSplitTransaction,
} from "@/services/auto-categorization-service";
import type { Transaction } from "@/types/transaction";
import type { SplittingRule } from "@/types/splitting-rule";

describe("Auto-Categorization Service", () => {
	describe("calculateConfidenceScore", () => {
		const mockTransaction: Transaction = {
			id: "txn-1",
			account_id: "acc-1",
			amount: -50.0,
			merchant_name: "Tesco Superstore",
			category: "groceries",
			date: "2025-10-20",
			is_shared_expense: false,
			manual_override: false,
			created_at: "2025-10-20T10:00:00Z",
		};

		it("should return 100 for exact merchant match", () => {
			const rule: SplittingRule = {
				id: "rule-1",
				household_id: "hh-1",
				rule_name: "Tesco Groceries",
				rule_type: "merchant",
				priority: 1,
				merchant_pattern: "Tesco Superstore", // Exact match
				split_percentage: { user1: 50, user2: 50 },
				is_active: true,
				created_by: "user-1",
				created_at: "2025-10-01T00:00:00Z",
				apply_to_existing_transactions: false,
			};

			const score = calculateConfidenceScore(mockTransaction, rule);
			expect(score).toBe(100);
		});

		it("should return 85 for pattern merchant match", () => {
			const rule: SplittingRule = {
				id: "rule-1",
				household_id: "hh-1",
				rule_name: "Tesco Groceries",
				rule_type: "merchant",
				priority: 1,
				merchant_pattern: "Tesco.*", // Pattern match
				split_percentage: { user1: 50, user2: 50 },
				is_active: true,
				created_by: "user-1",
				created_at: "2025-10-01T00:00:00Z",
				apply_to_existing_transactions: false,
			};

			const score = calculateConfidenceScore(mockTransaction, rule);
			expect(score).toBe(85);
		});

		it("should return 95 for category match", () => {
			const rule: SplittingRule = {
				id: "rule-1",
				household_id: "hh-1",
				rule_name: "All Groceries",
				rule_type: "category",
				priority: 1,
				category_match: "groceries",
				split_percentage: { user1: 50, user2: 50 },
				is_active: true,
				created_by: "user-1",
				created_at: "2025-10-01T00:00:00Z",
				apply_to_existing_transactions: false,
			};

			const score = calculateConfidenceScore(mockTransaction, rule);
			expect(score).toBe(95);
		});

		it("should return 80 for amount threshold match", () => {
			const rule: SplittingRule = {
				id: "rule-1",
				household_id: "hh-1",
				rule_name: "Large Purchases",
				rule_type: "amount_threshold",
				priority: 1,
				min_amount: 40.0,
				max_amount: 100.0,
				split_percentage: { user1: 50, user2: 50 },
				is_active: true,
				created_by: "user-1",
				created_at: "2025-10-01T00:00:00Z",
				apply_to_existing_transactions: false,
			};

			const score = calculateConfidenceScore(mockTransaction, rule);
			expect(score).toBe(80);
		});

		it("should return 60 for default rule", () => {
			const rule: SplittingRule = {
				id: "rule-1",
				household_id: "hh-1",
				rule_name: "Default Split",
				rule_type: "default",
				priority: 999,
				split_percentage: { user1: 50, user2: 50 },
				is_active: true,
				created_by: "user-1",
				created_at: "2025-10-01T00:00:00Z",
				apply_to_existing_transactions: false,
			};

			const score = calculateConfidenceScore(mockTransaction, rule);
			expect(score).toBe(60);
		});
	});

	describe("getConfidenceLevel", () => {
		it("should return 'high' for score >= 95", () => {
			expect(getConfidenceLevel(100)).toBe("high");
			expect(getConfidenceLevel(95)).toBe("high");
		});

		it("should return 'medium' for score 70-94", () => {
			expect(getConfidenceLevel(94)).toBe("medium");
			expect(getConfidenceLevel(70)).toBe("medium");
		});

		it("should return 'low' for score 50-69", () => {
			expect(getConfidenceLevel(69)).toBe("low");
			expect(getConfidenceLevel(50)).toBe("low");
		});

		it("should return 'none' for score < 50 or null", () => {
			expect(getConfidenceLevel(49)).toBe("none");
			expect(getConfidenceLevel(null)).toBe("none");
			expect(getConfidenceLevel(undefined)).toBe("none");
		});
	});

	describe("validateSplitTransaction", () => {
		const mockTransaction: Transaction = {
			id: "txn-1",
			account_id: "acc-1",
			amount: -100.0,
			merchant_name: "Mixed Store",
			category: "shopping",
			date: "2025-10-20",
			is_shared_expense: false,
			manual_override: false,
			created_at: "2025-10-20T10:00:00Z",
		};

		it("should validate correct split", () => {
			const splitDetails = {
				personal_amount: 40.0,
				shared_amount: 60.0,
				split_percentage: { user1: 50, user2: 50 },
			};

			const result = validateSplitTransaction(mockTransaction, splitDetails);
			expect(result.isValid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it("should reject split where amounts don't sum to total", () => {
			const splitDetails = {
				personal_amount: 40.0,
				shared_amount: 50.0, // Only 90 total
				split_percentage: { user1: 50, user2: 50 },
			};

			const result = validateSplitTransaction(mockTransaction, splitDetails);
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("must equal transaction total");
		});

		it("should reject split where percentages don't sum to 100", () => {
			const splitDetails = {
				personal_amount: 40.0,
				shared_amount: 60.0,
				split_percentage: { user1: 40, user2: 40 }, // Only 80%
			};

			const result = validateSplitTransaction(mockTransaction, splitDetails);
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("must sum to 100%");
		});

		it("should reject negative split amounts", () => {
			const splitDetails = {
				personal_amount: -10.0,
				shared_amount: 110.0,
				split_percentage: { user1: 50, user2: 50 },
			};

			const result = validateSplitTransaction(mockTransaction, splitDetails);
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("must be non-negative");
		});

		it("should allow small rounding differences (1 cent)", () => {
			const splitDetails = {
				personal_amount: 40.0,
				shared_amount: 60.005, // Rounding difference
				split_percentage: { user1: 50, user2: 50 },
			};

			const result = validateSplitTransaction(mockTransaction, splitDetails);
			expect(result.isValid).toBe(true);
		});
	});
});
