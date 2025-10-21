"use client";

import { AccountBreakdownCard } from "@/components/dashboard/AccountBreakdownCard";
import { AccountManagementSection } from "@/components/dashboard/AccountManagementSection";
import { AccountSyncStatus } from "@/components/dashboard/AccountSyncStatus";
import { AssetCategoryChart } from "@/components/dashboard/AssetCategoryChart";
import { DataExportCard } from "@/components/dashboard/DataExportCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { NetWorthSummaryCard } from "@/components/dashboard/NetWorthSummaryCard";
import { NetWorthTrendChart } from "@/components/dashboard/NetWorthTrendChart";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { HouseholdCard } from "@/components/household/HouseholdCard";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccountManagement } from "@/hooks/use-account-management";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useHouseholds } from "@/hooks/use-households";
import { createClient } from "@/lib/supabase";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
	const router = useRouter();
	const {
		netWorth,
		accounts,
		history,
		loading,
		error,
		refetchAll,
		updateDateRange,
	} = useDashboardData();
	const {
		syncStatus,
		managedAccounts,
		loading: accountsLoading,
		handleRefresh,
		handleRemoveAccount,
	} = useAccountManagement();
	const { households, loading: householdsLoading } = useHouseholds();

	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const supabase = useMemo(() => createClient(), []);

	useEffect(() => {
		const fetchUser = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				setCurrentUserId(user.id);
			}
		};
		void fetchUser();
	}, [supabase]);

	const hasAccounts = accounts.length > 0;
	const hasHouseholds = households.length > 0;

	const handleReconnect = (accountId: string) => {
		// Navigate to accounts page - user can reconnect from there
		router.push("/accounts");
	};

	return (
		<div className="space-y-6">
			<Breadcrumb />
			<WelcomeCard />

			{/* Debug Info - Remove after testing */}
			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
					<p className="font-bold">Error loading dashboard:</p>
					<p className="text-sm">{error}</p>
				</div>
			)}
			{!loading && accounts.length === 0 && !error && (
				<div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
					<p className="text-sm">
						Debug: No accounts found. Check console for errors.
					</p>
				</div>
			)}

			<Tabs defaultValue="finances" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="finances">My Finances</TabsTrigger>
					<TabsTrigger value="household">Household</TabsTrigger>
				</TabsList>

				<TabsContent value="finances" className="space-y-6">
					{hasAccounts ? (
						<>
							{/* Net Worth Summary - Full Width */}
							<div className="w-full">
								<NetWorthSummaryCard
									netWorth={netWorth}
									loading={loading}
									error={error || undefined}
									onRetry={refetchAll}
								/>
							</div>

							{/* Dashboard Grid */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<AccountBreakdownCard accounts={accounts} loading={loading} />
								<AssetCategoryChart
									assets={netWorth?.asset_breakdown}
									loading={loading}
								/>
							</div>

							{/* Net Worth Trend - Full Width */}
							<div className="w-full">
								<NetWorthTrendChart
									history={history}
									loading={loading}
									onDateRangeChange={updateDateRange}
								/>
							</div>

							{/* Account Management Grid */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<AccountSyncStatus
									accounts={syncStatus}
									onRefresh={handleRefresh}
									loading={accountsLoading}
								/>
								<AccountManagementSection
									accounts={managedAccounts}
									onRemoveAccount={handleRemoveAccount}
									onReconnect={handleReconnect}
									loading={accountsLoading}
								/>
							</div>

							{/* Data Export - Full Width */}
							<div className="w-full lg:max-w-md">
								<DataExportCard accountIds={accounts.map((a) => a.id)} />
							</div>
						</>
					) : (
						<EmptyState
							icon="💰"
							title="No financial accounts yet"
							description="Connect your bank accounts and start tracking your finances."
							actionText="Add Account"
							actionHref="/accounts"
						/>
					)}
				</TabsContent>

				<TabsContent value="household" className="space-y-6">
					{householdsLoading ? (
						<div className="flex justify-center items-center min-h-[400px]">
							<LoadingSpinner size="lg" />
						</div>
					) : hasHouseholds ? (
						<>
							<div className="flex items-center justify-between">
								<div>
									<h2 className="text-2xl font-bold">Your Households</h2>
									<p className="text-muted-foreground">
										Manage shared expenses and budgets
									</p>
								</div>
								<Link href="/household/create">
									<Button>
										<Plus className="mr-2 h-4 w-4" />
										Create Household
									</Button>
								</Link>
							</div>

							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{households.map((household) => {
									const userMembership = household.household_members?.find(
										(m) => m.user_id === currentUserId,
									);
									const userRole =
										userMembership?.role === "creator" ||
										userMembership?.role === "member"
											? userMembership.role
											: undefined;
									return (
										<HouseholdCard
											key={household.id}
											household={household}
											userRole={userRole}
										/>
									);
								})}
							</div>
						</>
					) : (
						<EmptyState
							icon="🏠"
							title="No household created"
							description="Create or join a household to manage shared expenses with others."
							actionText="Create Household"
							actionHref="/household/create"
						/>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
