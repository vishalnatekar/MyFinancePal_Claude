/**
 * Mark Notification as Read API Route
 * PUT - Mark a specific notification as read
 */

import {
	checkRateLimit,
	createAuthErrorResponse,
	withAuth,
} from "@/lib/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

/**
 * PUT /api/notifications/[id]/read
 * Mark a specific notification as read
 */
export const PUT = withAuth(
	async (
		request: NextRequest,
		user: User,
		context: { params: Promise<{ id: string }> },
	) => {
		try {
			// Rate limiting check
			if (!checkRateLimit(user.id, 30, 60000)) {
				// 30 requests per minute
				return createAuthErrorResponse("Too many requests", 429);
			}

			const { id } = await context.params;

			// Update notification (RLS will ensure user can only update their own)
			const { data: notification, error } = await supabaseAdmin
				.from("notifications")
				.update({
					is_read: true,
					read_at: new Date().toISOString(),
				})
				.eq("id", id)
				.eq("recipient_id", user.id) // Ensure user owns this notification
				.select()
				.single();

			if (error) {
				if (error.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Notification not found" },
						{ status: 404 },
					);
				}

				console.error("Error marking notification as read:", error);
				return NextResponse.json(
					{ error: "Failed to mark notification as read" },
					{ status: 500 },
				);
			}

			return NextResponse.json({ notification });
		} catch (error) {
			console.error("Error in PUT /api/notifications/[id]/read:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);
