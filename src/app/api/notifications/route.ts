/**
 * Notifications API Routes
 * GET - Get user's notifications with pagination and filtering
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
 * GET /api/notifications
 * Get user's notifications with pagination and filtering
 * Query params:
 * - household_id: Filter by household (optional)
 * - unread_only: Filter to unread notifications only (optional, default: false)
 * - limit: Number of notifications to return (optional, default: 20, max: 100)
 * - offset: Number of notifications to skip (optional, default: 0)
 */
export const GET = withAuth(async (request: NextRequest, user: User) => {
	try {
		// Rate limiting check
		if (!checkRateLimit(user.id, 30, 60000)) {
			// 30 requests per minute
			return createAuthErrorResponse("Too many requests", 429);
		}

		const searchParams = request.nextUrl.searchParams;
		const householdId = searchParams.get("household_id");
		const unreadOnly = searchParams.get("unread_only") === "true";
		const limit = Math.min(
			Number.parseInt(searchParams.get("limit") || "20", 10),
			100,
		);
		const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

		// Build query - fetch notifications without joins
		let query = supabaseAdmin
			.from("notifications")
			.select("*")
			.eq("recipient_id", user.id)
			.order("created_at", { ascending: false })
			.range(offset, offset + limit - 1);

		// Apply filters
		if (householdId) {
			query = query.eq("household_id", householdId);
		}

		if (unreadOnly) {
			query = query.eq("is_read", false);
		}

		const { data: notifications, error } = await query;

		if (error) {
			console.error("Error fetching notifications:", error);
			return NextResponse.json(
				{ error: "Failed to fetch notifications" },
				{ status: 500 },
			);
		}

		// Manually fetch actor profiles
		if (notifications && notifications.length > 0) {
			const actorIds = Array.from(
				new Set(
					notifications
						.map((n) => n.actor_id)
						.filter((id): id is string => id !== null),
				),
			);

			if (actorIds.length > 0) {
				const { data: actors } = await supabaseAdmin
					.from("profiles")
					.select("id, full_name, avatar_url")
					.in("id", actorIds);

				// Map actors to notifications
				const actorsMap = new Map(actors?.map((a) => [a.id, a]) || []);

				for (const notification of notifications) {
					if (notification.actor_id) {
						(notification as any).actor = actorsMap.get(notification.actor_id);
					}
				}
			}
		}

		// Get unread count
		const { count: unreadCount, error: countError } = await supabaseAdmin
			.from("notifications")
			.select("*", { count: "exact", head: true })
			.eq("recipient_id", user.id)
			.eq("is_read", false);

		if (countError) {
			console.error("Error counting unread notifications:", countError);
		}

		return NextResponse.json({
			notifications,
			unread_count: unreadCount || 0,
			has_more: notifications.length === limit,
		});
	} catch (error) {
		console.error("Error in GET /api/notifications:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
});
