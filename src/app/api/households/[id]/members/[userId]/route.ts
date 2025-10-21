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
		context?: RouteParams,
	) => {
		try {
			if (!context?.params) {
				return NextResponse.json(
					{ error: "Invalid request parameters" },
					{ status: 400 },
				);
			}
			const { userId } = context.params;

			// Rate limiting check for member removal operations
			if (!checkRateLimit(`remove_member_${user.id}`, 5, 300000)) {
				// 5 removal operations per 5 minutes
				return createAuthErrorResponse("Too many removal requests", 429);
			}

			// Check the requesting user's membership and role
			const { data: requestingUserMembership, error: requestingUserError } =
				await supabaseAdmin
					.from("household_members")
					.select("role")
					.eq("household_id", householdId)
					.eq("user_id", user.id)
					.single();

			if (requestingUserError || !requestingUserMembership) {
				return NextResponse.json(
					{ error: "You are not a member of this household" },
					{ status: 404 },
				);
			}

			// Check if target user is a member of this household
			const { data: targetMembership, error: membershipError } =
				await supabaseAdmin
					.from("household_members")
					.select("role")
					.eq("household_id", householdId)
					.eq("user_id", userId)
					.single();

			if (membershipError || !targetMembership) {
				return NextResponse.json(
					{ error: "User is not a member of this household" },
					{ status: 404 },
				);
			}

			// Authorization logic:
			// 1. User can remove themselves (leave household)
			// 2. Creator can remove other members (but not themselves via this endpoint)
			const isSelfRemoval = userId === user.id;
			const isCreator = requestingUserMembership.role === "creator";

			if (!isSelfRemoval && !isCreator) {
				return NextResponse.json(
					{ error: "You don't have permission to remove this member" },
					{ status: 403 },
				);
			}

			// Prevent creator from being removed by themselves through this endpoint
			// (they should use transfer ownership or leave household functionality)
			if (isCreator && isSelfRemoval && targetMembership.role === "creator") {
				return NextResponse.json(
					{
						error:
							"Creators should use the 'Leave Household' option in settings",
					},
					{ status: 400 },
				);
			}

			// Check if removing the creator and they're the sole member
			if (targetMembership.role === "creator" && isSelfRemoval) {
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
					{ error: "Failed to remove member from household" },
					{ status: 500 },
				);
			}

			// 2. Unshare all transactions that were shared by this user to this household
			const { error: unshareError } = await supabaseAdmin
				.from("transactions")
				.update({
					shared_with_household_id: null,
					shared_at: null,
					shared_by: null,
				})
				.eq("shared_by", userId)
				.eq("shared_with_household_id", householdId);

			if (unshareError) {
				console.error(
					"Error unsharing transactions for removed member:",
					unshareError,
				);
				// Don't fail the whole operation, just log the error
				// The member has already been removed
			}

			// 3. Log the unsharing action in history
			// Get all accounts owned by the removed user to log the unsharing
			const { data: userAccounts } = await supabaseAdmin
				.from("financial_accounts")
				.select("id")
				.eq("user_id", userId);

			if (userAccounts && userAccounts.length > 0) {
				const sharingHistoryEntries = userAccounts.map((account) => ({
					account_id: account.id,
					household_id: householdId,
					action: "unshared",
					changed_by: user.id, // The user who performed the removal
				}));

				await supabaseAdmin
					.from("account_sharing_history")
					.insert(sharingHistoryEntries);
			}

			// 4. Clean up any expense splitting rules that reference this user
			// Note: This is a simplified cleanup. Full implementation would need to:
			// - Recalculate split percentages for affected expenses
			// - Handle edge cases where user was only split recipient
			// For now, we'll just mark this as a TODO for expense splitting feature
			// The RLS policies and ON DELETE CASCADE should handle most cleanup

			return NextResponse.json({
				message: isSelfRemoval
					? "Successfully left household"
					: "Successfully removed member from household",
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
