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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccountManagement } from "@/hooks/use-account-management";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useHouseholds } from "@/hooks/use-households";
import { createClient } from "@/lib/supabase";
import { AlertCircle, Info, Plus } from "lucide-react";
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
		<div className="space-y-8">
			<Breadcrumb />
			<WelcomeCard />

			{error && (
				<Alert variant="destructive" className="border-destructive/40">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle className="text-base font-semibold">
						We hit a snag loading your dashboard
					</AlertTitle>
					<AlertDescription className="text-sm text-destructive">
						{error}
					</AlertDescription>
				</Alert>
			)}
			{!loading && accounts.length === 0 && !error && (
				<Alert className="border-border/70 bg-background/80">
					<Info className="h-4 w-4 text-primary" />
					<AlertTitle className="text-base font-semibold text-foreground">
						No accounts are connected yet
					</AlertTitle>
					<AlertDescription>
						Connect your first bank or investment account to unlock insights
						across the dashboard.
					</AlertDescription>
				</Alert>
			)}

			<Tabs defaultValue="finances" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="finances" className="gap-2 text-sm">
						My Finances
					</TabsTrigger>
					<TabsTrigger value="household" className="gap-2 text-sm">
						Household
					</TabsTrigger>
				</TabsList>

				<TabsContent value="finances" className="space-y-8">
					{hasAccounts ? (
						<div className="space-y-8">
							<div className="w-full">
								<NetWorthSummaryCard
									netWorth={netWorth}
									loading={loading}
									error={error || undefined}
									onRetry={refetchAll}
								/>
							</div>

							<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:gap-8">
								<AccountBreakdownCard accounts={accounts} loading={loading} />
								<AssetCategoryChart
									assets={netWorth?.asset_breakdown}
									loading={loading}
								/>
							</div>

							<div className="w-full">
								<NetWorthTrendChart
									history={history}
									loading={loading}
									onDateRangeChange={updateDateRange}
								/>
							</div>

							<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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

							<div className="w-full lg:max-w-md">
								<DataExportCard accountIds={accounts.map((a) => a.id)} />
							</div>
						</div>
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

				<TabsContent value="household" className="space-y-8">
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
