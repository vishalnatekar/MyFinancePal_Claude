import {
	checkRateLimit,
	createAuthErrorResponse,
	withAuth,
} from "@/lib/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

interface RouteParams {
	params: {
		id: string;
	};
}

export const GET = withAuth(
	async (request: NextRequest, user: User, context?: RouteParams) => {
		try {
			// Rate limiting check
			if (!checkRateLimit(user.id, 50, 60000)) {
				// 50 requests per minute
				return createAuthErrorResponse("Too many requests", 429);
			}

			if (!context?.params?.id) {
				return NextResponse.json(
					{ error: "Account ID is required" },
					{ status: 400 },
				);
			}

			const accountId = context.params.id;

			const { data: account, error } = await supabaseAdmin
				.from("financial_accounts")
				.select("*")
				.eq("id", accountId)
				.eq("user_id", user.id)
				.single();

			if (error || !account) {
				return NextResponse.json(
					{ error: "Account not found or access denied" },
					{ status: 404 },
				);
			}

			// Get sync history for this account
			const { data: syncHistory } = await supabaseAdmin
				.from("account_sync_history")
				.select("*")
				.eq("account_id", account.id)
				.order("synced_at", { ascending: false })
				.limit(10);

			return NextResponse.json({
				account,
				syncHistory: syncHistory || [],
			});
		} catch (error) {
			console.error("Error fetching account:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);

export const DELETE = withAuth(
	async (request: NextRequest, user: User, context?: RouteParams) => {
		try {
			// Rate limiting check for deletion (stricter)
			if (!checkRateLimit(`delete_account_${user.id}`, 10, 300000)) {
				// 10 deletions per 5 minutes
				return createAuthErrorResponse("Too many deletion attempts", 429);
			}

			if (!context?.params?.id) {
				return NextResponse.json(
					{ error: "Account ID is required" },
					{ status: 400 },
				);
			}

			const accountId = context.params.id;

			// First, fetch the account to verify ownership and get connection info
			const { data: account, error: fetchError } = await supabaseAdmin
				.from("financial_accounts")
				.select("*")
				.eq("id", accountId)
				.eq("user_id", user.id)
				.single();

			if (fetchError || !account) {
				return NextResponse.json(
					{ error: "Account not found or access denied" },
					{ status: 404 },
				);
			}

			// If it's a connected account (not manual), we're using TrueLayer
			// TrueLayer connections are managed via access tokens which we'll delete with the account
			// No need to call TrueLayer API to disconnect
			if (!account.is_manual) {
				console.log(`Deleting TrueLayer-connected account: ${account.id}`);
			}

			// Delete related data (cascade should handle this, but let's be explicit)
			// Delete balance history
			const { error: balanceHistoryError } = await supabaseAdmin
				.from("account_balance_history")
				.delete()
				.eq("account_id", account.id);

			if (balanceHistoryError) {
				console.error("Error deleting balance history:", balanceHistoryError);
			}

			// Delete sync history
			const { error: syncHistoryError } = await supabaseAdmin
				.from("account_sync_history")
				.delete()
				.eq("account_id", account.id);

			if (syncHistoryError) {
				console.error("Error deleting sync history:", syncHistoryError);
			}

			// Delete transactions
			const { error: transactionsError } = await supabaseAdmin
				.from("transactions")
				.delete()
				.eq("account_id", account.id);

			if (transactionsError) {
				console.error("Error deleting transactions:", transactionsError);
			}

			// Delete the account from our database
			const { error: deleteError } = await supabaseAdmin
				.from("financial_accounts")
				.delete()
				.eq("id", accountId)
				.eq("user_id", user.id);

			if (deleteError) {
				console.error("Error deleting account:", deleteError);
				console.error("Delete error details:", {
					message: deleteError.message,
					details: deleteError.details,
					hint: deleteError.hint,
					code: deleteError.code,
				});
				return NextResponse.json(
					{
						error: "Failed to delete account",
						details: deleteError.message,
					},
					{ status: 500 },
				);
			}

			return NextResponse.json({
				message: "Account deleted successfully",
				deletedAccountId: accountId,
			});
		} catch (error) {
			console.error("Error in DELETE /api/accounts/[id]:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);
