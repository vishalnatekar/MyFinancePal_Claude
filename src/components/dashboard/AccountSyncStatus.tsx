"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { useState } from "react";

export interface AccountSync {
	accountId: string;
	accountName: string;
	lastSynced: string | null;
	nextSync: string | null;
	status: "active" | "syncing" | "error" | "pending";
	error?: string;
}

interface AccountSyncStatusProps {
	accounts: AccountSync[];
	onRefresh: (accountId: string) => Promise<void>;
	loading?: boolean;
}

export function AccountSyncStatus({
	accounts,
	onRefresh,
	loading = false,
}: AccountSyncStatusProps) {
	const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});

	const handleRefresh = async (accountId: string) => {
		setRefreshing((prev) => ({ ...prev, [accountId]: true }));
		try {
			await onRefresh(accountId);
		} finally {
			setRefreshing((prev) => ({ ...prev, [accountId]: false }));
		}
	};

	const getStatusIcon = (status: AccountSync["status"]) => {
		switch (status) {
			case "active":
				return <CheckCircle2 className="h-4 w-4 text-green-600" />;
			case "syncing":
				return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
			case "error":
				return <AlertCircle className="h-4 w-4 text-red-600" />;
			case "pending":
				return <Clock className="h-4 w-4 text-yellow-600" />;
		}
	};

	const getStatusBadge = (status: AccountSync["status"]) => {
		const variants: Record<
			AccountSync["status"],
			"default" | "secondary" | "destructive" | "outline"
		> = {
			active: "default",
			syncing: "secondary",
			error: "destructive",
			pending: "outline",
		};

		return (
			<Badge variant={variants[status]} className="capitalize">
				{status}
			</Badge>
		);
	};

	const formatLastSynced = (lastSynced: string | null) => {
		if (!lastSynced) return "Never synced";
		try {
			return formatDistanceToNow(new Date(lastSynced), { addSuffix: true });
		} catch {
			return "Invalid date";
		}
	};

	const formatNextSync = (nextSync: string | null) => {
		if (!nextSync) return "Not scheduled";
		try {
			return formatDistanceToNow(new Date(nextSync), { addSuffix: true });
		} catch {
			return "Invalid date";
		}
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Account Sync Status</CardTitle>
					<CardDescription>Loading sync information...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="flex items-center justify-between p-4 border rounded-lg animate-pulse"
							>
								<div className="space-y-2 flex-1">
									<div className="h-4 bg-gray-200 rounded w-1/3"></div>
									<div className="h-3 bg-gray-200 rounded w-1/2"></div>
								</div>
								<div className="h-8 w-20 bg-gray-200 rounded"></div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Account Sync Status</CardTitle>
				<CardDescription>
					Monitor and manage your account synchronization
				</CardDescription>
			</CardHeader>
			<CardContent>
				{accounts.length === 0 ? (
					<p className="text-sm text-muted-foreground text-center py-8">
						No accounts to display
					</p>
				) : (
					<div className="space-y-4">
						{accounts.map((account) => (
							<div
								key={account.accountId}
								className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
							>
								<div className="flex items-center gap-3 flex-1">
									{getStatusIcon(account.status)}
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<h4 className="font-medium text-sm">
												{account.accountName}
											</h4>
											{getStatusBadge(account.status)}
										</div>
										<div className="flex flex-col sm:flex-row sm:gap-4 text-xs text-muted-foreground mt-1">
											<span>
												Last synced: {formatLastSynced(account.lastSynced)}
											</span>
											{account.status === "active" && account.nextSync && (
												<span>
													Next sync: {formatNextSync(account.nextSync)}
												</span>
											)}
										</div>
										{account.error && (
											<p className="text-xs text-red-600 mt-1">
												{account.error}
											</p>
										)}
									</div>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleRefresh(account.accountId)}
									disabled={
										refreshing[account.accountId] ||
										account.status === "syncing"
									}
								>
									<RefreshCw
										className={`h-4 w-4 mr-2 ${refreshing[account.accountId] ? "animate-spin" : ""}`}
									/>
									Sync Now
								</Button>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
