import { withHouseholdAuth } from "@/lib/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase";
import type {
	HouseholdActivityEvent,
	HouseholdDashboardData,
	HouseholdMemberWithStats,
	SharedAccountWithOwner,
	SharedTransactionWithOwner,
	UserProfile,
} from "@/types/household";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Database types for queries
 */
interface HouseholdMemberRow {
	id: string;
	user_id: string;
	role: string;
	joined_at: string;
}

interface FinancialAccountRow {
	id: string;
	user_id: string;
	account_type: string;
	account_name: string;
	institution_name: string;
	current_balance: number;
	currency: string;
	last_synced: string | null;
	is_manual: boolean;
}

interface TransactionRow {
	id: string;
	account_id: string;
	amount: number;
	merchant_name: string | null;
	description: string | null;
	category: string | null;
	date: string;
	shared_at: string | null;
	shared_by: string | null;
	financial_accounts: { user_id: string };
}

/**
 * GET /api/dashboard/household/[id]
 * Retrieve comprehensive household dashboard data including:
 * - Household details
 * - Member statistics with contribution totals
 * - Shared accounts with ownership labels
 * - Recent shared transactions
 * - Activity feed for household events
 * - Shared net worth calculation
 */
export const GET = withHouseholdAuth(
	async (request: NextRequest, user: User, householdId: string) => {
		try {
			// Fetch household details
			const { data: household, error: householdError } = await supabaseAdmin
				.from("households")
				.select("id, name, description, settlement_day")
				.eq("id", householdId)
				.single();

			if (householdError || !household) {
				console.error("Error fetching household:", householdError);
				return NextResponse.json(
					{ error: "Household not found" },
					{ status: 404 },
				);
			}

			// Fetch household members
			const { data: members, error: membersError } = await supabaseAdmin
				.from("household_members")
				.select("id, user_id, role, joined_at")
				.eq("household_id", householdId);

			if (membersError) {
				console.error("Error fetching household members:", membersError);
				return NextResponse.json(
					{ error: "Failed to fetch household members" },
					{ status: 500 },
				);
			}

			const memberIds = members?.map((m) => m.user_id) || [];

			// Fetch user profiles for all household members (single query, no duplication)
			let userProfiles: Record<string, UserProfile> = {};
			if (memberIds.length > 0) {
				// Try to fetch from profiles table, fallback to auth metadata if it doesn't exist
				const { data: profilesData, error: profilesError } = await supabaseAdmin
					.from("profiles")
					.select("id, email, full_name, avatar_url")
					.in("id", memberIds);

				if (!profilesError && profilesData) {
					userProfiles = profilesData.reduce(
						(acc, profile) => {
							acc[profile.id] = profile;
							return acc;
						},
						{} as Record<string, UserProfile>,
					);
				} else {
					// If profiles table doesn't exist or query fails, fetch from auth.users
					for (const userId of memberIds) {
						const { data: userData } =
							await supabaseAdmin.auth.admin.getUserById(userId);
						if (userData.user) {
							userProfiles[userId] = {
								id: userId,
								email: userData.user.email,
								full_name:
									userData.user.user_metadata?.full_name || userData.user.email,
								avatar_url: userData.user.user_metadata?.avatar_url,
							};
						}
					}
				}
			}

			// Fetch all financial accounts for household members
			// Note: In the future, add sharing_level and shared_households fields for granular control
			const { data: allAccounts, error: accountsError } = await supabaseAdmin
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
            last_synced,
            is_manual
          `,
				)
				.in("user_id", memberIds);

			if (accountsError) {
				console.error("Error fetching accounts:", accountsError);
				return NextResponse.json(
					{ error: "Failed to fetch accounts" },
					{ status: 500 },
				);
			}

			// For now, all accounts of household members are considered "shared"
			const sharedAccounts =
				(allAccounts as FinancialAccountRow[] | null) || [];

			// Build shared accounts with owner information (reuse userProfiles)
			const sharedAccountsWithOwners: SharedAccountWithOwner[] =
				sharedAccounts.map((account) => ({
					id: account.id,
					account_name: account.account_name,
					account_type: account.account_type,
					institution_name: account.institution_name,
					current_balance: account.current_balance || 0,
					currency: account.currency || "GBP",
					last_synced: account.last_synced || undefined,
					owner_id: account.user_id,
					owner_name: userProfiles[account.user_id]?.full_name || "Unknown",
					owner_avatar: userProfiles[account.user_id]?.avatar_url,
					sharing_level: "full", // Default to full for now
				}));

			// Calculate shared net worth (sum of all shared account balances)
			const sharedNetWorth = sharedAccountsWithOwners.reduce(
				(sum, acc) => sum + acc.current_balance,
				0,
			);

			// Fetch ONLY transactions explicitly shared with THIS household
			// NOT all transactions from household members' accounts
			let recentTransactions: SharedTransactionWithOwner[] = [];
			const { data: txData, error: txError } = await supabaseAdmin
				.from("transactions")
				.select(
					`
              id,
              account_id,
              amount,
              merchant_name,
              description,
              category,
              date,
              shared_at,
              shared_by,
              financial_accounts!inner(user_id)
            `,
				)
				.eq("is_shared_expense", true)
				.eq("shared_with_household_id", householdId)
				.order("date", { ascending: false })
				.limit(50);

			if (txError) {
				console.error("Error fetching shared transactions:", txError);
			} else if (txData) {
				// Transform transactions with owner info (reuse userProfiles)
				recentTransactions = (txData as TransactionRow[]).map((tx) => ({
					id: tx.id,
					amount: tx.amount,
					merchant_name:
						tx.merchant_name || tx.description || "Unknown Merchant",
					category: tx.category || "other",
					date: tx.date,
					shared_at: tx.shared_at || tx.date,
					owner_id: tx.financial_accounts.user_id,
					owner_name:
						userProfiles[tx.financial_accounts.user_id]?.full_name || "Unknown",
					owner_avatar: userProfiles[tx.financial_accounts.user_id]?.avatar_url,
					account_id: tx.account_id,
				}));
			}

			// Calculate member statistics with contributions
			const membersWithStats: HouseholdMemberWithStats[] =
				(members as HouseholdMemberRow[] | null)?.map((member) => {
					const profile = userProfiles[member.user_id] || {};
					const memberAccounts = sharedAccountsWithOwners.filter(
						(acc) => acc.owner_id === member.user_id,
					);
					const memberTransactions = recentTransactions.filter(
						(tx) => tx.owner_id === member.user_id,
					);
					const totalContribution = memberTransactions.reduce(
						(sum, tx) => sum + Math.abs(tx.amount),
						0,
					);

					return {
						id: member.id,
						user_id: member.user_id,
						name: profile.full_name || profile.email || "Unknown",
						email: profile.email || "",
						avatar_url: profile.avatar_url,
						role: member.role,
						joined_at: member.joined_at,
						shared_accounts_count: memberAccounts.length,
						shared_transactions_count: memberTransactions.length,
						total_contribution: totalContribution,
					};
				}) || [];

			// Build activity feed from household events
			const activityFeed: HouseholdActivityEvent[] = [];

			// Add member joined events (use for...of instead of forEach)
			if (members) {
				for (const member of members as HouseholdMemberRow[]) {
					const profile = userProfiles[member.user_id] || {};
					activityFeed.push({
						id: `member_joined_${member.id}`,
						type: "member_joined",
						description: `${profile.full_name || "Member"} joined the household`,
						actor_id: member.user_id,
						actor_name: profile.full_name || profile.email || "Unknown",
						timestamp: member.joined_at,
					});
				}
			}

			// Add transaction shared events (recent 30 days, use for...of instead of forEach)
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
			const recentActivityTx = recentTransactions.filter(
				(tx) => new Date(tx.shared_at) >= thirtyDaysAgo,
			);

			for (const tx of recentActivityTx) {
				const isLarge = Math.abs(tx.amount) > 100;
				activityFeed.push({
					id: `transaction_${tx.id}`,
					type: isLarge ? "large_transaction" : "transaction_shared",
					description: isLarge
						? `${tx.owner_name} shared large expense: £${Math.abs(tx.amount).toFixed(2)} at ${tx.merchant_name}`
						: `${tx.owner_name} shared £${Math.abs(tx.amount).toFixed(2)} at ${tx.merchant_name}`,
					actor_id: tx.owner_id,
					actor_name: tx.owner_name,
					timestamp: tx.shared_at,
					metadata: {
						amount: tx.amount,
						merchant: tx.merchant_name,
					},
				});
			}

			// Sort activity feed by timestamp (most recent first)
			activityFeed.sort(
				(a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
			);

			// Get most recent sync time
			const sortedBySyncTime = sharedAccountsWithOwners
				.filter((acc) => acc.last_synced)
				.sort(
					(a, b) =>
						new Date(b.last_synced as string).getTime() -
						new Date(a.last_synced as string).getTime(),
				);
			const lastSync =
				sortedBySyncTime[0]?.last_synced || new Date().toISOString();

			// Build comprehensive dashboard response
			const dashboardData: HouseholdDashboardData = {
				household: {
					id: household.id,
					name: household.name,
					description: household.description || undefined,
					settlement_day: household.settlement_day || 1,
				},
				members: membersWithStats,
				shared_net_worth: sharedNetWorth,
				shared_accounts: sharedAccountsWithOwners,
				recent_shared_transactions: recentTransactions,
				activity_feed: activityFeed.slice(0, 50), // Limit to 50 most recent events
				last_sync: lastSync,
			};

			return NextResponse.json(dashboardData);
		} catch (error) {
			console.error("Error in GET /api/dashboard/household/[id]:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);
