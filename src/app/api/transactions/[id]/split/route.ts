// POST /api/transactions/[id]/split
// Story 4.2: Split transaction into shared and personal portions

import { createClient } from "@/lib/supabase";
import { validateSplitTransaction } from "@/services/auto-categorization-service";
import type { TransactionSplitRequest } from "@/types/transaction";
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
		const body: TransactionSplitRequest = await request.json();
		const { personal_amount, shared_amount, split_percentage } = body;

		// Create split details object
		const splitDetails = {
			personal_amount,
			shared_amount,
			split_percentage,
		};

		// Validate split transaction
		const validation = validateSplitTransaction(transaction, splitDetails);
		if (!validation.isValid) {
			return NextResponse.json({ error: validation.error }, { status: 400 });
		}

		// Update transaction with split details
		const { data: updatedTransaction, error: updateError } = await supabase
			.from("transactions")
			.update({
				split_details: splitDetails,
				is_shared_expense: true, // Has shared component
				manual_override: true,
				confidence_score: 100, // Manual split = 100% confidence
				shared_with_household_id: householdId,
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

		return NextResponse.json({
			success: true,
			transaction: updatedTransaction,
		});
	} catch (error) {
		console.error("Split transaction error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
