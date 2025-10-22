"use client";

import { AccountConnectionCard } from "@/components/accounts/AccountConnectionCard";
import { ConnectAccountButton } from "@/components/accounts/ConnectAccountButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccounts } from "@/hooks/use-accounts";
import {
	AlertCircle,
	Building2,
	CheckCircle,
	CreditCard,
	RefreshCw,
	Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function AccountsPage() {
	const { accounts, isLoading, error, refetch, syncAccount, deleteAccount } =
		useAccounts();
	const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null);

	// Handle URL parameters (success/error messages from OAuth callback)
	useEffect(() => {
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			setUrlParams(params);

			// If account connection was successful, refetch accounts to show new data
			if (params.has("success")) {
				console.log("Account connected successfully, refetching accounts...");
				refetch();
			}

			// Clear URL parameters after showing messages
			if (params.has("success") || params.has("error")) {
				const timer = setTimeout(() => {
					window.history.replaceState({}, "", window.location.pathname);
				}, 5000); // Clear after 5 seconds

				return () => clearTimeout(timer);
			}
		}
	}, [refetch]);

	const handleSync = async (accountId: string) => {
		try {
			await syncAccount(accountId);
		} catch (error) {
			console.error("Sync failed:", error);
			// Error is already handled in the hook
		}
	};

	const handleDelete = async (accountId: string) => {
		try {
			await deleteAccount(accountId);
		} catch (error) {
			console.error("Delete failed:", error);
			// Error is already handled in the hook
		}
	};

	const handleReconnect = async (accountId: string) => {
		// For now, this would redirect to the connection flow
		// In a full implementation, you'd store the provider ID and redirect appropriately
		console.log("Reconnect account:", accountId);
		// window.location.href = "/accounts/connect";
	};

	const connectedAccounts = accounts.filter((account) => !account.is_manual);
	const manualAccounts = accounts.filter((account) => account.is_manual);
	const totalBalance = accounts.reduce(
		(sum, account) => sum + account.current_balance,
		0,
	);

	const getAccountStatusSummary = () => {
		const active = accounts.filter(
			(acc) => acc.connection_status === "active" && !acc.is_manual,
		).length;
		const expired = accounts.filter(
			(acc) => acc.connection_status === "expired",
		).length;
		const failed = accounts.filter(
			(acc) => acc.connection_status === "failed",
		).length;
		const manual = accounts.filter((acc) => acc.is_manual).length;

		return { active, expired, failed, manual, total: accounts.length };
	};

	const statusSummary = getAccountStatusSummary();

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
				<LoadingSpinner size="lg" />
				<p className="text-muted-foreground">Loading your accounts...</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex justify-between items-start">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
					<p className="text-muted-foreground mt-1">
						Manage your bank accounts and financial connections
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<Button variant="outline" onClick={refetch} disabled={isLoading}>
						<RefreshCw className="h-4 w-4 mr-2" />
						Refresh
					</Button>
					<ConnectAccountButton />
				</div>
			</div>

			{/* URL Parameter Messages */}
			{urlParams?.has("success") && (
				<Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
					<CheckCircle className="h-4 w-4 text-green-600" />
					<AlertDescription className="text-green-800 dark:text-green-200">
						{urlParams.get("message") || "Account connected successfully!"}
					</AlertDescription>
				</Alert>
			)}

			{urlParams?.has("error") && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						{urlParams.get("message") ||
							"Failed to connect account. Please try again."}
					</AlertDescription>
				</Alert>
			)}

			{/* Error Display */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Overview Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Balance</CardTitle>
						<Wallet className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{new Intl.NumberFormat("en-GB", {
								style: "currency",
								currency: "GBP",
							}).format(totalBalance)}
						</div>
						<p className="text-xs text-muted-foreground">
							Across {statusSummary.total} account
							{statusSummary.total !== 1 ? "s" : ""}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Connected</CardTitle>
						<CheckCircle className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{statusSummary.active}</div>
						<p className="text-xs text-muted-foreground">Active connections</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Manual</CardTitle>
						<CreditCard className="h-4 w-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{statusSummary.manual}</div>
						<p className="text-xs text-muted-foreground">Manual entries</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Issues</CardTitle>
						<AlertCircle className="h-4 w-4 text-red-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{statusSummary.expired + statusSummary.failed}
						</div>
						<p className="text-xs text-muted-foreground">Need attention</p>
					</CardContent>
				</Card>
			</div>

			{/* Accounts List */}
			{accounts.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<Building2 className="h-16 w-16 text-muted-foreground mb-4" />
						<CardTitle className="text-xl mb-2">
							No Accounts Connected
						</CardTitle>
						<CardDescription className="mb-6 max-w-md">
							Get started by connecting your first bank account or adding a
							manual entry. We'll securely import your financial data to help
							you track your finances.
						</CardDescription>
						<div className="flex items-center space-x-4">
							<ConnectAccountButton />
						</div>
					</CardContent>
				</Card>
			) : (
				<Tabs defaultValue="all" className="space-y-4">
					<TabsList>
						<TabsTrigger value="all">
							All Accounts
							<Badge variant="secondary" className="ml-2">
								{statusSummary.total}
							</Badge>
						</TabsTrigger>
						<TabsTrigger value="connected">
							Connected
							<Badge variant="secondary" className="ml-2">
								{statusSummary.active}
							</Badge>
						</TabsTrigger>
						<TabsTrigger value="manual">
							Manual
							<Badge variant="secondary" className="ml-2">
								{statusSummary.manual}
							</Badge>
						</TabsTrigger>
						{statusSummary.expired + statusSummary.failed > 0 && (
							<TabsTrigger value="issues">
								Issues
								<Badge variant="destructive" className="ml-2">
									{statusSummary.expired + statusSummary.failed}
								</Badge>
							</TabsTrigger>
						)}
					</TabsList>

					<TabsContent value="all" className="space-y-4">
						{accounts.map((account) => (
							<AccountConnectionCard
								key={account.id}
								account={account}
								onSync={handleSync}
								onDelete={handleDelete}
								onReconnect={handleReconnect}
							/>
						))}
					</TabsContent>

					<TabsContent value="connected" className="space-y-4">
						{connectedAccounts.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-muted-foreground">No connected accounts</p>
							</div>
						) : (
							connectedAccounts.map((account) => (
								<AccountConnectionCard
									key={account.id}
									account={account}
									onSync={handleSync}
									onDelete={handleDelete}
									onReconnect={handleReconnect}
								/>
							))
						)}
					</TabsContent>

					<TabsContent value="manual" className="space-y-4">
						{manualAccounts.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-muted-foreground mb-4">No manual accounts</p>
								<ConnectAccountButton variant="outline" />
							</div>
						) : (
							manualAccounts.map((account) => (
								<AccountConnectionCard
									key={account.id}
									account={account}
									onSync={handleSync}
									onDelete={handleDelete}
									onReconnect={handleReconnect}
								/>
							))
						)}
					</TabsContent>

					<TabsContent value="issues" className="space-y-4">
						{accounts
							.filter(
								(acc) =>
									acc.connection_status === "expired" ||
									acc.connection_status === "failed",
							)
							.map((account) => (
								<AccountConnectionCard
									key={account.id}
									account={account}
									onSync={handleSync}
									onDelete={handleDelete}
									onReconnect={handleReconnect}
								/>
							))}
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}
