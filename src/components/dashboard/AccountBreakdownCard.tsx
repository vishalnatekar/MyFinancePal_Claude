"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialAccount } from "@/types/account";
import { Building2, CreditCard, PiggyBank, TrendingUp } from "lucide-react";

interface AccountBreakdownCardProps {
	accounts: FinancialAccount[];
	loading?: boolean;
}

function formatCurrency(amount: number, currency = "GBP"): string {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

function getAccountIcon(accountType: string) {
	switch (accountType) {
		case "checking":
		case "savings":
			return <PiggyBank className="h-4 w-4" />;
		case "investment":
			return <TrendingUp className="h-4 w-4" />;
		case "credit":
		case "loan":
			return <CreditCard className="h-4 w-4" />;
		default:
			return <Building2 className="h-4 w-4" />;
	}
}

function getAccountTypeBadgeColor(accountType: string): string {
	switch (accountType) {
		case "checking":
		case "savings":
			return "bg-blue-100 text-blue-800";
		case "investment":
			return "bg-green-100 text-green-800";
		case "credit":
		case "loan":
			return "bg-red-100 text-red-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

function formatAccountType(accountType: string): string {
	switch (accountType) {
		case "checking":
			return "Current";
		case "savings":
			return "Savings";
		case "investment":
			return "Investment";
		case "credit":
			return "Credit Card";
		case "loan":
			return "Loan";
		default:
			return accountType;
	}
}

function AccountSkeleton() {
	return (
		<div className="space-y-3">
			{[1, 2, 3].map((i) => (
				<div
					key={i}
					className="flex items-center justify-between p-3 border rounded-lg"
				>
					<div className="flex items-center gap-3">
						<div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
						<div className="space-y-1">
							<div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
							<div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
						</div>
					</div>
					<div className="text-right space-y-1">
						<div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
						<div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
					</div>
				</div>
			))}
		</div>
	);
}

export function AccountBreakdownCard({
	accounts,
	loading,
}: AccountBreakdownCardProps) {
	return (
		<Card className="account-breakdown">
			<CardHeader>
				<CardTitle>Account Breakdown</CardTitle>
			</CardHeader>
			<CardContent>
				{loading ? (
					<AccountSkeleton />
				) : accounts.length === 0 ? (
					<div className="text-center py-8 text-gray-500">
						<Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
						<p>No accounts connected</p>
						<p className="text-sm">
							Connect your first account to see your balance breakdown
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{accounts.map((account) => (
							<div
								key={account.id}
								className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
							>
								<div className="flex items-center gap-3">
									<div className="p-2 bg-gray-100 rounded-full">
										{getAccountIcon(account.account_type)}
									</div>
									<div className="space-y-1">
										<p className="font-medium text-sm">
											{account.account_name}
										</p>
										<div className="flex items-center gap-2">
											<p className="text-xs text-gray-500">
												{account.institution_name}
											</p>
											<Badge
												variant="secondary"
												className={`text-xs ${getAccountTypeBadgeColor(account.account_type)}`}
											>
												{formatAccountType(account.account_type)}
											</Badge>
										</div>
									</div>
								</div>

								<div className="text-right space-y-1">
									<p
										className={`font-semibold text-sm ${
											["credit", "loan"].includes(account.account_type)
												? "text-red-600"
												: account.current_balance >= 0
													? "text-green-600"
													: "text-red-600"
										}`}
									>
										{formatCurrency(
											account.current_balance,
											account.currency || "GBP",
										)}
									</p>
									{account.last_synced && (
										<p className="text-xs text-gray-500">
											{new Date(account.last_synced).toLocaleDateString(
												"en-GB",
											)}
										</p>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
