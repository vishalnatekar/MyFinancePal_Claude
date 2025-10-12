"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency-utils";
import type { HouseholdDashboardData } from "@/types/household";

interface HouseholdNetWorthCardProps {
	dashboard: HouseholdDashboardData;
}

export function HouseholdNetWorthCard({
	dashboard,
}: HouseholdNetWorthCardProps) {
	const { shared_net_worth, shared_accounts } = dashboard;

	const accountTypeSummary = shared_accounts.reduce(
		(acc, account) => {
			const type = account.account_type;
			if (!acc[type]) {
				acc[type] = { count: 0, total: 0 };
			}
			acc[type].count += 1;
			acc[type].total += account.current_balance;
			return acc;
		},
		{} as Record<string, { count: number; total: number }>,
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Shared Net Worth</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div>
						<p className="text-3xl font-bold">
							{formatCurrency(shared_net_worth)}
						</p>
						<p className="text-sm text-muted-foreground">
							Total from {shared_accounts.length} shared account
							{shared_accounts.length !== 1 ? "s" : ""}
						</p>
					</div>

					<div className="space-y-2">
						<h4 className="text-sm font-medium">By Account Type</h4>
						<div className="space-y-1">
							{Object.entries(accountTypeSummary).map(([type, data]) => (
								<div
									key={type}
									className="flex justify-between items-center text-sm"
								>
									<span className="text-muted-foreground capitalize">
										{type} ({data.count})
									</span>
									<span className="font-medium">
										{formatCurrency(data.total)}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
