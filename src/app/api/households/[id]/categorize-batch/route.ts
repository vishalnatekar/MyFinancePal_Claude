// POST /api/households/[id]/categorize-batch
// Story 4.2: Batch categorize transactions

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import type { BatchCategorizationRequest } from "@/types/transaction";
import {
	applyRulesToTransactions,
	recordRuleFeedback,
} from "@/services/auto-categorization-service";

export async function POST(
	request: Request,
	{ params }: { params: { id: string } },
) {
	try {
		const supabase = createClient();

		// Authenticate user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const householdId = params.id;

		// Verify user is a household member
		const { data: membership } = await supabase
			.from("user_households")
			.select("id")
			.eq("user_id", user.id)
			.eq("household_id", householdId)
			.single();

		if (!membership) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Parse request body
		const body: BatchCategorizationRequest = await request.json();
		const { transaction_ids, action, rule_id } = body;

		if (!transaction_ids || transaction_ids.length === 0) {
			return NextResponse.json(
				{ error: "transaction_ids is required" },
				{ status: 400 },
			);
		}

		if (action === "apply_rule" && !rule_id) {
			return NextResponse.json(
				{ error: "rule_id is required when action is apply_rule" },
				{ status: 400 },
			);
		}

		// Get transactions
		const { data: transactions, error: fetchError } = await supabase
			.from("transactions")
			.select(
				`
				*,
				financial_accounts!inner(
					household_id
				)
			`,
			)
			.in("id", transaction_ids)
			.eq("financial_accounts.household_id", householdId);

		if (fetchError) {
			console.error("Failed to fetch transactions:", fetchError);
			return NextResponse.json(
				{ error: "Failed to fetch transactions" },
				{ status: 500 },
			);
		}

		if (action === "mark_personal") {
			// Mark all as personal (not shared)
			const { error: updateError } = await supabase
				.from("transactions")
				.update({
					is_shared_expense: false,
					manual_override: true,
					confidence_score: 100,
					shared_with_household_id: null,
					splitting_rule_id: null,
				})
				.in("id", transaction_ids);

			if (updateError) {
				console.error("Failed to update transactions:", updateError);
				return NextResponse.json(
					{ error: "Failed to update transactions" },
					{ status: 500 },
				);
			}

			// Record feedback for all
			for (const txn of transactions) {
				try {
					await recordRuleFeedback(
						txn.id,
						txn.splitting_rule_id,
						householdId,
						"overridden",
						txn.confidence_score,
						{ marked_as_personal: true },
					);
				} catch (feedbackError) {
					console.error("Failed to record feedback:", feedbackError);
				}
			}

			return NextResponse.json({
				success: true,
				success_count: transaction_ids.length,
				failed_count: 0,
			});
		}

		if (action === "apply_rule") {
			// Get the specific rule
			const { data: rule, error: ruleError } = await supabase
				.from("expense_splitting_rules")
				.select("*")
				.eq("id", rule_id)
				.eq("household_id", householdId)
				.eq("is_active", true)
				.single();

			if (ruleError || !rule) {
				return NextResponse.json({ error: "Rule not found" }, { status: 404 });
			}

			// Apply rule to all transactions
			const result = await applyRulesToTransactions(
				transactions,
				[rule],
				householdId,
			);

			// Record feedback for accepted rules
			for (const res of result.results) {
				if (res.rule_applied) {
					try {
						await recordRuleFeedback(
							res.transaction_id,
							res.rule_id || null,
							householdId,
							"accepted",
							res.confidence_score,
						);
					} catch (feedbackError) {
						console.error("Failed to record feedback:", feedbackError);
					}
				}
			}

			return NextResponse.json({
				success: true,
				success_count: result.categorized,
				failed_count: result.uncategorized,
				details: result,
			});
		}

		return NextResponse.json({ error: "Invalid action" }, { status: 400 });
	} catch (error) {
		console.error("Batch categorization error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
