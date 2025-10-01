import {
	checkRateLimit,
	createAuthErrorResponse,
	withHouseholdAuth,
} from "@/lib/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for updating households
const updateHouseholdSchema = z.object({
	name: z.string().min(1, "Household name is required").max(100).optional(),
	description: z.string().optional(),
	settlement_day: z.number().min(1).max(31).optional(),
});

interface RouteParams {
	params: { id: string };
}

export const GET = withHouseholdAuth(
	async (request: NextRequest, user: User, householdId: string) => {
		try {
			// Rate limiting check
			if (!checkRateLimit(`get_household_${user.id}`, 30, 60000)) {
				// 30 requests per minute
				return createAuthErrorResponse("Too many requests", 429);
			}

			// Fetch household details (access already verified by withHouseholdAuth)
			const { data: household, error } = await supabaseAdmin
				.from("households")
				.select(`
        *,
        household_members(
          id,
          user_id,
          role,
          joined_at,
          profiles(email, full_name, avatar_url)
        )
      `)
				.eq("id", householdId)
				.single();

			if (error) {
				console.error("Error fetching household:", error);
				return NextResponse.json(
					{ error: "Failed to fetch household" },
					{ status: 500 },
				);
			}

			return NextResponse.json({ household });
		} catch (error) {
			console.error("Error in GET /api/households/[id]:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);

export const PUT = withHouseholdAuth(
	async (request: NextRequest, user: User, householdId: string) => {
		try {
			// Rate limiting check for updates
			if (!checkRateLimit(`update_household_${user.id}`, 10, 300000)) {
				// 10 updates per 5 minutes
				return createAuthErrorResponse("Too many update requests", 429);
			}

			const body = await request.json();

			// Validate input data
			const validatedData = updateHouseholdSchema.parse(body);

			// Check if user is the creator of this household
			const { data: household, error: householdError } = (await supabaseAdmin
				.from("households")
				.select("created_by")
				.eq("id", householdId)
				.single()) as { data: { created_by: string } | null; error: any };

			if (householdError || !household) {
				return NextResponse.json(
					{ error: "Household not found" },
					{ status: 404 },
				);
			}

			if (household.created_by !== user.id) {
				return NextResponse.json(
					{ error: "Only household creators can update household settings" },
					{ status: 403 },
				);
			}

			// Update household
			const { data: updatedHousehold, error } = await (supabaseAdmin as any)
				.from("households")
				.update({
					name: validatedData.name,
					description: validatedData.description,
					settlement_day: validatedData.settlement_day,
					updated_at: new Date().toISOString(),
				})
				.eq("id", householdId)
				.select()
				.single();

			if (error) {
				console.error("Error updating household:", error);
				return NextResponse.json(
					{ error: "Failed to update household" },
					{ status: 500 },
				);
			}

			return NextResponse.json({ household: updatedHousehold });
		} catch (error) {
			if (error instanceof z.ZodError) {
				return NextResponse.json(
					{ error: "Invalid input data", details: error.errors },
					{ status: 400 },
				);
			}

			console.error("Error in PUT /api/households/[id]:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);

export const DELETE = withHouseholdAuth(
	async (request: NextRequest, user: User, householdId: string) => {
		try {
			// Rate limiting check for deletes (very strict)
			if (!checkRateLimit(`delete_household_${user.id}`, 2, 3600000)) {
				// 2 deletes per hour
				return createAuthErrorResponse("Too many delete requests", 429);
			}

			// Check if user is the creator of this household
			const { data: household, error: householdError } = (await supabaseAdmin
				.from("households")
				.select("created_by")
				.eq("id", householdId)
				.single()) as { data: { created_by: string } | null; error: any };

			if (householdError || !household) {
				return NextResponse.json(
					{ error: "Household not found" },
					{ status: 404 },
				);
			}

			if (household.created_by !== user.id) {
				return NextResponse.json(
					{ error: "Only household creators can delete households" },
					{ status: 403 },
				);
			}

			// Delete household (cascades to related tables)
			const { error } = await supabaseAdmin
				.from("households")
				.delete()
				.eq("id", householdId);

			if (error) {
				console.error("Error deleting household:", error);
				return NextResponse.json(
					{ error: "Failed to delete household" },
					{ status: 500 },
				);
			}

			return NextResponse.json({ message: "Household deleted successfully" });
		} catch (error) {
			console.error("Error in DELETE /api/households/[id]:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);
