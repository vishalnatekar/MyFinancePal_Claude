import {
	checkRateLimit,
	createAuthErrorResponse,
	withHouseholdAuth,
} from "@/lib/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

interface RouteParams {
	params: { id: string; userId: string };
}

export const DELETE = withHouseholdAuth(
	async (
		request: NextRequest,
		user: User,
		householdId: string,
		{ params }: RouteParams,
	) => {
		try {
			const { userId } = params;

			// Rate limiting check for leave operations
			if (!checkRateLimit(`leave_household_${user.id}`, 5, 300000)) {
				// 5 leave operations per 5 minutes
				return createAuthErrorResponse("Too many leave requests", 429);
			}

			// Only the user themselves can leave (unless we add admin kick functionality later)
			if (userId !== user.id) {
				return NextResponse.json(
					{ error: "You can only remove yourself from households" },
					{ status: 403 },
				);
			}

			// Check if user is a member of this household
			const { data: membership, error: membershipError } = await supabaseAdmin
				.from("household_members")
				.select("role")
				.eq("household_id", householdId)
				.eq("user_id", userId)
				.single();

			if (membershipError || !membership) {
				return NextResponse.json(
					{ error: "You are not a member of this household" },
					{ status: 404 },
				);
			}

			// Check if user is the creator and sole member
			if (membership.role === "creator") {
				const { count, error: countError } = await supabaseAdmin
					.from("household_members")
					.select("*", { count: "exact", head: true })
					.eq("household_id", householdId);

				if (countError) {
					console.error("Error counting household members:", countError);
					return NextResponse.json(
						{ error: "Failed to validate household membership" },
						{ status: 500 },
					);
				}

				if (count && count === 1) {
					return NextResponse.json(
						{
							error:
								"As the sole member and creator, you cannot leave the household. Please delete the household instead.",
						},
						{ status: 400 },
					);
				}

				// If there are other members, creator can leave (ownership transfer feature is future enhancement)
			}

			// Begin transaction-like cleanup operations
			// 1. Remove from household_members
			const { error: removeMemberError } = await supabaseAdmin
				.from("household_members")
				.delete()
				.eq("household_id", householdId)
				.eq("user_id", userId);

			if (removeMemberError) {
				console.error("Error removing household member:", removeMemberError);
				return NextResponse.json(
					{ error: "Failed to leave household" },
					{ status: 500 },
				);
			}

			// 2. Clean up any expense splitting rules that reference this user
			// Note: This is a simplified cleanup. Full implementation would need to:
			// - Recalculate split percentages for affected expenses
			// - Handle edge cases where user was only split recipient
			// For now, we'll just mark this as a TODO for expense splitting feature
			// The RLS policies and ON DELETE CASCADE should handle most cleanup

			return NextResponse.json({
				message: "Successfully left household",
			});
		} catch (error) {
			console.error(
				"Error in DELETE /api/households/[id]/members/[userId]:",
				error,
			);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);
