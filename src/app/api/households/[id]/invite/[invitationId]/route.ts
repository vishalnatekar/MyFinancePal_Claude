import {
	checkRateLimit,
	createAuthErrorResponse,
	withHouseholdAuth,
} from "@/lib/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

interface RouteParams {
	params: { id: string; invitationId: string };
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
					{ error: "Missing parameters" },
					{ status: 400 },
				);
			}

			const { invitationId } = context.params;

			// Rate limiting check for delete operations
			if (!checkRateLimit(`delete_invitation_${user.id}`, 20, 300000)) {
				// 20 deletes per 5 minutes
				return createAuthErrorResponse("Too many delete requests", 429);
			}

			// Get invitation details to verify it belongs to this household
			const { data: invitation, error: invitationError } = await supabaseAdmin
				.from("household_invitations")
				.select("id, household_id")
				.eq("id", invitationId)
				.eq("household_id", householdId)
				.single();

			if (invitationError || !invitation) {
				return NextResponse.json(
					{ error: "Invitation not found" },
					{ status: 404 },
				);
			}

			// Delete the invitation
			const { error: deleteError } = await supabaseAdmin
				.from("household_invitations")
				.delete()
				.eq("id", invitationId);

			if (deleteError) {
				console.error("Error deleting invitation:", deleteError);
				return NextResponse.json(
					{ error: "Failed to delete invitation" },
					{ status: 500 },
				);
			}

			return NextResponse.json({
				message: "Invitation deleted successfully",
			});
		} catch (error) {
			console.error(
				"Error in DELETE /api/households/[id]/invite/[invitationId]:",
				error,
			);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);
