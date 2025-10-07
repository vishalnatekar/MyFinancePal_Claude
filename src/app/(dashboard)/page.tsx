'use client';

import { EmptyState } from "@/components/dashboard/EmptyState";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { NetWorthSummaryCard } from "@/components/dashboard/NetWorthSummaryCard";
import { AccountBreakdownCard } from "@/components/dashboard/AccountBreakdownCard";
import { AssetCategoryChart } from "@/components/dashboard/AssetCategoryChart";
import { NetWorthTrendChart } from "@/components/dashboard/NetWorthTrendChart";
import { AccountSyncStatus } from "@/components/dashboard/AccountSyncStatus";
import { AccountManagementSection } from "@/components/dashboard/AccountManagementSection";
import { DataExportCard } from "@/components/dashboard/DataExportCard";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useAccountManagement } from "@/hooks/use-account-management";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
	const router = useRouter();
	const { netWorth, accounts, history, loading, error, refetchAll, updateDateRange } = useDashboardData();
	const { syncStatus, managedAccounts, loading: accountsLoading, handleRefresh, handleRemoveAccount } = useAccountManagement();

	const hasAccounts = accounts.length > 0;

	const handleAddAccount = () => {
		router.push('/accounts?action=connect');
	};

	const handleReconnect = (accountId: string) => {
		router.push(`/accounts/${accountId}/reconnect`);
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
					<p className="text-sm">Debug: No accounts found. Check console for errors.</p>
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
								<AssetCategoryChart assets={netWorth?.asset_breakdown} loading={loading} />
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
									onAddAccount={handleAddAccount}
									onRemoveAccount={handleRemoveAccount}
									onReconnect={handleReconnect}
									loading={accountsLoading}
								/>
							</div>

							{/* Data Export - Full Width */}
							<div className="w-full lg:max-w-md">
								<DataExportCard accountIds={accounts.map(a => a.id)} />
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

				<TabsContent value="household" className="space-y-4">
					<EmptyState
						icon="🏠"
						title="No household created"
						description="Create or join a household to manage shared expenses with others."
						actionText="Create Household"
						actionHref="/household/create"
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
