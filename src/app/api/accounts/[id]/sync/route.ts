import { authenticateRequest } from "@/lib/auth-middleware";
import { AccountSyncService } from "@/services/account-sync-service";
import { SyncSchedulerService } from "@/services/sync-scheduler-service";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Manual Account Sync Endpoint
 * POST /api/accounts/[id]/sync
 *
 * Triggers an immediate sync for a specific account with rate limiting protection
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const authResult = await authenticateRequest(request);
		if (!authResult.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const accountId = params.id;

		// Check rate limits
		const rateLimitCheck = SyncSchedulerService.canSync(
			authResult.user.id,
			accountId,
		);

		if (!rateLimitCheck.allowed) {
			return NextResponse.json(
				{
					error: "Sync not allowed",
					reason: rateLimitCheck.reason,
					retryAfter: rateLimitCheck.retryAfter,
				},
				{ status: 429 },
			);
		}

		// Perform sync (static method)
		const result = await AccountSyncService.syncAccount(accountId);

		if (!result.success) {
			return NextResponse.json(
				{
					error: "Sync failed",
					message: result.error || "Unknown error",
				},
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "Account synced successfully",
			data: {
				accountId,
				syncedAt: new Date().toISOString(),
				balanceUpdated: result.balanceUpdated,
			},
		});
	} catch (error) {
		console.error("Manual sync failed:", error);

		return NextResponse.json(
			{
				error: "Sync failed",
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
			},
			{ status: 500 },
		);
	}
}
