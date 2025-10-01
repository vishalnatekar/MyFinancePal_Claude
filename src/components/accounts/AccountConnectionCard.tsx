"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
	AccountConnectionStatus,
	FinancialAccount,
} from "@/types/account";
import {
	AlertTriangle,
	Building2,
	CheckCircle,
	Clock,
	CreditCard,
	Loader2,
	MoreVertical,
	RefreshCw,
	Trash2,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { useState } from "react";

interface AccountConnectionCardProps {
	account: FinancialAccount;
	onSync?: (accountId: string) => Promise<void>;
	onDelete?: (accountId: string) => Promise<void>;
	onReconnect?: (accountId: string) => Promise<void>;
}

export function AccountConnectionCard({
	account,
	onSync,
	onDelete,
	onReconnect,
}: AccountConnectionCardProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [operation, setOperation] = useState<
		"sync" | "delete" | "reconnect" | null
	>(null);

	const getAccountTypeIcon = (type: string) => {
		switch (type) {
			case "checking":
				return <CreditCard className="h-5 w-5" />;
			case "savings":
				return <Wallet className="h-5 w-5" />;
			case "investment":
				return <TrendingUp className="h-5 w-5" />;
			case "credit":
				return <CreditCard className="h-5 w-5" />;
			default:
				return <Building2 className="h-5 w-5" />;
		}
	};

	const getStatusBadge = (status?: string, isManual?: boolean) => {
		if (isManual) {
			return <Badge variant="secondary">Manual</Badge>;
		}

		switch (status) {
			case "active":
				return (
					<Badge variant="default" className="bg-green-500 hover:bg-green-600">
						<CheckCircle className="h-3 w-3 mr-1" />
						Connected
					</Badge>
				);
			case "expired":
				return (
					<Badge variant="destructive">
						<AlertTriangle className="h-3 w-3 mr-1" />
						Expired
					</Badge>
				);
			case "failed":
				return (
					<Badge variant="destructive">
						<AlertTriangle className="h-3 w-3 mr-1" />
						Failed
					</Badge>
				);
			default:
				return (
					<Badge variant="outline">
						<Clock className="h-3 w-3 mr-1" />
						Unknown
					</Badge>
				);
		}
	};

	const getLastSyncedText = (lastSynced?: string) => {
		if (!lastSynced) return "Never synced";

		const date = new Date(lastSynced);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins} minutes ago`;
		if (diffHours < 24) return `${diffHours} hours ago`;
		if (diffDays === 1) return "Yesterday";
		return `${diffDays} days ago`;
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-GB", {
			style: "currency",
			currency: "GBP",
		}).format(amount);
	};

	const handleSync = async () => {
		if (!onSync || account.is_manual) return;

		try {
			setIsLoading(true);
			setOperation("sync");
			await onSync(account.id);
		} catch (error) {
			console.error("Sync error:", error);
		} finally {
			setIsLoading(false);
			setOperation(null);
		}
	};

	const handleDelete = async () => {
		if (!onDelete) return;

		try {
			setIsLoading(true);
			setOperation("delete");
			await onDelete(account.id);
		} catch (error) {
			console.error("Delete error:", error);
		} finally {
			setIsLoading(false);
			setOperation(null);
		}
	};

	const handleReconnect = async () => {
		if (!onReconnect || account.is_manual) return;

		try {
			setIsLoading(true);
			setOperation("reconnect");
			await onReconnect(account.id);
		} catch (error) {
			console.error("Reconnect error:", error);
		} finally {
			setIsLoading(false);
			setOperation(null);
		}
	};

	const canSync = !account.is_manual && account.connection_status === "active";
	const needsReconnection =
		!account.is_manual &&
		(account.connection_status === "expired" ||
			account.connection_status === "failed");

	return (
		<Card className="w-full">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<div className="flex items-center space-x-2">
					{getAccountTypeIcon(account.account_type)}
					<div>
						<CardTitle className="text-lg">{account.account_name}</CardTitle>
						<CardDescription>{account.institution_name}</CardDescription>
					</div>
				</div>
				<div className="flex items-center space-x-2">
					{getStatusBadge(account.connection_status, account.is_manual)}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" disabled={isLoading}>
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{canSync && (
								<DropdownMenuItem onClick={handleSync} disabled={isLoading}>
									{isLoading && operation === "sync" ? (
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									) : (
										<RefreshCw className="h-4 w-4 mr-2" />
									)}
									Sync Now
								</DropdownMenuItem>
							)}
							{needsReconnection && (
								<DropdownMenuItem
									onClick={handleReconnect}
									disabled={isLoading}
								>
									{isLoading && operation === "reconnect" ? (
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									) : (
										<RefreshCw className="h-4 w-4 mr-2" />
									)}
									Reconnect
								</DropdownMenuItem>
							)}
							<DropdownMenuSeparator />
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<DropdownMenuItem
										onSelect={(e) => e.preventDefault()}
										className="text-destructive focus:text-destructive"
									>
										<Trash2 className="h-4 w-4 mr-2" />
										Delete Account
									</DropdownMenuItem>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete Account</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to delete "{account.account_name}"?
											This action cannot be undone and will remove all
											associated data.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleDelete}
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										>
											{isLoading && operation === "delete" ? (
												<>
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													Deleting...
												</>
											) : (
												"Delete Account"
											)}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex justify-between items-end">
					<div>
						<p className="text-2xl font-bold">
							{formatCurrency(account.current_balance)}
						</p>
						<p className="text-sm text-muted-foreground">
							Last updated: {getLastSyncedText(account.last_synced)}
						</p>
					</div>
					{account.is_shared && <Badge variant="outline">Shared</Badge>}
				</div>
				{needsReconnection && (
					<div className="mt-3 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
						<p className="text-sm text-yellow-800 dark:text-yellow-200">
							This account needs to be reconnected. Click "Reconnect" above to
							restore the connection.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
