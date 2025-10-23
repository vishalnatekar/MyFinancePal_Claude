// GET /api/households/[id]/uncategorized
// Story 4.2: Get uncategorized transactions for household

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { findMatchingRule } from "@/services/rule-matching-service";
import { calculateConfidenceScore } from "@/services/auto-categorization-service";
import type { UncategorizedQueueItem } from "@/types/transaction";

export async function GET(
	request: Request,
	{ params }: { params: { id: string } },
) {
	try {
		const supabase = createClient();

		// Authenticate user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const householdId = params.id;

		// Verify user is a household member
		const { data: membership } = await supabase
			.from("user_households")
			.select("id")
			.eq("user_id", user.id)
			.eq("household_id", householdId)
			.single();

		if (!membership) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Parse query parameters
		const { searchParams } = new URL(request.url);
		const minConfidence = Number.parseInt(
			searchParams.get("min_confidence") || "0",
		);
		const maxConfidence = Number.parseInt(
			searchParams.get("max_confidence") || "70",
		);
		const limit = Number.parseInt(searchParams.get("limit") || "50");
		const offset = Number.parseInt(searchParams.get("offset") || "0");

		// Get uncategorized transactions
		// Criteria: confidence_score < 70 OR splitting_rule_id IS NULL
		const { data: transactions, error: fetchError } = await supabase
			.from("transactions")
			.select(
				`
				*,
				financial_accounts!inner(
					household_id
				)
			`,
			)
			.eq("financial_accounts.household_id", householdId)
			.eq("manual_override", false)
			.or(
				`confidence_score.is.null,and(confidence_score.gte.${minConfidence},confidence_score.lte.${maxConfidence})`,
			)
			.order("date", { ascending: false })
			.range(offset, offset + limit - 1);

		if (fetchError) {
			console.error("Failed to fetch uncategorized transactions:", fetchError);
			return NextResponse.json(
				{ error: "Failed to fetch transactions" },
				{ status: 500 },
			);
		}

		// Get household rules for suggestions
		const { data: rules, error: rulesError } = await supabase
			.from("expense_splitting_rules")
			.select("*")
			.eq("household_id", householdId)
			.eq("is_active", true)
			.order("priority");

		if (rulesError) {
			console.error("Failed to fetch rules:", rulesError);
			// Continue without suggestions
		}

		// Build queue items with suggestions
		const queueItems: UncategorizedQueueItem[] = transactions.map((txn) => {
			let suggestedRule = null;
			let suggestedConfidence = null;
			let reason = "No matching rule";

			if (rules && rules.length > 0) {
				const matchedRule = findMatchingRule(txn, rules);
				if (matchedRule) {
					suggestedRule = {
						id: matchedRule.id,
						rule_name: matchedRule.rule_name,
						split_percentage: matchedRule.split_percentage,
					};
					suggestedConfidence = calculateConfidenceScore(txn, matchedRule);
					reason =
						matchedRule.rule_type === "default"
							? "Default rule applied"
							: "Low confidence";
				}
			}

			return {
				transaction: txn,
				suggested_rule: suggestedRule,
				suggested_confidence: suggestedConfidence,
				requires_review_reason: reason,
			};
		});

		// Get total count for pagination
		const { count } = await supabase
			.from("transactions")
			.select("*", { count: "exact", head: true })
			.eq("financial_accounts.household_id", householdId)
			.eq("manual_override", false)
			.or(
				`confidence_score.is.null,and(confidence_score.gte.${minConfidence},confidence_score.lte.${maxConfidence})`,
			);

		return NextResponse.json({
			queue_items: queueItems,
			total: count || 0,
			has_more: (count || 0) > offset + limit,
		});
	} catch (error) {
		console.error("Get uncategorized transactions error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
