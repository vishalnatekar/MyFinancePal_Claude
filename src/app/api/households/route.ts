import {
	checkRateLimit,
	createAuthErrorResponse,
	withAuth,
} from "@/lib/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for creating households
const createHouseholdSchema = z.object({
	name: z.string().min(1, "Household name is required").max(100),
	description: z.string().optional(),
	settlement_day: z.number().min(1).max(31).optional(),
});

export const GET = withAuth(async (request: NextRequest, user: User) => {
	try {
		// Rate limiting check
		if (!checkRateLimit(user.id, 20, 60000)) {
			// 20 requests per minute
			return createAuthErrorResponse("Too many requests", 429);
		}

		const { data: households, error } = await supabaseAdmin
			.from("households")
			.select(`
        *,
        household_members!inner(
          role,
          joined_at
        )
      `)
			.eq("household_members.user_id", user.id);

		if (error) {
			console.error("Error fetching households:", error);
			return NextResponse.json(
				{ error: "Failed to fetch households" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ households });
	} catch (error) {
		console.error("Error in GET /api/households:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
});

export const POST = withAuth(async (request: NextRequest, user: User) => {
	try {
		// Rate limiting check for creation (stricter)
		if (!checkRateLimit(`create_${user.id}`, 5, 300000)) {
			// 5 households per 5 minutes
			return createAuthErrorResponse(
				"Too many households created recently",
				429,
			);
		}

		const body = await request.json();

		// Validate input data
		const validatedData = createHouseholdSchema.parse(body);

		// Check if user already has too many households (max 10)
		const { count, error: countError } = await supabaseAdmin
			.from("household_members")
			.select("*", { count: "exact", head: true })
			.eq("user_id", user.id);

		if (countError) {
			console.error("Error checking household count:", countError);
			return NextResponse.json(
				{ error: "Failed to validate household count" },
				{ status: 500 },
			);
		}

		if (count && count >= 10) {
			return NextResponse.json(
				{ error: "Maximum number of households reached (10)" },
				{ status: 400 },
			);
		}

		// Create household
		const { data: household, error: householdError } = await (
			supabaseAdmin as any
		)
			.from("households")
			.insert({
				name: validatedData.name,
				description: validatedData.description,
				created_by: user.id,
				settlement_day: validatedData.settlement_day || 1,
			})
			.select()
			.single();

		if (householdError) {
			console.error("Error creating household:", householdError);
			return NextResponse.json(
				{ error: "Failed to create household" },
				{ status: 500 },
			);
		}

		// Add creator as household member
		const { error: memberError } = await (supabaseAdmin as any)
			.from("household_members")
			.insert({
				household_id: household.id,
				user_id: user.id,
				role: "creator",
			});

		if (memberError) {
			console.error("Error adding household member:", memberError);
			// Clean up household if member creation fails
			await supabaseAdmin.from("households").delete().eq("id", household.id);
			return NextResponse.json(
				{ error: "Failed to create household membership" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ household }, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid input data", details: error.errors },
				{ status: 400 },
			);
		}

		console.error("Error in POST /api/households:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
});
