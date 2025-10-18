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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export interface ManagedAccount {
	id: string;
	accountName: string;
	accountType: string;
	institution: string;
	connectionStatus: "active" | "expired" | "error";
	currentBalance: number;
	currency: string;
}

interface AccountManagementSectionProps {
	accounts: ManagedAccount[];
	onAddAccount: () => void;
	onRemoveAccount: (accountId: string) => Promise<void>;
	onReconnect: (accountId: string) => void;
	loading?: boolean;
}

export function AccountManagementSection({
	accounts,
	onAddAccount,
	onRemoveAccount,
	onReconnect,
	loading = false,
}: AccountManagementSectionProps) {
	const [removingAccount, setRemovingAccount] = useState<string | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const handleRemove = async (accountId: string) => {
		setRemovingAccount(accountId);
		setShowDeleteDialog(true);
	};

	const confirmRemove = async () => {
		if (removingAccount) {
			try {
				await onRemoveAccount(removingAccount);
			} finally {
				setRemovingAccount(null);
				setShowDeleteDialog(false);
			}
		}
	};

	const formatCurrency = (amount: number, currency: string) => {
		return new Intl.NumberFormat("en-GB", {
			style: "currency",
			currency: currency || "GBP",
		}).format(amount);
	};

	const getConnectionStatusColor = (
		status: ManagedAccount["connectionStatus"],
	) => {
		switch (status) {
			case "active":
				return "text-green-600 bg-green-50 border-green-200";
			case "expired":
				return "text-yellow-600 bg-yellow-50 border-yellow-200";
			case "error":
				return "text-red-600 bg-red-50 border-red-200";
		}
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Account Management</CardTitle>
					<CardDescription>Loading accounts...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[1, 2].map((i) => (
							<div key={i} className="p-4 border rounded-lg animate-pulse">
								<div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
								<div className="h-3 bg-gray-200 rounded w-1/3" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Account Management</CardTitle>
							<CardDescription>
								Add or remove connected financial accounts
							</CardDescription>
						</div>
						<Button onClick={onAddAccount} size="sm">
							<Plus className="h-4 w-4 mr-2" />
							Add Account
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{accounts.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-sm text-muted-foreground mb-4">
								No accounts connected yet
							</p>
							<Button onClick={onAddAccount} variant="outline">
								<Plus className="h-4 w-4 mr-2" />
								Connect Your First Account
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							{accounts.map((account) => (
								<div
									key={account.id}
									className={`p-4 border rounded-lg ${
										account.connectionStatus !== "active" ? "bg-accent/20" : ""
									}`}
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<h4 className="font-medium">{account.accountName}</h4>
												<span
													className={`text-xs px-2 py-1 rounded-full border ${getConnectionStatusColor(
														account.connectionStatus,
													)}`}
												>
													{account.connectionStatus}
												</span>
											</div>
											<p className="text-sm text-muted-foreground mb-1">
												{account.institution} • {account.accountType}
											</p>
											<p className="text-sm font-medium">
												Balance:{" "}
												{formatCurrency(
													account.currentBalance,
													account.currency,
												)}
											</p>

											{account.connectionStatus === "expired" && (
												<div className="mt-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => onReconnect(account.id)}
													>
														<LinkIcon className="h-3 w-3 mr-2" />
														Reconnect Account
													</Button>
												</div>
											)}
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleRemove(account.id)}
											className="text-destructive hover:text-destructive hover:bg-destructive/10"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Account</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove this account? This will delete all
							associated transactions and balance history. This action cannot be
							undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmRemove}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Remove Account
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
