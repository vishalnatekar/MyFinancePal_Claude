import { randomUUID } from "node:crypto";
import {
	checkRateLimit,
	createAuthErrorResponse,
	withHouseholdAuth,
} from "@/lib/auth-middleware";
import { sendInvitationEmail } from "@/lib/email-service";
import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for sending invitations
const sendInvitationSchema = z.object({
	email: z.string().email("Invalid email address"),
});

// GET endpoint to fetch pending invitations for a household
export const GET = withHouseholdAuth(
	async (request: NextRequest, user: User, householdId: string) => {
		try {
			// Rate limiting check
			if (!checkRateLimit(`get_invitations_${user.id}`, 30, 60000)) {
				// 30 requests per minute
				return createAuthErrorResponse("Too many requests", 429);
			}

			// Fetch pending invitations for this household
			const { data: invitations, error } = await supabaseAdmin
				.from("household_invitations")
				.select("id, email, status, expires_at, created_at, resend_count")
				.eq("household_id", householdId)
				.eq("status", "pending")
				.gt("expires_at", new Date().toISOString())
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Error fetching invitations:", error);
				return NextResponse.json(
					{ error: "Failed to fetch invitations" },
					{ status: 500 },
				);
			}

			return NextResponse.json({ invitations: invitations || [] });
		} catch (error) {
			console.error("Error in GET /api/households/[id]/invite:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);

export const POST = withHouseholdAuth(
	async (request: NextRequest, user: User, householdId: string) => {
		try {
			// Rate limiting check for invitations
			if (!checkRateLimit(`invite_${user.id}`, 10, 300000)) {
				// 10 invitations per 5 minutes
				return createAuthErrorResponse("Too many invitation requests", 429);
			}

			const body = await request.json();

			// Validate input data
			const validatedData = sendInvitationSchema.parse(body);
			const inviteeEmail = validatedData.email.toLowerCase();

			// Get household details for email
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

			// Get inviter profile for email
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

			// Check if the invitee is already a member by email
			// First, find the user ID by email
			const { data: inviteeProfile } = await supabaseAdmin
				.from("profiles")
				.select("id")
				.eq("email", inviteeEmail)
				.maybeSingle();

			if (inviteeProfile) {
				// Check if this user is already a member of the household
				const { data: existingMember } = await supabaseAdmin
					.from("household_members")
					.select("id")
					.eq("household_id", householdId)
					.eq("user_id", inviteeProfile.id)
					.maybeSingle();

				if (existingMember) {
					return NextResponse.json(
						{ error: "User is already a member of this household" },
						{ status: 400 },
					);
				}
			}

			// Check for existing pending invitation
			const { data: existingInvitation } = await supabaseAdmin
				.from("household_invitations")
				.select("id, status, expires_at")
				.eq("household_id", householdId)
				.eq("email", inviteeEmail)
				.eq("status", "pending")
				.gt("expires_at", new Date().toISOString())
				.maybeSingle();

			if (existingInvitation) {
				return NextResponse.json(
					{
						error: "An active invitation already exists for this email address",
					},
					{ status: 400 },
				);
			}

			// Generate secure invitation token
			const token = randomUUID();

			// Set expiration date (7 days from now)
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + 7);

			// Create invitation record
			const { data: invitation, error: invitationError } = await supabaseAdmin
				.from("household_invitations")
				.insert({
					household_id: householdId,
					invited_by: user.id,
					email: inviteeEmail,
					token,
					expires_at: expiresAt.toISOString(),
					status: "pending",
				})
				.select()
				.single();

			if (invitationError) {
				console.error("Error creating invitation:", invitationError);
				return NextResponse.json(
					{ error: "Failed to create invitation" },
					{ status: 500 },
				);
			}

			// Send invitation email (non-blocking - don't fail if email fails)
			const inviterName = inviterProfile.full_name || inviterProfile.email;

			sendInvitationEmail({
				to: inviteeEmail,
				householdName: household.name,
				inviterName,
				invitationToken: token,
				expiresAt,
			})
				.then((result) => {
					if (!result.success) {
						console.error("Failed to send invitation email:", result.error);
						// Log the error but don't fail the invitation creation
					}
				})
				.catch((error) => {
					console.error("Error in sendInvitationEmail:", error);
				});

			return NextResponse.json({ invitation }, { status: 201 });
		} catch (error) {
			if (error instanceof z.ZodError) {
				return NextResponse.json(
					{ error: "Invalid input data", details: error.errors },
					{ status: 400 },
				);
			}

			console.error("Error in POST /api/households/[id]/invite:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);
