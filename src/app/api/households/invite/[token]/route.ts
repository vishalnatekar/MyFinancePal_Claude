import { checkRateLimit } from "@/lib/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase";
import { type NextRequest, NextResponse } from "next/server";

interface RouteParams {
	params: { token: string };
}

export async function GET(
	request: NextRequest,
	{ params }: RouteParams,
): Promise<Response> {
	try {
		const { token } = params;

		// SECURITY: Rate limit to prevent token enumeration attacks
		const clientIp = request.headers.get("x-forwarded-for") || "unknown";
		if (!checkRateLimit(`view_invitation_${clientIp}`, 10, 60000)) {
			// 10 requests per minute per IP
			return NextResponse.json(
				{ error: "Too many requests" },
				{ status: 429 },
			);
		}

		// Get invitation details (no auth required to view invitation)
		const { data: invitation, error: invitationError } = await supabaseAdmin
			.from("household_invitations")
			.select("*")
			.eq("token", token)
			.single();

		if (invitationError || !invitation) {
			console.error("Error fetching invitation:", invitationError);
			return NextResponse.json(
				{ error: "Invitation not found" },
				{ status: 404 },
			);
		}

		// Check if invitation has expired FIRST (before revealing details)
		if (new Date(invitation.expires_at) < new Date()) {
			// Auto-mark as expired
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
					status: invitation.status,
				},
				{ status: 400 },
			);
		}

		// Fetch household details separately (only AFTER validating invitation is valid and pending)
		const { data: household } = await supabaseAdmin
			.from("households")
			.select("name, description")
			.eq("id", invitation.household_id)
			.single();

		// Fetch inviter profile separately - REDACT sensitive info
		const { data: inviterProfile } = await supabaseAdmin
			.from("profiles")
			.select("full_name")
			.eq("id", invitation.invited_by)
			.single();

		// SECURITY: Return minimal information - don't expose internal IDs or sensitive data
		const safeInvitationDetails = {
			household_name: household?.name || "Unknown Household",
			household_description: household?.description,
			inviter_name: inviterProfile?.full_name || "A team member",
			invited_email: invitation.email,
			expires_at: invitation.expires_at,
		};

		return NextResponse.json({ invitation: safeInvitationDetails });
	} catch (error) {
		console.error("Error in GET /api/households/invite/[token]:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
