import { accountSyncService } from "@/services/account-sync-service";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// This endpoint can be called by cron jobs or background services
export async function POST(request: NextRequest) {
	try {
		// Simple authentication for cron jobs
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET || "dev-secret";

		if (authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		console.log("Starting scheduled account sync");

		const result = await accountSyncService.syncAllAccounts();

		console.log("Scheduled sync completed", {
			totalUsers: result.totalUsers,
			totalAccounts: result.results.reduce(
				(sum, r) => sum + r.totalAccounts,
				0,
			),
			successCount: result.results.reduce((sum, r) => sum + r.successCount, 0),
			failureCount: result.results.reduce((sum, r) => sum + r.failureCount, 0),
			duration: result.totalDuration,
		});

		return NextResponse.json({
			message: "Sync completed successfully",
			...result,
			summary: {
				totalAccounts: result.results.reduce(
					(sum, r) => sum + r.totalAccounts,
					0,
				),
				successCount: result.results.reduce(
					(sum, r) => sum + r.successCount,
					0,
				),
				failureCount: result.results.reduce(
					(sum, r) => sum + r.failureCount,
					0,
				),
			},
		});
	} catch (error) {
		console.error("Error in scheduled sync:", error);
		return NextResponse.json({ error: "Sync failed" }, { status: 500 });
	}
}

// Health check endpoint
export async function GET() {
	return NextResponse.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		service: "account-sync-service",
	});
}
