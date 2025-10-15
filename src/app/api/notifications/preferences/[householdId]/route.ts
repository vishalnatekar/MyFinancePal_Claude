/**
 * Notification Preferences API Routes
 * GET - Get user's notification preferences for a household
 * PUT - Update notification preferences
 */

import {
	checkRateLimit,
	createAuthErrorResponse,
	withAuth,
} from "@/lib/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase";
import { getNotificationPreferences } from "@/services/notification-service";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for updating preferences
const updatePreferencesSchema = z.object({
	email_notifications: z.boolean().optional(),
	in_app_notifications: z.boolean().optional(),
	large_transaction_threshold: z
		.number()
		.min(10, "Threshold must be at least £10")
		.max(1000, "Threshold must be at most £1000")
		.optional(),
	weekly_digest_enabled: z.boolean().optional(),
});

/**
 * GET /api/notifications/preferences/[householdId]
 * Get user's notification preferences for a specific household
 */
export const GET = withAuth(
	async (
		request: NextRequest,
		user: User,
		context: { params: Promise<{ householdId: string }> },
	) => {
		try {
			// Rate limiting check
			if (!checkRateLimit(user.id, 30, 60000)) {
				// 30 requests per minute
				return createAuthErrorResponse("Too many requests", 429);
			}

			const { householdId } = await context.params;

			// Verify user is a member of the household
			const { data: membership, error: membershipError } = await supabaseAdmin
				.from("household_members")
				.select("id")
				.eq("household_id", householdId)
				.eq("user_id", user.id)
				.single();

			if (membershipError || !membership) {
				return NextResponse.json(
					{ error: "You are not a member of this household" },
					{ status: 403 },
				);
			}

			// Get or create notification preferences
			const preferences = await getNotificationPreferences(user.id, householdId);

			if (!preferences) {
				return NextResponse.json(
					{ error: "Failed to fetch notification preferences" },
					{ status: 500 },
				);
			}

			return NextResponse.json({ preferences });
		} catch (error) {
			console.error(
				"Error in GET /api/notifications/preferences/[householdId]:",
				error,
			);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);

/**
 * PUT /api/notifications/preferences/[householdId]
 * Update user's notification preferences for a specific household
 */
export const PUT = withAuth(
	async (
		request: NextRequest,
		user: User,
		context: { params: Promise<{ householdId: string }> },
	) => {
		try {
			// Rate limiting check (stricter for updates)
			if (!checkRateLimit(`prefs_${user.id}`, 10, 60000)) {
				// 10 updates per minute
				return createAuthErrorResponse("Too many requests", 429);
			}

			const { householdId } = await context.params;
			const body = await request.json();

			// Validate input data
			const validatedData = updatePreferencesSchema.parse(body);

			// Verify user is a member of the household
			const { data: membership, error: membershipError } = await supabaseAdmin
				.from("household_members")
				.select("id")
				.eq("household_id", householdId)
				.eq("user_id", user.id)
				.single();

			if (membershipError || !membership) {
				return NextResponse.json(
					{ error: "You are not a member of this household" },
					{ status: 403 },
				);
			}

			// Check if preferences exist
			const { data: existing, error: fetchError } = await supabaseAdmin
				.from("notification_preferences")
				.select("id")
				.eq("user_id", user.id)
				.eq("household_id", householdId)
				.single();

			let preferences;

			if (fetchError && fetchError.code !== "PGRST116") {
				// PGRST116 is "no rows returned"
				console.error("Error fetching preferences:", fetchError);
				return NextResponse.json(
					{ error: "Failed to fetch preferences" },
					{ status: 500 },
				);
			}

			if (existing) {
				// Update existing preferences
				const { data: updated, error: updateError } = await supabaseAdmin
					.from("notification_preferences")
					.update(validatedData)
					.eq("user_id", user.id)
					.eq("household_id", householdId)
					.select()
					.single();

				if (updateError) {
					console.error("Error updating preferences:", updateError);
					return NextResponse.json(
						{ error: "Failed to update preferences" },
						{ status: 500 },
					);
				}

				preferences = updated;
			} else {
				// Create new preferences with provided values
				const { data: created, error: createError } = await supabaseAdmin
					.from("notification_preferences")
					.insert({
						user_id: user.id,
						household_id: householdId,
						email_notifications:
							validatedData.email_notifications ?? true,
						in_app_notifications:
							validatedData.in_app_notifications ?? true,
						large_transaction_threshold:
							validatedData.large_transaction_threshold ?? 100.0,
						weekly_digest_enabled:
							validatedData.weekly_digest_enabled ?? true,
					})
					.select()
					.single();

				if (createError) {
					console.error("Error creating preferences:", createError);
					return NextResponse.json(
						{ error: "Failed to create preferences" },
						{ status: 500 },
					);
				}

				preferences = created;
			}

			return NextResponse.json({ preferences });
		} catch (error) {
			if (error instanceof z.ZodError) {
				return NextResponse.json(
					{ error: "Invalid input data", details: error.errors },
					{ status: 400 },
				);
			}

			console.error(
				"Error in PUT /api/notifications/preferences/[householdId]:",
				error,
			);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);
