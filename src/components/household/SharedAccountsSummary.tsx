"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency-utils";
import type { SharedAccountWithOwner } from "@/types/household";

interface SharedAccountsSummaryProps {
	accounts: SharedAccountWithOwner[];
}

export function SharedAccountsSummary({
	accounts,
}: SharedAccountsSummaryProps) {
	// Group accounts by type
	const accountsByType = accounts.reduce(
		(acc, account) => {
			const type = account.account_type;
			if (!acc[type]) {
				acc[type] = [];
			}
			acc[type].push(account);
			return acc;
		},
		{} as Record<string, SharedAccountWithOwner[]>,
	);

	const getAccountTypeColor = (type: string) => {
		switch (type) {
			case "checking":
				return "bg-blue-100 text-blue-800";
			case "savings":
				return "bg-green-100 text-green-800";
			case "investment":
				return "bg-purple-100 text-purple-800";
			case "credit":
				return "bg-orange-100 text-orange-800";
			case "loan":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Shared Accounts Summary</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{Object.entries(accountsByType).map(([type, typeAccounts]) => {
						const totalBalance = typeAccounts.reduce(
							(sum, acc) => sum + acc.current_balance,
							0,
						);

						return (
							<div key={type} className="space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Badge
											className={getAccountTypeColor(type)}
											variant="secondary"
										>
											{type}
										</Badge>
										<span className="text-sm text-muted-foreground">
											{typeAccounts.length} account
											{typeAccounts.length !== 1 ? "s" : ""}
										</span>
									</div>
									<span className="text-sm font-semibold">
										{formatCurrency(totalBalance)}
									</span>
								</div>

								<div className="pl-4 space-y-1">
									{typeAccounts.map((account) => (
										<div
											key={account.id}
											className="flex items-center justify-between text-xs"
										>
											<div className="flex items-center gap-1">
												<span className="text-muted-foreground">
													{account.account_name}
												</span>
												<span className="text-muted-foreground">
													• {account.owner_name}
												</span>
											</div>
											<span>{formatCurrency(account.current_balance)}</span>
										</div>
									))}
								</div>
							</div>
						);
					})}

					{accounts.length === 0 && (
						<p className="text-sm text-muted-foreground text-center py-4">
							No shared accounts yet
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
