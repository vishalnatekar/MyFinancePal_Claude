// Create Rule From Template API Route
// Story 4.1: Expense Splitting Rules Engine
// Route: POST /api/households/[id]/rules/from-template

import { authenticateRequest } from "@/lib/auth-middleware";
import { createRuleFromTemplate, getTemplateById } from "@/lib/rule-templates";
import { CreateRuleFromTemplateSchema } from "@/lib/splitting-rule-validation";
import { createClient } from "@/lib/supabase-server";
import { type NextRequest, NextResponse } from "next/server";

/**
 * POST /api/households/[id]/rules/from-template
 * Create a new rule from a template with customizations
 */
export async function POST(
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
		const body = await request.json();

		// Validate request body
		const validation = CreateRuleFromTemplateSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: validation.error.errors,
				},
				{ status: 400 },
			);
		}

		const { template_id, customizations } = validation.data;
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

		// Get template
		const template = getTemplateById(template_id);
		if (!template) {
			return NextResponse.json(
				{ error: "Template not found" },
				{ status: 404 },
			);
		}

		// Get household members
		const { data: members } = await supabase
			.from("household_members")
			.select("user_id")
			.eq("household_id", householdId);

		const memberIds = members?.map((m) => m.user_id) || [];

		if (memberIds.length === 0) {
			return NextResponse.json(
				{ error: "No household members found" },
				{ status: 400 },
			);
		}

		// Create rule from template with customizations
		const ruleData = createRuleFromTemplate(
			template,
			memberIds,
			authResult.user.id,
			customizations,
		);

		// Validate split_percentage if provided in customizations
		if (customizations.split_percentage) {
			const splitUserIds = Object.keys(customizations.split_percentage);
			const invalidUserIds = splitUserIds.filter(
				(id) => !memberIds.includes(id),
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

		// Insert the rule
		const { data: newRule, error: insertError } = await supabase
			.from("expense_splitting_rules")
			.insert({
				household_id: householdId,
				rule_name: ruleData.rule_name,
				rule_type: ruleData.rule_type,
				priority: ruleData.priority || 100,
				merchant_pattern: ruleData.merchant_pattern,
				category_match: ruleData.category_match,
				min_amount: ruleData.min_amount,
				max_amount: ruleData.max_amount,
				split_percentage: ruleData.split_percentage,
				apply_to_existing_transactions: false,
				created_by: authResult.user.id,
				is_active: true,
			})
			.select()
			.single();

		if (insertError) {
			console.error("Error creating rule from template:", insertError);
			return NextResponse.json(
				{ error: "Failed to create rule from template" },
				{ status: 500 },
			);
		}

		return NextResponse.json(
			{
				rule: newRule,
				template_used: template.name,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error(
			"Error in POST /api/households/[id]/rules/from-template:",
			error,
		);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
