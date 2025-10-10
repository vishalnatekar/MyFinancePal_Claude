import { withHouseholdAuth } from "@/lib/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/dashboard/household/[id]
 * Retrieve household dashboard data including shared accounts from all members
 * Respects sharing_level: 'balance_only' shows balance but hides transactions, 'full' shows everything
 */
export const GET = withHouseholdAuth(
	async (request: NextRequest, user: User, householdId: string) => {
		try {
			// Fetch household members
			const { data: members, error: membersError } = await supabaseAdmin
				.from("household_members")
				.select("user_id, role, joined_at, profiles(id, email, full_name)")
				.eq("household_id", householdId);

			if (membersError) {
				console.error("Error fetching household members:", membersError);
				return NextResponse.json(
					{ error: "Failed to fetch household members" },
					{ status: 500 },
				);
			}

			// Fetch all financial accounts shared with this household
			// Query using cs (contains) operator for JSONB array
			const { data: allAccounts, error: accountsError } =
				await supabaseAdmin
					.from("financial_accounts")
					.select(
						`
            id,
            user_id,
            account_type,
            account_name,
            institution_name,
            current_balance,
            currency,
            sharing_level,
            shared_households,
            last_synced,
            is_manual
          `,
					)
					.neq("sharing_level", "none");

			if (accountsError) {
				console.error("Error fetching accounts:", accountsError);
				return NextResponse.json(
					{ error: "Failed to fetch accounts" },
					{ status: 500 },
				);
			}

			// Filter accounts that include this household in their shared_households array
			const sharedAccounts = (allAccounts || []).filter((account) => {
				const households = account.shared_households || [];
				return households.includes(householdId);
			});

			// Fetch user profiles for account owners
			const ownerIds = [
				...new Set(sharedAccounts.map((acc) => acc.user_id)),
			];
			let profiles: any = {};

			if (ownerIds.length > 0) {
				const { data: profileData, error: profileError } =
					await supabaseAdmin
						.from("profiles")
						.select("id, full_name, email")
						.in("id", ownerIds);

				if (!profileError && profileData) {
					profiles = profileData.reduce(
						(acc, profile) => {
							acc[profile.id] = profile;
							return acc;
						},
						{} as Record<string, any>,
					);
				}
			}

			// Add profile data to accounts
			const accountsWithProfiles = sharedAccounts.map((account) => ({
				...account,
				profiles: profiles[account.user_id] || null,
			}));

			// For accounts with 'full' sharing, fetch recent transactions
			const fullSharingAccountIds =
				sharedAccounts
					?.filter((acc) => acc.sharing_level === "full")
					.map((acc) => acc.id) || [];

			let transactions = [];
			if (fullSharingAccountIds.length > 0) {
				const { data: txData, error: txError } = await supabaseAdmin
					.from("transactions")
					.select(
						`
              id,
              account_id,
              amount,
              merchant_name,
              category,
              date,
              description,
              currency,
              transaction_type
            `,
					)
					.in("account_id", fullSharingAccountIds)
					.order("date", { ascending: false })
					.limit(100); // Limit to recent 100 transactions

				if (txError) {
					console.error(
						"Error fetching shared transactions:",
						txError,
					);
				} else {
					transactions = txData || [];
				}
			}

			// Calculate household aggregate statistics
			const totalBalance = accountsWithProfiles.reduce(
				(sum, acc) => sum + (acc.current_balance || 0),
				0,
			);

			const accountsByType = accountsWithProfiles.reduce(
				(acc, account) => {
					const type = account.account_type;
					if (!acc[type]) {
						acc[type] = [];
					}
					acc[type].push(account);
					return acc;
				},
				{} as Record<string, typeof accountsWithProfiles>,
			);

			const accountsByMember = accountsWithProfiles.reduce(
				(acc, account) => {
					const userId = account.user_id;
					if (!acc[userId]) {
						acc[userId] = {
							user: account.profiles,
							accounts: [],
							total_balance: 0,
						};
					}
					acc[userId].accounts.push(account);
					acc[userId].total_balance += account.current_balance || 0;
					return acc;
				},
				{} as Record<
					string,
					{
						user: any;
						accounts: typeof accountsWithProfiles;
						total_balance: number;
					}
				>,
			);

			// Return comprehensive household dashboard data
			return NextResponse.json({
				household_id: householdId,
				members,
				shared_accounts: accountsWithProfiles || [],
				transactions,
				statistics: {
					total_balance: totalBalance || 0,
					total_accounts: accountsWithProfiles.length || 0,
					accounts_by_type: accountsByType || {},
					accounts_by_member: accountsByMember || {},
					full_sharing_count:
						accountsWithProfiles.filter(
							(acc) => acc.sharing_level === "full",
						).length || 0,
					balance_only_count:
						accountsWithProfiles.filter(
							(acc) => acc.sharing_level === "balance_only",
						).length || 0,
				},
			});
		} catch (error) {
			console.error(
				"Error in GET /api/dashboard/household/[id]:",
				error,
			);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);
