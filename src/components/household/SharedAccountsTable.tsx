"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency-utils";
import type { SharedAccountWithOwner } from "@/types/household";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock, RefreshCw, XCircle } from "lucide-react";

interface SharedAccountsTableProps {
	accounts: SharedAccountWithOwner[];
	onRefreshAll?: () => void;
	isRefreshing?: boolean;
}

export function SharedAccountsTable({
	accounts,
	onRefreshAll,
	isRefreshing = false,
}: SharedAccountsTableProps) {
	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const getSyncStatusIcon = (lastSynced?: string) => {
		if (isRefreshing) {
			return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
		}

		if (!lastSynced) {
			return <Clock className="h-4 w-4 text-gray-400" />;
		}

		const syncDate = new Date(lastSynced);
		const hoursSinceSync = (Date.now() - syncDate.getTime()) / (1000 * 60 * 60);

		if (hoursSinceSync < 24) {
			return <CheckCircle2 className="h-4 w-4 text-green-500" />;
		}

		return <Clock className="h-4 w-4 text-orange-400" />;
	};

	const getSyncStatusText = (lastSynced?: string) => {
		if (isRefreshing) {
			return "Syncing...";
		}

		if (!lastSynced) {
			return "Not synced yet";
		}

		try {
			return `Synced ${formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}`;
		} catch {
			return "Unknown";
		}
	};

	const getAccountTypeColor = (type: string) => {
		switch (type) {
			case "checking":
				return "default";
			case "savings":
				return "secondary";
			case "investment":
				return "outline";
			case "credit":
				return "destructive";
			case "loan":
				return "destructive";
			default:
				return "default";
		}
	};

	// Group accounts by owner
	const accountsByOwner = accounts.reduce(
		(acc, account) => {
			const ownerId = account.owner_id;
			if (!acc[ownerId]) {
				acc[ownerId] = {
					owner_name: account.owner_name,
					owner_avatar: account.owner_avatar,
					accounts: [],
				};
			}
			acc[ownerId].accounts.push(account);
			return acc;
		},
		{} as Record<
			string,
			{
				owner_name: string;
				owner_avatar?: string;
				accounts: SharedAccountWithOwner[];
			}
		>,
	);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">Shared Accounts</h3>
				{onRefreshAll && (
					<Button
						onClick={onRefreshAll}
						disabled={isRefreshing}
						variant="outline"
						size="sm"
					>
						<RefreshCw
							className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
						/>
						Refresh All
					</Button>
				)}
			</div>

			<div className="border rounded-lg">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Owner</TableHead>
							<TableHead>Account</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Institution</TableHead>
							<TableHead className="text-right">Balance</TableHead>
							<TableHead>Sync Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{Object.entries(accountsByOwner).map(([ownerId, ownerData]) =>
							ownerData.accounts.map((account, idx) => (
								<TableRow key={account.id}>
									<TableCell>
										{idx === 0 ? (
											<div className="flex items-center gap-2">
												<Avatar className="h-8 w-8">
													<AvatarImage
														src={ownerData.owner_avatar}
														alt={ownerData.owner_name}
													/>
													<AvatarFallback>
														{getInitials(ownerData.owner_name)}
													</AvatarFallback>
												</Avatar>
												<span className="font-medium">
													{ownerData.owner_name}
												</span>
											</div>
										) : null}
									</TableCell>
									<TableCell className="font-medium">
										{account.account_name}
									</TableCell>
									<TableCell>
										<Badge variant={getAccountTypeColor(account.account_type)}>
											{account.account_type}
										</Badge>
									</TableCell>
									<TableCell>{account.institution_name}</TableCell>
									<TableCell className="text-right font-medium">
										{formatCurrency(account.current_balance)}
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											{getSyncStatusIcon(account.last_synced)}
											<span className="text-sm text-muted-foreground">
												{getSyncStatusText(account.last_synced)}
											</span>
										</div>
									</TableCell>
								</TableRow>
							)),
						)}

						{accounts.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={6}
									className="text-center py-8 text-muted-foreground"
								>
									No shared accounts yet
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
