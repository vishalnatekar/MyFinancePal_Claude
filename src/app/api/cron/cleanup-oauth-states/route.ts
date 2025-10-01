import { oauthStateManager } from "@/lib/oauth-state";
import { type NextRequest, NextResponse } from "next/server";

/**
 * OAuth State Cleanup Cron Job
 *
 * This endpoint is designed to be called by Vercel Cron Jobs (or similar schedulers)
 * to clean up expired OAuth state tokens from the database.
 *
 * SECURITY: Protected by CRON_SECRET environment variable
 *
 * Vercel cron configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-oauth-states",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
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

		// Execute cleanup
		console.log("Starting OAuth state cleanup...");
		await oauthStateManager.cleanup();
		console.log("OAuth state cleanup completed successfully");

		return NextResponse.json({
			success: true,
			message: "OAuth states cleaned up successfully",
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("OAuth state cleanup failed:", error);
		return NextResponse.json(
			{
				error: "Cleanup failed",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
