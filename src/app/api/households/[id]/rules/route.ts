// Splitting Rules API Routes
// Story 4.1: Expense Splitting Rules Engine
// Routes: GET /api/households/[id]/rules, POST /api/households/[id]/rules

import { authenticateRequest } from "@/lib/auth-middleware";
import { CreateSplittingRuleSchema } from "@/lib/splitting-rule-validation";
import { createClient } from "@/lib/supabase-server";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/households/[id]/rules
 * List all splitting rules for a household
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
		const { searchParams } = new URL(request.url);
		const activeOnly = searchParams.get("active_only") === "true";
		const orderBy = searchParams.get("order_by") || "priority";

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

		// Build query
		let query = supabase
			.from("expense_splitting_rules")
			.select(`
        *,
        creator:created_by (
          id,
          full_name,
          avatar_url
        )
      `)
			.eq("household_id", householdId);

		// Filter by active status if requested
		if (activeOnly) {
			query = query.eq("is_active", true);
		}

		// Order by priority or created_at
		if (orderBy === "priority") {
			query = query.order("priority", { ascending: true });
		} else {
			query = query.order("created_at", { ascending: false });
		}

		const { data: rules, error } = await query;

		if (error) {
			console.error("Error fetching rules:", error);
			return NextResponse.json(
				{ error: "Failed to fetch rules" },
				{ status: 500 },
			);
		}

		// Transform data to include creator details
		const rulesWithCreator =
			rules?.map((rule) => ({
				...rule,
				creator_name: rule.creator?.full_name || "Unknown",
				creator_avatar: rule.creator?.avatar_url || null,
			})) || [];

		return NextResponse.json(rulesWithCreator);
	} catch (error) {
		console.error("Error in GET /api/households/[id]/rules:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

/**
 * POST /api/households/[id]/rules
 * Create a new splitting rule for a household
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
		const validation = CreateSplittingRuleSchema.safeParse(body);
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
			.select("id, user_id")
			.eq("household_id", householdId)
			.eq("user_id", authResult.user.id)
			.single();

		if (!membership) {
			return NextResponse.json(
				{ error: "Not a member of this household" },
				{ status: 403 },
			);
		}

		// Verify that all user IDs in split_percentage are household members
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

		// Check for conflicting rules (warn only, don't block)
		const conflicts = await checkRuleConflicts(supabase, householdId, data);

		// Create the rule
		const { data: newRule, error: insertError } = await supabase
			.from("expense_splitting_rules")
			.insert({
				household_id: householdId,
				rule_name: data.rule_name,
				rule_type: data.rule_type,
				priority: data.priority,
				merchant_pattern: data.merchant_pattern,
				category_match: data.category_match,
				min_amount: data.min_amount,
				max_amount: data.max_amount,
				split_percentage: data.split_percentage,
				apply_to_existing_transactions: data.apply_to_existing_transactions,
				created_by: authResult.user.id,
				is_active: true,
			})
			.select()
			.single();

		if (insertError) {
			console.error("Error creating rule:", insertError);
			return NextResponse.json(
				{ error: "Failed to create rule" },
				{ status: 500 },
			);
		}

		// Return the created rule with conflict warnings
		return NextResponse.json(
			{
				rule: newRule,
				warnings:
					conflicts.length > 0
						? {
								conflicts: conflicts,
								message:
									"This rule may conflict with existing rules based on priority",
							}
						: undefined,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Error in POST /api/households/[id]/rules:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

/**
 * Check for potentially conflicting rules
 */
async function checkRuleConflicts(
	supabase: any,
	householdId: string,
	newRule: any,
): Promise<Array<{ rule_id: string; rule_name: string; reason: string }>> {
	const conflicts: Array<{
		rule_id: string;
		rule_name: string;
		reason: string;
	}> = [];

	// Get existing active rules of the same type
	const { data: existingRules } = await supabase
		.from("expense_splitting_rules")
		.select(
			"id, rule_name, rule_type, merchant_pattern, category_match, min_amount, max_amount, priority",
		)
		.eq("household_id", householdId)
		.eq("is_active", true)
		.eq("rule_type", newRule.rule_type);

	if (!existingRules || existingRules.length === 0) {
		return conflicts;
	}

	for (const existing of existingRules) {
		// Check for overlapping merchant patterns
		if (
			newRule.rule_type === "merchant" &&
			existing.merchant_pattern &&
			newRule.merchant_pattern
		) {
			// Simple check: if patterns are substrings of each other
			if (
				existing.merchant_pattern.includes(newRule.merchant_pattern) ||
				newRule.merchant_pattern.includes(existing.merchant_pattern)
			) {
				conflicts.push({
					rule_id: existing.id,
					rule_name: existing.rule_name,
					reason: `Overlapping merchant pattern with "${existing.rule_name}". Priority ${existing.priority} vs ${newRule.priority}.`,
				});
			}
		}

		// Check for same category
		if (
			newRule.rule_type === "category" &&
			existing.category_match === newRule.category_match
		) {
			conflicts.push({
				rule_id: existing.id,
				rule_name: existing.rule_name,
				reason: `Same category "${newRule.category_match}" as "${existing.rule_name}". Priority ${existing.priority} vs ${newRule.priority}.`,
			});
		}

		// Check for overlapping amount ranges
		if (newRule.rule_type === "amount_threshold") {
			const existingMin = existing.min_amount || 0;
			const existingMax = existing.max_amount || Number.MAX_VALUE;
			const newMin = newRule.min_amount || 0;
			const newMax = newRule.max_amount || Number.MAX_VALUE;

			if (
				(newMin >= existingMin && newMin <= existingMax) ||
				(newMax >= existingMin && newMax <= existingMax) ||
				(existingMin >= newMin && existingMin <= newMax)
			) {
				conflicts.push({
					rule_id: existing.id,
					rule_name: existing.rule_name,
					reason: `Overlapping amount range with "${existing.rule_name}". Priority ${existing.priority} vs ${newRule.priority}.`,
				});
			}
		}
	}

	return conflicts;
}
