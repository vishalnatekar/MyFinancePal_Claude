/**
 * Mark All Notifications as Read API Route
 * POST - Mark all (or household-filtered) notifications as read
 */

import {
	checkRateLimit,
	createAuthErrorResponse,
	withAuth,
} from "@/lib/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for request body
const markAllReadSchema = z.object({
	household_id: z.string().uuid().optional(),
});

/**
 * POST /api/notifications/mark-all-read
 * Mark all user's notifications as read
 * Optional request body: { household_id?: string } to filter by household
 */
export const POST = withAuth(async (request: NextRequest, user: User) => {
	try {
		// Rate limiting check (stricter for bulk operations)
		if (!checkRateLimit(`mark_all_${user.id}`, 5, 60000)) {
			// 5 requests per minute
			return createAuthErrorResponse("Too many requests", 429);
		}

		const body = await request.json().catch(() => ({}));

		// Validate input data
		const validatedData = markAllReadSchema.parse(body);

		// Build update query
		let query = supabaseAdmin
			.from("notifications")
			.update({
				is_read: true,
				read_at: new Date().toISOString(),
			})
			.eq("recipient_id", user.id)
			.eq("is_read", false); // Only update unread notifications

		// Apply household filter if provided
		if (validatedData.household_id) {
			query = query.eq("household_id", validatedData.household_id);
		}

		const { error, count } = await query;

		if (error) {
			console.error("Error marking all notifications as read:", error);
			return NextResponse.json(
				{ error: "Failed to mark notifications as read" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			updated_count: count || 0,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid input data", details: error.errors },
				{ status: 400 },
			);
		}

		console.error("Error in POST /api/notifications/mark-all-read:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
});
