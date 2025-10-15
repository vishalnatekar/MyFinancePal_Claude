import { config } from "@/lib/config";
import {
	createNotification,
	getHouseholdRecipients,
} from "@/services/notification-service";
import type { UpdateTransactionSharingRequest } from "@/types/transaction";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

// Zod schema for request validation
const updateSharingSchema = z.object({
	household_id: z.string().uuid().nullable(),
	is_shared: z.boolean(),
});

export async function PUT(
	request: Request,
	{ params }: { params: { id: string } },
) {
	try {
		const cookieStore = await cookies();
		const supabase = createServerClient(
			config.supabase.url,
			config.supabase.anonKey,
			{
				cookies: {
					getAll() {
						return cookieStore.getAll();
					},
					setAll(cookiesToSet) {
						try {
							for (const { name, value, options } of cookiesToSet) {
								cookieStore.set(name, value, options);
							}
						} catch {
							// Server component - ignore
						}
					},
				},
			},
		);
		const transactionId = params.id;

		// Authenticate user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Parse and validate request body
		const body: UpdateTransactionSharingRequest = await request.json();
		const validatedData = updateSharingSchema.parse(body);

		const { household_id, is_shared } = validatedData;

		// If sharing, household_id must be provided
		if (is_shared && !household_id) {
			return NextResponse.json(
				{ error: "household_id is required when sharing a transaction" },
				{ status: 400 },
			);
		}

		// First verify the user owns this transaction
		const { data: transaction, error: fetchError } = await supabase
			.from("transactions")
			.select("id, account_id, financial_accounts!inner(user_id)")
			.eq("id", transactionId)
			.single();

		if (fetchError || !transaction) {
			return NextResponse.json(
				{ error: "Transaction not found" },
				{ status: 404 },
			);
		}

		// @ts-ignore - financial_accounts is joined
		if (transaction.financial_accounts.user_id !== user.id) {
			return NextResponse.json(
				{ error: "You do not own this transaction" },
				{ status: 403 },
			);
		}

		// If sharing, verify user belongs to the household
		if (is_shared && household_id) {
			const { data: membership } = await supabase
				.from("household_members")
				.select("id")
				.eq("household_id", household_id)
				.eq("user_id", user.id)
				.single();

			if (!membership) {
				return NextResponse.json(
					{ error: "You are not a member of the specified household" },
					{ status: 403 },
				);
			}
		}

		// Update the transaction
		const { error: updateError } = await supabase
			.from("transactions")
			.update({
				is_shared_expense: is_shared,
				shared_with_household_id: is_shared ? household_id : null,
				shared_at: is_shared ? new Date().toISOString() : null,
				shared_by: is_shared ? user.id : null,
			})
			.eq("id", transactionId);

		if (updateError) {
			console.error("Error updating transaction:", updateError);
			return NextResponse.json(
				{ error: "Failed to update transaction sharing" },
				{ status: 500 },
			);
		}

		// Log to sharing history
		if (household_id) {
			await supabase.from("transaction_sharing_history").insert({
				transaction_id: transactionId,
				household_id,
				action: is_shared ? "shared" : "unshared",
				changed_by: user.id,
				changed_at: new Date().toISOString(),
			});
		}

		// Fetch updated transaction to get details for notification
		const { data: updatedTransaction, error: refetchError } = await supabase
			.from("transactions")
			.select("*, financial_accounts!inner(user_id), users!transactions_user_id_fkey(full_name)")
			.eq("id", transactionId)
			.single();

		if (refetchError) {
			console.error("Error fetching updated transaction:", refetchError);
			return NextResponse.json(
				{ error: "Failed to fetch updated transaction" },
				{ status: 500 },
			);
		}

		// Create notifications for household members (non-blocking)
		if (is_shared && household_id && updatedTransaction) {
			try {
				const recipients = await getHouseholdRecipients(household_id, user.id);
				const actorName = (updatedTransaction.users as { full_name: string } | null)?.full_name || "A member";

				if (recipients.length > 0) {
					await createNotification(
						"transaction_shared",
						household_id,
						recipients,
						user.id,
						{
							transaction_id: transactionId,
							amount: Math.abs(Number(updatedTransaction.amount)),
							merchant_name: updatedTransaction.merchant_name || "Unknown",
							member_name: actorName,
						}
					);
				}
			} catch (notifError) {
				// Log but don't fail the request if notification fails
				console.error("Error creating notification:", notifError);
			}
		}

		// Return the transaction (remove extra fields added for notification)
		const { data: finalTransaction, error: finalFetchError } = await supabase
			.from("transactions")
			.select("*")
			.eq("id", transactionId)
			.single();

		if (finalFetchError) {
			console.error("Error fetching final transaction:", finalFetchError);
			return NextResponse.json(
				{ error: "Failed to fetch updated transaction" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			transaction: finalTransaction,
		});
	} catch (error) {
		console.error("Error in PUT /api/transactions/[id]/sharing:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.errors },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
