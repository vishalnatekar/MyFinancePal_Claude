import {
	checkRateLimit,
	createAuthErrorResponse,
	withAuth,
} from "@/lib/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

interface RouteParams {
	params: { token: string };
}

export const POST = withAuth(
	async (request: NextRequest, user: User, { params }: RouteParams) => {
		try {
			const { token } = params;

			// Rate limiting check
			if (!checkRateLimit(`decline_invitation_${user.id}`, 10, 60000)) {
				// 10 declines per minute
				return createAuthErrorResponse("Too many requests", 429);
			}

			// Get user profile
			const { data: userProfile, error: profileError } = await supabaseAdmin
				.from("profiles")
				.select("email")
				.eq("id", user.id)
				.single();

			if (profileError || !userProfile) {
				return NextResponse.json(
					{ error: "User profile not found" },
					{ status: 404 },
				);
			}

			// Get invitation details
			const { data: invitation, error: invitationError } = await supabaseAdmin
				.from("household_invitations")
				.select("*")
				.eq("token", token)
				.single();

			if (invitationError || !invitation) {
				return NextResponse.json(
					{ error: "Invitation not found" },
					{ status: 404 },
				);
			}

			// Verify invitation email matches user email
			if (invitation.email.toLowerCase() !== userProfile.email.toLowerCase()) {
				return NextResponse.json(
					{
						error:
							"This invitation was sent to a different email address. Please log in with the invited email.",
					},
					{ status: 403 },
				);
			}

			// Check if invitation has expired
			if (new Date(invitation.expires_at) < new Date()) {
				await supabaseAdmin
					.from("household_invitations")
					.update({ status: "expired" })
					.eq("id", invitation.id);

				return NextResponse.json(
					{ error: "This invitation has expired" },
					{ status: 410 },
				);
			}

			// Check invitation status
			if (invitation.status !== "pending") {
				return NextResponse.json(
					{
						error: `This invitation has already been ${invitation.status}`,
					},
					{ status: 400 },
				);
			}

			// Update invitation status to declined
			const { error: updateError } = await supabaseAdmin
				.from("household_invitations")
				.update({
					status: "declined",
				})
				.eq("id", invitation.id);

			if (updateError) {
				console.error("Error updating invitation status:", updateError);
				return NextResponse.json(
					{ error: "Failed to decline invitation" },
					{ status: 500 },
				);
			}

			return NextResponse.json({
				message: "Invitation declined successfully",
			});
		} catch (error) {
			console.error(
				"Error in POST /api/households/invite/[token]/decline:",
				error,
			);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);
