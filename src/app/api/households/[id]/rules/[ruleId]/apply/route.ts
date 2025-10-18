// Bulk Rule Application API Route
// Story 4.1: Expense Splitting Rules Engine
// Route: POST /api/households/[id]/rules/[ruleId]/apply

import { authenticateRequest } from "@/lib/auth-middleware";
import { BulkApplyRuleSchema } from "@/lib/splitting-rule-validation";
import { createClient } from "@/lib/supabase-server";
import { ruleMatches } from "@/services/rule-matching-service";
import type { SplittingRule } from "@/types/splitting-rule";
import type { Transaction } from "@/types/transaction";
import { type NextRequest, NextResponse } from "next/server";

/**
 * POST /api/households/[id]/rules/[ruleId]/apply
 * Apply a splitting rule to historical transactions
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string; ruleId: string } },
) {
	try {
		// Authenticate user
		const authResult = await authenticateRequest(request);
		if (!authResult.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const householdId = params.id;
		const ruleId = params.ruleId;
		const body = await request.json();

		// Validate request body
		const validation = BulkApplyRuleSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: validation.error.errors,
				},
				{ status: 400 },
			);
		}

		const { start_date, end_date } = validation.data;
		const supabase = await createClient();

		// Verify user is a household member
		const { data: membership } = await supabase
			.from("household_members")
			.select("id, user_id")
			.eq("household_id", householdId)
			.eq("user_id", authResult.user.id)
			.single();

		if (!membership) {
			return NextResponse.json(
				{ error: "Not a member of this household" },
				{ status: 403 },
			);
		}

		// Fetch the rule
		const { data: rule, error: ruleError } = await supabase
			.from("expense_splitting_rules")
			.select("*")
			.eq("id", ruleId)
			.eq("household_id", householdId)
			.single();

		if (ruleError || !rule) {
			return NextResponse.json({ error: "Rule not found" }, { status: 404 });
		}

		if (!rule.is_active) {
			return NextResponse.json(
				{ error: "Cannot apply an inactive rule" },
				{ status: 400 },
			);
		}

		// Get all household members' accounts
		const { data: householdMembers } = await supabase
			.from("household_members")
			.select("user_id")
			.eq("household_id", householdId);

		const userIds = householdMembers?.map((m) => m.user_id) || [];

		if (userIds.length === 0) {
			return NextResponse.json(
				{ error: "No household members found" },
				{ status: 400 },
			);
		}

		// Fetch household members' accounts
		const { data: accounts } = await supabase
			.from("financial_accounts")
			.select("id")
			.in("user_id", userIds);

		const accountIds = accounts?.map((a) => a.id) || [];

		if (accountIds.length === 0) {
			return NextResponse.json(
				{ error: "No accounts found for household members" },
				{ status: 400 },
			);
		}

		// Build query for eligible transactions
		let transactionsQuery = supabase
			.from("transactions")
			.select("*")
			.in("account_id", accountIds)
			.is("splitting_rule_id", null); // Only transactions without a rule applied

		// Apply date range filters if provided
		if (start_date) {
			transactionsQuery = transactionsQuery.gte("date", start_date);
		}
		if (end_date) {
			transactionsQuery = transactionsQuery.lte("date", end_date);
		}

		// Fetch transactions
		const { data: transactions, error: txError } = await transactionsQuery;

		if (txError) {
			console.error("Error fetching transactions:", txError);
			return NextResponse.json(
				{ error: "Failed to fetch transactions" },
				{ status: 500 },
			);
		}

		if (!transactions || transactions.length === 0) {
			return NextResponse.json({
				rule_id: ruleId,
				affected_transaction_count: 0,
				total_amount_affected: 0,
				errors: [],
			});
		}

		// Filter transactions that match the rule
		const matchingTransactions = transactions.filter((tx) =>
			ruleMatches(rule as SplittingRule, tx as Transaction),
		);

		// Apply rule to matching transactions
		let affectedCount = 0;
		let totalAmount = 0;
		const errors: string[] = [];

		for (const tx of matchingTransactions) {
			try {
				const { error: updateError } = await supabase
					.from("transactions")
					.update({
						splitting_rule_id: ruleId,
						is_shared_expense: true,
						shared_with_household_id: householdId,
						shared_by: authResult.user.id,
						shared_at: new Date().toISOString(),
					})
					.eq("id", tx.id);

				if (updateError) {
					errors.push(
						`Failed to update transaction ${tx.id}: ${updateError.message}`,
					);
				} else {
					affectedCount++;
					totalAmount += Math.abs(tx.amount);
				}
			} catch (error) {
				errors.push(`Error updating transaction ${tx.id}: ${error}`);
			}
		}

		// Return result
		return NextResponse.json({
			rule_id: ruleId,
			affected_transaction_count: affectedCount,
			total_amount_affected: totalAmount,
			errors,
		});
	} catch (error) {
		console.error(
			"Error in POST /api/households/[id]/rules/[ruleId]/apply:",
			error,
		);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
