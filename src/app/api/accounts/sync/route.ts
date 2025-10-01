import {
	checkRateLimit,
	createAuthErrorResponse,
	withAuth,
} from "@/lib/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase";
import {
	MoneyHubServiceError,
	moneyHubService,
} from "@/services/moneyhub-service";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for sync request
const syncAccountSchema = z.object({
	accountId: z.string().uuid("Invalid account ID"),
});

export const POST = withAuth(async (request: NextRequest, user: User) => {
	try {
		// Rate limiting check (stricter for sync operations)
		if (!checkRateLimit(`sync_${user.id}`, 30, 300000)) {
			// 30 sync operations per 5 minutes
			return createAuthErrorResponse("Too many sync requests", 429);
		}

		const body = await request.json();

		// Validate input data
		const validatedData = syncAccountSchema.parse(body);

		// Fetch the account to sync
		const { data: account, error: fetchError } = await supabaseAdmin
			.from("financial_accounts")
			.select("*")
			.eq("id", validatedData.accountId)
			.eq("user_id", user.id)
			.single();

		if (fetchError || !account) {
			return NextResponse.json(
				{ error: "Account not found or access denied" },
				{ status: 404 },
			);
		}

		// Only sync connected accounts (not manual ones)
		if (account.is_manual) {
			return NextResponse.json(
				{ error: "Cannot sync manual accounts" },
				{ status: 400 },
			);
		}

		if (!account.moneyhub_connection_id) {
			return NextResponse.json(
				{ error: "Account not connected to MoneyHub" },
				{ status: 400 },
			);
		}

		// Check if sync is already in progress
		const { data: inProgressSync } = await supabaseAdmin
			.from("account_sync_history")
			.select("id")
			.eq("account_id", account.id)
			.eq("sync_status", "in_progress")
			.limit(1)
			.single();

		if (inProgressSync) {
			return NextResponse.json(
				{ error: "Sync already in progress for this account" },
				{ status: 409 },
			);
		}

		// Create sync history entry (in_progress)
		const { data: syncHistory, error: syncHistoryError } = await supabaseAdmin
			.from("account_sync_history")
			.insert({
				account_id: account.id,
				sync_status: "in_progress",
				synced_at: new Date().toISOString(),
			})
			.select()
			.single();

		if (syncHistoryError || !syncHistory) {
			console.error("Error creating sync history:", syncHistoryError);
			return NextResponse.json(
				{ error: "Failed to initiate sync" },
				{ status: 500 },
			);
		}

		try {
			// Fetch fresh account data from MoneyHub
			const moneyHubAccounts = await moneyHubService.getAccounts(
				account.moneyhub_connection_id,
			);

			const moneyHubAccount = moneyHubAccounts.find(
				(acc) => acc.id === account.moneyhub_account_id,
			);

			if (!moneyHubAccount) {
				// Account not found in MoneyHub - mark connection as failed
				await supabaseAdmin
					.from("financial_accounts")
					.update({
						connection_status: "failed",
						updated_at: new Date().toISOString(),
					})
					.eq("id", account.id);

				await supabaseAdmin
					.from("account_sync_history")
					.update({
						sync_status: "failed",
						error_message: "Account not found in MoneyHub",
					})
					.eq("id", syncHistory.id);

				return NextResponse.json(
					{ error: "Account no longer exists in MoneyHub" },
					{ status: 404 },
				);
			}

			// Update account with fresh data
			const { error: updateError } = await supabaseAdmin
				.from("financial_accounts")
				.update({
					current_balance: moneyHubAccount.balance.amount,
					account_name: moneyHubAccount.accountName,
					connection_status:
						moneyHubAccount.status === "active" ? "active" : "failed",
					last_synced: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.eq("id", account.id);

			if (updateError) {
				console.error("Error updating account:", updateError);
				await supabaseAdmin
					.from("account_sync_history")
					.update({
						sync_status: "failed",
						error_message: "Failed to update account data",
					})
					.eq("id", syncHistory.id);

				return NextResponse.json(
					{ error: "Failed to update account data" },
					{ status: 500 },
				);
			}

			// Mark sync as successful
			await supabaseAdmin
				.from("account_sync_history")
				.update({
					sync_status: "success",
				})
				.eq("id", syncHistory.id);

			return NextResponse.json({
				message: "Account synced successfully",
				account: {
					id: account.id,
					current_balance: moneyHubAccount.balance.amount,
					last_synced: new Date().toISOString(),
					connection_status:
						moneyHubAccount.status === "active" ? "active" : "failed",
				},
			});
		} catch (serviceError) {
			console.error("MoneyHub sync error:", serviceError);

			let errorMessage = "Failed to sync with MoneyHub";
			let connectionStatus = "failed";

			if (MoneyHubServiceError.isRateLimitError(serviceError)) {
				errorMessage = "Rate limit exceeded - try again later";
				connectionStatus = "active"; // Don't mark as failed for rate limits
			} else if (
				serviceError instanceof MoneyHubServiceError &&
				serviceError.statusCode === 401
			) {
				errorMessage = "Connection expired - please reconnect account";
				connectionStatus = "expired";
			}

			// Update sync history with error
			await supabaseAdmin
				.from("account_sync_history")
				.update({
					sync_status: "failed",
					error_message: errorMessage,
				})
				.eq("id", syncHistory.id);

			// Update account connection status if needed
			if (connectionStatus !== "active") {
				await supabaseAdmin
					.from("financial_accounts")
					.update({
						connection_status: connectionStatus,
						updated_at: new Date().toISOString(),
					})
					.eq("id", account.id);
			}

			return NextResponse.json(
				{ error: errorMessage },
				{
					status:
						serviceError instanceof MoneyHubServiceError
							? serviceError.statusCode
							: 500,
				},
			);
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid input data", details: error.errors },
				{ status: 400 },
			);
		}

		console.error("Error in POST /api/accounts/sync:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
});
