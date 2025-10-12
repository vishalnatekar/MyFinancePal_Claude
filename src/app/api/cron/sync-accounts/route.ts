import { supabaseAdmin } from "@/lib/supabase";
import { AccountSyncService } from "@/services/account-sync-service";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Account Sync Cron Job
 *
 * This endpoint is designed to be called by Vercel Cron Jobs (or similar schedulers)
 * to automatically sync all connected bank accounts every 6 hours (AC 9).
 *
 * SECURITY: Protected by CRON_SECRET environment variable
 *
 * Vercel cron configuration in vercel.json should have:
 * crons array with path /api/cron/sync-accounts and schedule 0 star-slash-6 star star star
 */
export async function GET(request: NextRequest) {
	try {
		// Verify cron secret for security
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET;

		if (!cronSecret) {
			console.error("CRON_SECRET environment variable not configured");
			return NextResponse.json(
				{ error: "Cron job not configured" },
				{ status: 500 },
			);
		}

		if (authHeader !== `Bearer ${cronSecret}`) {
			console.warn("Unauthorized cron job attempt");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		console.log("Starting scheduled account sync...");

		// Fetch all active connections
		const { data: accounts, error: fetchError } = await supabaseAdmin
			.from("financial_accounts")
			.select("id, user_id, truelayer_connection_id, encrypted_access_token")
			.eq("connection_status", "active")
			.not("truelayer_connection_id", "is", null);

		if (fetchError) {
			console.error("Failed to fetch accounts for sync:", fetchError);
			return NextResponse.json(
				{ error: "Failed to fetch accounts", message: fetchError.message },
				{ status: 500 },
			);
		}

		if (!accounts || accounts.length === 0) {
			console.log("No active accounts to sync");
			return NextResponse.json({
				success: true,
				message: "No accounts to sync",
				synced: 0,
			});
		}

		console.log(`Found ${accounts.length} accounts to sync`);

		// Group accounts by user to sync per user
		const accountsByUser = accounts.reduce(
			(acc, account) => {
				if (!acc[account.user_id]) {
					acc[account.user_id] = [];
				}
				acc[account.user_id].push(account);
				return acc;
			},
			{} as Record<string, typeof accounts>,
		);

		let successCount = 0;
		let failCount = 0;

		// Sync accounts for each user
		for (const [userId, userAccounts] of Object.entries(accountsByUser)) {
			try {
				const syncService = new AccountSyncService(userId);

				// Sync all accounts for this user
				for (const account of userAccounts) {
					try {
						await syncService.syncSingleAccount(account.id);
						successCount++;
						console.log(`✅ Synced account ${account.id} for user ${userId}`);
					} catch (error) {
						failCount++;
						console.error(`❌ Failed to sync account ${account.id}:`, error);
					}

					// Rate limiting: 1 second delay between accounts
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			} catch (error) {
				console.error(`Failed to sync accounts for user ${userId}:`, error);
				failCount += userAccounts.length;
			}
		}

		console.log(
			`Account sync completed: ${successCount} success, ${failCount} failed`,
		);

		return NextResponse.json({
			success: true,
			message: "Account sync completed",
			synced: successCount,
			failed: failCount,
			total: accounts.length,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Account sync cron job failed:", error);
		return NextResponse.json(
			{
				error: "Sync failed",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
