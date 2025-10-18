import { authenticateRequest } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase";
import { HistoricalDataService } from "@/services/historical-data-service";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Record balance snapshots for all user accounts
 * This is useful for initializing historical data for existing accounts
 */
export async function POST(request: NextRequest) {
	try {
		// Authenticate the user
		const authResult = await authenticateRequest(request);
		if (!authResult.authenticated || !authResult.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = authResult.user.id;

		// Fetch all user accounts
		const { data: accounts, error } = await supabaseAdmin
			.from("financial_accounts")
			.select("*")
			.eq("user_id", userId);

		if (error) {
			console.error("Error fetching accounts:", error);
			return NextResponse.json(
				{ error: "Failed to fetch accounts" },
				{ status: 500 },
			);
		}

		if (!accounts || accounts.length === 0) {
			return NextResponse.json({
				message: "No accounts found",
				snapshotsRecorded: 0,
			});
		}

		// Record balance snapshots for all accounts
		// Map database nulls to undefined for TypeScript types
		const accountsForSnapshot = accounts.map((account) => ({
			...account,
			truelayer_account_id: account.truelayer_account_id ?? undefined,
			truelayer_connection_id: account.truelayer_connection_id ?? undefined,
			currency: account.currency ?? undefined,
			last_synced: account.last_synced ?? undefined,
			connection_status: account.connection_status as
				| "active"
				| "expired"
				| "failed"
				| undefined,
			encrypted_access_token: account.encrypted_access_token ?? undefined,
			created_at: account.created_at ?? undefined,
			updated_at: account.updated_at ?? undefined,
			account_type: account.account_type as
				| "checking"
				| "savings"
				| "investment"
				| "credit",
		}));
		const snapshots =
			await HistoricalDataService.recordBalanceSnapshotBatch(
				accountsForSnapshot,
			);

		return NextResponse.json({
			message: "Balance snapshots recorded successfully",
			snapshotsRecorded: snapshots.length,
			accounts: snapshots.map((s) => ({
				accountId: s.account_id,
				balance: s.balance,
				currency: s.currency,
				recordedAt: s.recorded_at,
			})),
		});
	} catch (error) {
		console.error("Error recording balance snapshots:", error);
		return NextResponse.json(
			{ error: "Failed to record balance snapshots" },
			{ status: 500 },
		);
	}
}
