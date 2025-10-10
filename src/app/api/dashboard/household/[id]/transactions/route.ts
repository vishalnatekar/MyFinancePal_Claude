import { config } from "@/lib/config";
import type { SharedTransactionWithOwner } from "@/types/transaction";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: { id: string } },
) {
	try {
		const cookieStore = await cookies();
		const supabase = createServerClient(
			config.supabase.url,
			config.supabase.anonKey,
			{
				cookies: {
					getAll() {
						return cookieStore.getAll();
					},
					setAll(cookiesToSet) {
						try {
							for (const { name, value, options } of cookiesToSet) {
								cookieStore.set(name, value, options);
							}
						} catch {
							// Server component - ignore
						}
					},
				},
			},
		);

		// Service role client for bypassing RLS when fetching account/profile info
		const supabaseAdmin = createServerClient(
			config.supabase.url,
			config.supabase.serviceRoleKey,
			{
				cookies: {
					getAll() {
						return cookieStore.getAll();
					},
					setAll(cookiesToSet) {
						try {
							for (const { name, value, options } of cookiesToSet) {
								cookieStore.set(name, value, options);
							}
						} catch {
							// Server component - ignore
						}
					},
				},
			},
		);

		const householdId = params.id;

		// Authenticate user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Verify user is a member of the household
		const { data: membership, error: membershipError } = await supabase
			.from("household_members")
			.select("id")
			.eq("household_id", householdId)
			.eq("user_id", user.id)
			.single();

		if (membershipError || !membership) {
			return NextResponse.json(
				{ error: "You are not a member of this household" },
				{ status: 403 },
			);
		}

		// Parse query parameters for pagination
		const { searchParams } = new URL(request.url);
		const page = Number.parseInt(searchParams.get("page") || "1", 10);
		const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
		const offset = (page - 1) * limit;

		// Fetch shared transactions
		const { data, error } = await supabase
			.from("transactions")
			.select("*")
			.eq("shared_with_household_id", householdId)
			.eq("is_shared_expense", true)
			.order("date", { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) {
			console.error("Error fetching household transactions:", error);
			return NextResponse.json(
				{ error: "Failed to fetch household transactions" },
				{ status: 500 },
			);
		}

		if (!data || data.length === 0) {
			// No transactions shared with this household
			return NextResponse.json({
				transactions: [],
				total_count: 0,
				page,
				limit,
				has_more: false,
			});
		}

		// Get unique account IDs from the transactions
		const accountIds = [
			...new Set(data.map((t: any) => t.account_id).filter(Boolean)),
		];

		// Fetch financial accounts to get user IDs (using admin client to bypass RLS)
		const { data: accounts } = await supabaseAdmin
			.from("financial_accounts")
			.select("id, user_id")
			.in("id", accountIds);

		const accountMap = new Map(accounts?.map((a) => [a.id, a.user_id]) || []);

		// Get unique user IDs
		const userIds = [...new Set(Array.from(accountMap.values()))];

		// Fetch profiles for all unique users (using admin client to bypass RLS)
		const { data: profiles, error: profilesError } = await supabaseAdmin
			.from("profiles")
			.select("id, email, full_name")
			.in("id", userIds);

		if (profilesError) {
			console.error("Error fetching profiles:", profilesError);
			// Continue anyway - we'll just show "Unknown" for owners
		}

		// Create a map of user_id to profile
		const profileMap = new Map(
			profiles?.map((p) => [p.id, p]) || [],
		);

		// Transform data to include owner information
		const transactionsWithOwner: SharedTransactionWithOwner[] = data.map(
			(transaction: any) => {
				const userId = accountMap.get(transaction.account_id);
				const profile = profileMap.get(userId);

				return {
					...transaction,
					owner_name: profile?.full_name || profile?.email || "Unknown",
					owner_email: profile?.email || "",
				};
			},
		);

		// Get total count for pagination
		const { count, error: countError } = await supabase
			.from("transactions")
			.select("id", { count: "exact", head: true })
			.eq("shared_with_household_id", householdId)
			.eq("is_shared_expense", true);

		if (countError) {
			console.error("Error counting household transactions:", countError);
		}

		return NextResponse.json({
			transactions: transactionsWithOwner,
			total_count: count || 0,
			page,
			limit,
			has_more: (count || 0) > offset + limit,
		});
	} catch (error) {
		console.error(
			"Error in GET /api/dashboard/household/[id]/transactions:",
			error,
		);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
