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
		const snapshots = await HistoricalDataService.recordBalanceSnapshotBatch(
			accounts,
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
