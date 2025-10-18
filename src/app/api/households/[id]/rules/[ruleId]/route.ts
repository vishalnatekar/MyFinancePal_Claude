// Individual Splitting Rule API Routes
// Story 4.1: Expense Splitting Rules Engine
// Routes: PUT /api/households/[id]/rules/[ruleId], DELETE /api/households/[id]/rules/[ruleId]

import { authenticateRequest } from "@/lib/auth-middleware";
import { UpdateSplittingRuleSchema } from "@/lib/splitting-rule-validation";
import { createClient } from "@/lib/supabase-server";
import { type NextRequest, NextResponse } from "next/server";

/**
 * PUT /api/households/[id]/rules/[ruleId]
 * Update an existing splitting rule
 */
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string; ruleId: string } },
) {
	try {
		// Authenticate user
		const authResult = await authenticateRequest(request);
		if (!authResult.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const householdId = params.id;
		const ruleId = params.ruleId;
		const body = await request.json();

		// Validate request body
		const validation = UpdateSplittingRuleSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: validation.error.errors,
				},
				{ status: 400 },
			);
		}

		const data = validation.data;
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

		// Verify rule exists and belongs to this household
		const { data: existingRule } = await supabase
			.from("expense_splitting_rules")
			.select("id, household_id")
			.eq("id", ruleId)
			.eq("household_id", householdId)
			.single();

		if (!existingRule) {
			return NextResponse.json({ error: "Rule not found" }, { status: 404 });
		}

		// If updating split_percentage, verify all user IDs are household members
		if (data.split_percentage) {
			const splitUserIds = Object.keys(data.split_percentage);
			const { data: members } = await supabase
				.from("household_members")
				.select("user_id")
				.eq("household_id", householdId)
				.in("user_id", splitUserIds);

			const validUserIds = members?.map((m) => m.user_id) || [];
			const invalidUserIds = splitUserIds.filter(
				(id) => !validUserIds.includes(id),
			);

			if (invalidUserIds.length > 0) {
				return NextResponse.json(
					{
						error: "Invalid user IDs in split_percentage",
						invalid_ids: invalidUserIds,
					},
					{ status: 400 },
				);
			}
		}

		// Update the rule
		const { data: updatedRule, error: updateError } = await supabase
			.from("expense_splitting_rules")
			.update(data)
			.eq("id", ruleId)
			.select()
			.single();

		if (updateError) {
			console.error("Error updating rule:", updateError);
			return NextResponse.json(
				{ error: "Failed to update rule" },
				{ status: 500 },
			);
		}

		return NextResponse.json(updatedRule);
	} catch (error) {
		console.error("Error in PUT /api/households/[id]/rules/[ruleId]:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

/**
 * DELETE /api/households/[id]/rules/[ruleId]
 * Soft delete a splitting rule (set is_active = false)
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string; ruleId: string } },
) {
	try {
		// Authenticate user
		const authResult = await authenticateRequest(request);
		if (!authResult.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const householdId = params.id;
		const ruleId = params.ruleId;
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

		// Verify rule exists and belongs to this household
		const { data: existingRule } = await supabase
			.from("expense_splitting_rules")
			.select("id, household_id, is_active")
			.eq("id", ruleId)
			.eq("household_id", householdId)
			.single();

		if (!existingRule) {
			return NextResponse.json({ error: "Rule not found" }, { status: 404 });
		}

		if (!existingRule.is_active) {
			return NextResponse.json(
				{ error: "Rule is already inactive" },
				{ status: 400 },
			);
		}

		// Soft delete by setting is_active to false
		const { error: deleteError } = await supabase
			.from("expense_splitting_rules")
			.update({ is_active: false })
			.eq("id", ruleId);

		if (deleteError) {
			console.error("Error deleting rule:", deleteError);
			return NextResponse.json(
				{ error: "Failed to delete rule" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			message: "Rule deactivated successfully",
			rule_id: ruleId,
		});
	} catch (error) {
		console.error(
			"Error in DELETE /api/households/[id]/rules/[ruleId]:",
			error,
		);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
