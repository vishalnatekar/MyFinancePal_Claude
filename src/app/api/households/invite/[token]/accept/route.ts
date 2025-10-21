import {
	checkRateLimit,
	createAuthErrorResponse,
	withAuth,
} from "@/lib/auth-middleware";
import { sendAcceptanceNotificationEmail } from "@/lib/email-service";
import { supabaseAdmin } from "@/lib/supabase";
import {
	createNotification,
	getHouseholdRecipients,
} from "@/services/notification-service";
import type { Database } from "@/types/database";
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
			if (!checkRateLimit(`accept_invitation_${user.id}`, 10, 60000)) {
				// 10 accepts per minute
				return createAuthErrorResponse("Too many requests", 429);
			}

			// Get user profile
			const { data: userProfile, error: profileError } = await supabaseAdmin
				.from("profiles")
				.select("email, full_name")
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
				.select(
					`
					*,
					households:household_id (
						id,
						name
					)
				`,
				)
				.eq("token", token)
				.single<
					Database["public"]["Tables"]["household_invitations"]["Row"] & {
						households: { id: string; name: string | null } | null;
					}
				>();

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

			// Check if user is already a member
			const { data: existingMember } = await supabaseAdmin
				.from("household_members")
				.select("id")
				.eq("household_id", invitation.household_id)
				.eq("user_id", user.id)
				.maybeSingle();

			if (existingMember) {
				return NextResponse.json(
					{ error: "You are already a member of this household" },
					{ status: 400 },
				);
			}

			// Add user as household member
			const { error: memberError } = await supabaseAdmin
				.from("household_members")
				.insert({
					household_id: invitation.household_id,
					user_id: user.id,
					role: "member",
				});

			if (memberError) {
				console.error("Error adding household member:", memberError);
				return NextResponse.json(
					{ error: "Failed to join household" },
					{ status: 500 },
				);
			}

			// Update invitation status
			const { error: updateError } = await supabaseAdmin
				.from("household_invitations")
				.update({
					status: "accepted",
					accepted_at: new Date().toISOString(),
				})
				.eq("id", invitation.id);

			if (updateError) {
				console.error("Error updating invitation status:", updateError);
				// Don't fail the operation if status update fails
			}

			// Create in-app notifications for household members (non-blocking)
			try {
				const recipients = await getHouseholdRecipients(
					invitation.household_id,
					user.id,
				);
				const newMemberName = userProfile.full_name || userProfile.email;

				if (recipients.length > 0) {
					await createNotification(
						"member_joined",
						invitation.household_id,
						recipients,
						user.id,
						{
							member_name: newMemberName,
						},
					);
				}
			} catch (notifError) {
				console.error("Error creating member joined notification:", notifError);
			}

			// Send acceptance notification to household members (non-blocking)
			const { data: householdMembers } = await supabaseAdmin
				.from("household_members")
				.select(
					`
					profiles:user_id (
						email,
						full_name
					)
				`,
				)
				.eq("household_id", invitation.household_id)
				.neq("user_id", user.id)
				.returns<
					Array<
						Database["public"]["Tables"]["household_members"]["Row"] & {
							profiles: Pick<
								Database["public"]["Tables"]["profiles"]["Row"],
								"email" | "full_name"
							> | null;
						}
					>
				>();

			if (householdMembers && householdMembers.length > 0) {
				const acceptedUserName = userProfile.full_name || userProfile.email;
				const householdName = invitation.households?.name || "Unknown";

				// Send notifications to all existing members
				for (const member of householdMembers) {
					const profile = member.profiles;
					if (profile?.email) {
						sendAcceptanceNotificationEmail({
							to: profile.email,
							householdName,
							acceptedUserName,
							acceptedUserEmail: userProfile.email,
						}).catch((error) => {
							console.error("Failed to send acceptance notification:", error);
						});
					}
				}
			}

			return NextResponse.json({
				message: "Successfully joined household",
				household_id: invitation.household_id,
			});
		} catch (error) {
			console.error(
				"Error in POST /api/households/invite/[token]/accept:",
				error,
			);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);
