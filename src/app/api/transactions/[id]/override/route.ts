// POST /api/transactions/[id]/override
// Story 4.2: Override automatic transaction categorization

import { createClient } from "@/lib/supabase";
import { recordRuleFeedback } from "@/services/auto-categorization-service";
import type { TransactionOverrideRequest } from "@/types/transaction";
import { NextResponse } from "next/server";

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

		const transactionId = params.id;

		// Get the transaction
		const { data: transaction, error: fetchError } = await supabase
			.from("transactions")
			.select("*, financial_accounts(household_id)")
			.eq("id", transactionId)
			.single();

		if (fetchError || !transaction) {
			return NextResponse.json(
				{ error: "Transaction not found" },
				{ status: 404 },
			);
		}

		// Verify user has access (owner or household member)
		const accountData = transaction.financial_accounts as
			| { household_id?: string }
			| null
			| undefined;
		const householdId = accountData?.household_id;

		if (householdId) {
			const { data: membership } = await supabase
				.from("user_households")
				.select("id")
				.eq("user_id", user.id)
				.eq("household_id", householdId)
				.single();

			if (!membership) {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 });
			}
		} else {
			// Check if user owns the account
			const { data: account } = await supabase
				.from("financial_accounts")
				.select("user_id")
				.eq("id", transaction.account_id)
				.single();

			if (!account || account.user_id !== user.id) {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 });
			}
		}

		// Parse request body
		const body: TransactionOverrideRequest = await request.json();
		const { is_shared_expense, split_percentage, reason } = body;

		// Store old values for history
		const oldIsSharedExpense = transaction.is_shared_expense;
		const oldSplitPercentage = null; // Get from rule if exists
		const originalRuleId = transaction.splitting_rule_id;
		const originalConfidenceScore = transaction.confidence_score;

		// Create override history record
		const { error: overrideError } = await supabase
			.from("transaction_overrides")
			.insert({
				transaction_id: transactionId,
				original_rule_id: originalRuleId,
				override_by: user.id,
				old_is_shared_expense: oldIsSharedExpense,
				new_is_shared_expense: is_shared_expense,
				old_split_percentage: oldSplitPercentage,
				new_split_percentage: split_percentage || null,
				override_reason: reason || null,
			});

		if (overrideError) {
			console.error("Failed to create override history:", overrideError);
			return NextResponse.json(
				{ error: "Failed to record override" },
				{ status: 500 },
			);
		}

		// Update transaction
		const { data: updatedTransaction, error: updateError } = await supabase
			.from("transactions")
			.update({
				is_shared_expense,
				manual_override: true,
				confidence_score: 100, // Manual override = 100% confidence
				original_rule_id: originalRuleId,
				shared_with_household_id: is_shared_expense ? householdId : null,
			})
			.eq("id", transactionId)
			.select()
			.single();

		if (updateError) {
			console.error("Failed to update transaction:", updateError);
			return NextResponse.json(
				{ error: "Failed to update transaction" },
				{ status: 500 },
			);
		}

		// Record feedback for analytics
		if (householdId) {
			try {
				await recordRuleFeedback(
					transactionId,
					originalRuleId,
					householdId,
					"overridden",
					originalConfidenceScore || undefined,
					{
						new_is_shared_expense: is_shared_expense,
						new_split_percentage: split_percentage,
						reason,
					},
				);
			} catch (feedbackError) {
				// Don't fail the request if feedback recording fails
				console.error("Failed to record feedback:", feedbackError);
			}
		}

		return NextResponse.json({
			success: true,
			transaction: updatedTransaction,
		});
	} catch (error) {
		console.error("Override transaction error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
