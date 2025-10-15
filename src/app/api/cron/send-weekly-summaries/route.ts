/**
 * Weekly Summary Email Cron Job
 *
 * This endpoint is designed to be called by Vercel Cron Jobs
 * to automatically send weekly household summary emails every Sunday at 6 PM UTC.
 *
 * SECURITY: Protected by CRON_SECRET environment variable
 *
 * Vercel cron configuration in vercel.json should have:
 * {
 *   "path": "/api/cron/send-weekly-summaries",
 *   "schedule": "0 18 * * 0"
 * }
 */

import { sendWeeklySummaryEmail } from "@/lib/email-service";
import { supabaseAdmin } from "@/lib/supabase";
import { generateWeeklySummary } from "@/services/notification-service";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

		console.log("Starting weekly summary email cron job...");

		// Fetch all active households
		const { data: households, error: householdsError } = await supabaseAdmin
			.from("households")
			.select("id, name");

		if (householdsError) {
			console.error("Failed to fetch households:", householdsError);
			return NextResponse.json(
				{ error: "Failed to fetch households" },
				{ status: 500 },
			);
		}

		if (!households || households.length === 0) {
			console.log("No households found");
			return NextResponse.json({
				success: true,
				message: "No households to process",
				sent: 0,
			});
		}

		console.log(`Found ${households.length} households to process`);

		let successCount = 0;
		let failCount = 0;
		let skipCount = 0;

		// Process each household
		for (const household of households) {
			try {
				// Generate weekly summary
				const summary = await generateWeeklySummary(household.id);

				if (!summary) {
					console.warn(
						`Failed to generate summary for household ${household.id}`,
					);
					failCount++;
					continue;
				}

				// Skip if no activity this week
				if (summary.transaction_count === 0) {
					console.log(
						`No activity for household ${household.id} - skipping email`,
					);
					skipCount++;
					continue;
				}

				// Get household members with weekly digest enabled
				const { data: members, error: membersError } = await supabaseAdmin
					.from("household_members")
					.select(
						`
            user_id,
            profiles!household_members_user_id_fkey (
              id,
              email,
              full_name
            )
          `,
					)
					.eq("household_id", household.id);

				if (membersError || !members) {
					console.error(
						`Failed to fetch members for household ${household.id}:`,
						membersError,
					);
					failCount++;
					continue;
				}

				// Send email to each member with weekly digest enabled
				for (const member of members) {
					const user = member.profiles as {
						id: string;
						email: string;
						full_name: string;
					} | null;

					if (!user || !user.email) {
						continue;
					}

					// Check if user has weekly digest enabled
					const { data: prefs, error: prefsError } = await supabaseAdmin
						.from("notification_preferences")
						.select("weekly_digest_enabled")
						.eq("user_id", user.id)
						.eq("household_id", household.id)
						.single();

					// If no preferences exist, use default (enabled)
					const weeklyDigestEnabled =
						!prefsError && prefs ? prefs.weekly_digest_enabled : true;

					if (!weeklyDigestEnabled) {
						console.log(
							`Skipping ${user.email} - weekly digest disabled`,
						);
						continue;
					}

					// Format dates for email
					const startDate = new Date(summary.start_date).toLocaleDateString(
						"en-US",
						{
							month: "short",
							day: "numeric",
							year: "numeric",
						},
					);
					const endDate = new Date(summary.end_date).toLocaleDateString(
						"en-US",
						{
							month: "short",
							day: "numeric",
							year: "numeric",
						},
					);

					// Send email
					const result = await sendWeeklySummaryEmail({
						to: user.email,
						recipientName: user.full_name,
						householdName: summary.household_name,
						householdId: household.id,
						weekStart: startDate,
						weekEnd: endDate,
						totalSpending: summary.total_shared_spending,
						transactionCount: summary.transaction_count,
						memberContributions: summary.member_contributions,
						topCategories: summary.top_categories,
					});

					if (result.success) {
						successCount++;
						console.log(
							`✅ Sent weekly summary to ${user.email} for household ${household.name}`,
						);
					} else {
						failCount++;
						console.error(
							`❌ Failed to send email to ${user.email}:`,
							result.error,
						);
					}

					// Rate limiting: 100ms delay between emails
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
			} catch (error) {
				console.error(
					`Error processing household ${household.id}:`,
					error,
				);
				failCount++;
			}

			// Rate limiting: 500ms delay between households
			await new Promise((resolve) => setTimeout(resolve, 500));
		}

		console.log(
			`Weekly summary cron job completed: ${successCount} sent, ${skipCount} skipped (no activity), ${failCount} failed`,
		);

		return NextResponse.json({
			success: true,
			message: "Weekly summary emails processed",
			sent: successCount,
			skipped: skipCount,
			failed: failCount,
			total_households: households.length,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Weekly summary cron job failed:", error);
		return NextResponse.json(
			{
				error: "Cron job failed",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
