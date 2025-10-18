import { config } from "@/lib/config";
import {
	createNotification,
	getHouseholdRecipients,
} from "@/services/notification-service";
import type {
	BulkTransactionSharingRequest,
	BulkTransactionSharingResponse,
} from "@/types/transaction";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

// Zod schema for request validation
const bulkSharingSchema = z.object({
	transaction_ids: z.array(z.string().uuid()).min(1),
	household_id: z.string().uuid().nullable(),
	is_shared: z.boolean(),
});

export async function POST(request: Request) {
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

		// Authenticate user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Parse and validate request body
		const body: BulkTransactionSharingRequest = await request.json();
		const validatedData = bulkSharingSchema.parse(body);

		const { transaction_ids, household_id, is_shared } = validatedData;

		// If sharing, household_id must be provided
		if (is_shared && !household_id) {
			return NextResponse.json(
				{ error: "household_id is required when sharing transactions" },
				{ status: 400 },
			);
		}

		// Process each transaction individually
		const results = await Promise.all(
			transaction_ids.map(async (transaction_id) => {
				try {
					// First verify the user owns this transaction
					const { data: transaction, error: fetchError } = await supabase
						.from("transactions")
						.select("account_id, financial_accounts!inner(user_id)")
						.eq("id", transaction_id)
						.single();

					if (fetchError || !transaction) {
						return {
							transaction_id,
							success: false,
							error_message: "Transaction not found",
						};
					}

					// @ts-ignore - financial_accounts is joined
					if (transaction.financial_accounts.user_id !== user.id) {
						return {
							transaction_id,
							success: false,
							error_message: "You do not own this transaction",
						};
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
							return {
								transaction_id,
								success: false,
								error_message: "You are not a member of this household",
							};
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
						.eq("id", transaction_id);

					if (updateError) {
						return {
							transaction_id,
							success: false,
							error_message: updateError.message,
						};
					}

					// Log to sharing history
					if (household_id) {
						await supabase.from("transaction_sharing_history").insert({
							transaction_id,
							household_id,
							action: is_shared ? "shared" : "unshared",
							changed_by: user.id,
							changed_at: new Date().toISOString(),
						});
					}

					return {
						transaction_id,
						success: true,
						error_message: null,
					};
				} catch (err) {
					return {
						transaction_id,
						success: false,
						error_message: err instanceof Error ? err.message : "Unknown error",
					};
				}
			}),
		);

		const successCount = results.filter((r) => r.success).length;
		const failedCount = results.filter((r) => !r.success).length;
		const errors = results
			.filter((r) => !r.success)
			.map((r) => ({
				transaction_id: r.transaction_id,
				error: r.error_message || "Unknown error",
			}));

		// Create batched notification for successful bulk shares (non-blocking)
		if (is_shared && household_id && successCount > 0) {
			try {
				const successfulIds = results
					.filter((r) => r.success)
					.map((r) => r.transaction_id);

				// Get transaction details for notification
				const { data: transactions } = await supabase
					.from("transactions")
					.select("id, amount, merchant_name")
					.in("id", successfulIds);

				if (transactions && transactions.length > 0) {
					const totalAmount = transactions.reduce(
						(sum, tx) => sum + Math.abs(Number(tx.amount)),
						0,
					);

					// Get user's name
					const { data: userProfile } = await supabase
						.from("profiles")
						.select("full_name")
						.eq("id", user.id)
						.single();

					const actorName = userProfile?.full_name || "A member";
					const recipients = await getHouseholdRecipients(
						household_id,
						user.id,
					);

					if (recipients.length > 0) {
						// For single transaction, include individual details
						const metadata =
							successCount === 1
								? {
										transaction_id: transactions[0].id,
										amount: Math.abs(Number(transactions[0].amount)),
										merchant_name: transactions[0].merchant_name || undefined,
										member_name: actorName,
									}
								: {
										transaction_ids: successfulIds,
										count: successCount,
										total_amount: totalAmount,
										member_name: actorName,
									};

						await createNotification(
							"transaction_shared",
							household_id,
							recipients,
							user.id,
							metadata,
						);
					}
				}
			} catch (notifError) {
				// Log but don't fail the request if notification fails
				console.error("Error creating bulk notification:", notifError);
			}
		}

		const response: BulkTransactionSharingResponse = {
			success_count: successCount,
			failed_count: failedCount,
			errors,
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Error in POST /api/transactions/bulk-sharing:", error);

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
