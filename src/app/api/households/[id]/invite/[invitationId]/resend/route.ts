import {
	checkRateLimit,
	createAuthErrorResponse,
	withHouseholdAuth,
} from "@/lib/auth-middleware";
import { sendInvitationEmail } from "@/lib/email-service";
import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

interface RouteParams {
	params: { id: string; invitationId: string };
}

export const POST = withHouseholdAuth(
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

			// Rate limiting check for resend operations (very strict)
			if (!checkRateLimit(`resend_invitation_${user.id}`, 5, 600000)) {
				// 5 resends per 10 minutes
				return createAuthErrorResponse("Too many resend requests", 429);
			}

			// Get invitation details
			const { data: invitation, error: invitationError } = await supabaseAdmin
				.from("household_invitations")
				.select("*")
				.eq("id", invitationId)
				.eq("household_id", householdId)
				.single();

			if (invitationError || !invitation) {
				return NextResponse.json(
					{ error: "Invitation not found" },
					{ status: 404 },
				);
			}

			// Check if invitation is pending
			if (invitation.status !== "pending") {
				return NextResponse.json(
					{
						error: `Cannot resend invitation with status: ${invitation.status}`,
					},
					{ status: 400 },
				);
			}

			// Check if invitation has expired
			if (new Date(invitation.expires_at) < new Date()) {
				return NextResponse.json(
					{ error: "Cannot resend expired invitation" },
					{ status: 400 },
				);
			}

			// Check resend limit (max 3 resends)
			if (invitation.resend_count >= 3) {
				return NextResponse.json(
					{
						error:
							"Maximum resend limit reached (3). Please create a new invitation.",
					},
					{ status: 400 },
				);
			}

			// Get household and inviter details for email
			const { data: household, error: householdError } = await supabaseAdmin
				.from("households")
				.select("name")
				.eq("id", householdId)
				.single();

			if (householdError || !household) {
				return NextResponse.json(
					{ error: "Household not found" },
					{ status: 404 },
				);
			}

			const { data: inviterProfile, error: profileError } = await supabaseAdmin
				.from("profiles")
				.select("email, full_name")
				.eq("id", user.id)
				.single();

			if (profileError || !inviterProfile) {
				return NextResponse.json(
					{ error: "Inviter profile not found" },
					{ status: 404 },
				);
			}

			// Update resend count
			const { error: updateError } = await supabaseAdmin
				.from("household_invitations")
				.update({
					resend_count: invitation.resend_count + 1,
				})
				.eq("id", invitationId);

			if (updateError) {
				console.error("Error updating resend count:", updateError);
				return NextResponse.json(
					{ error: "Failed to update invitation" },
					{ status: 500 },
				);
			}

			// Resend invitation email
			const inviterName = inviterProfile.full_name || inviterProfile.email;

			const emailResult = await sendInvitationEmail({
				to: invitation.email,
				householdName: household.name,
				inviterName,
				invitationToken: invitation.token,
				expiresAt: new Date(invitation.expires_at),
			});

			if (!emailResult.success) {
				console.error("Failed to resend invitation email:", emailResult.error);
				return NextResponse.json(
					{ error: "Failed to send invitation email" },
					{ status: 500 },
				);
			}

			return NextResponse.json({
				message: "Invitation resent successfully",
				resend_count: invitation.resend_count + 1,
			});
		} catch (error) {
			console.error(
				"Error in POST /api/households/[id]/invite/[invitationId]/resend:",
				error,
			);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);
