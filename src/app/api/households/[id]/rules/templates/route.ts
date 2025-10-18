// Rule Templates API Route
// Story 4.1: Expense Splitting Rules Engine
// Route: GET /api/households/[id]/rules/templates

import { authenticateRequest } from "@/lib/auth-middleware";
import { RULE_TEMPLATES } from "@/lib/rule-templates";
import { createClient } from "@/lib/supabase-server";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/households/[id]/rules/templates
 * Get available rule templates for a household
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		// Authenticate user
		const authResult = await authenticateRequest(request);
		if (!authResult.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const householdId = params.id;
		const supabase = await createClient();

		// Verify user is a household member
		const { data: membership } = await supabase
			.from("household_members")
			.select("id")
			.eq("household_id", householdId)
			.eq("user_id", authResult.user.id)
			.single();

		if (!membership) {
			return NextResponse.json(
				{ error: "Not a member of this household" },
				{ status: 403 },
			);
		}

		// Get household member count for customization
		const { data: members } = await supabase
			.from("household_members")
			.select("user_id")
			.eq("household_id", householdId);

		const memberCount = members?.length || 0;

		// Return templates with metadata
		return NextResponse.json({
			templates: RULE_TEMPLATES,
			household_member_count: memberCount,
		});
	} catch (error) {
		console.error("Error in GET /api/households/[id]/rules/templates:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
