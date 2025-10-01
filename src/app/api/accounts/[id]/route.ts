import {
	checkRateLimit,
	createAuthErrorResponse,
	withAuth,
} from "@/lib/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase";
import { moneyHubService } from "@/services/moneyhub-service";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

interface RouteParams {
	params: {
		id: string;
	};
}

export const GET = withAuth(
	async (request: NextRequest, user: User, { params }: RouteParams) => {
		try {
			// Rate limiting check
			if (!checkRateLimit(user.id, 50, 60000)) {
				// 50 requests per minute
				return createAuthErrorResponse("Too many requests", 429);
			}

			const { data: account, error } = await supabaseAdmin
				.from("financial_accounts")
				.select("*")
				.eq("id", params.id)
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
	async (request: NextRequest, user: User, { params }: RouteParams) => {
		try {
			// Rate limiting check for deletion (stricter)
			if (!checkRateLimit(`delete_account_${user.id}`, 10, 300000)) {
				// 10 deletions per 5 minutes
				return createAuthErrorResponse("Too many deletion attempts", 429);
			}

			// First, fetch the account to verify ownership and get connection info
			const { data: account, error: fetchError } = await supabaseAdmin
				.from("financial_accounts")
				.select("*")
				.eq("id", params.id)
				.eq("user_id", user.id)
				.single();

			if (fetchError || !account) {
				return NextResponse.json(
					{ error: "Account not found or access denied" },
					{ status: 404 },
				);
			}

			// If it's a connected account (not manual), try to disconnect from MoneyHub
			if (!account.is_manual && account.moneyhub_connection_id) {
				try {
					await moneyHubService.deleteConnection(
						account.moneyhub_connection_id,
					);
				} catch (moneyHubError) {
					// Log the error but don't fail the deletion - the account might already be
					// disconnected on MoneyHub's side or the service might be temporarily unavailable
					console.warn("Failed to delete MoneyHub connection:", moneyHubError);
				}
			}

			// Delete sync history (cascade should handle this, but let's be explicit)
			await supabaseAdmin
				.from("account_sync_history")
				.delete()
				.eq("account_id", account.id);

			// Delete the account from our database
			const { error: deleteError } = await supabaseAdmin
				.from("financial_accounts")
				.delete()
				.eq("id", params.id)
				.eq("user_id", user.id);

			if (deleteError) {
				console.error("Error deleting account:", deleteError);
				return NextResponse.json(
					{ error: "Failed to delete account" },
					{ status: 500 },
				);
			}

			return NextResponse.json({
				message: "Account deleted successfully",
				deletedAccountId: params.id,
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
