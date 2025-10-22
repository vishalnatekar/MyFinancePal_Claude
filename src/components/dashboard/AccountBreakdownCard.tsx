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

function getAccountTypeBadgeClasses(accountType: string): string {
	switch (accountType) {
		case "checking":
		case "savings":
			return "border-primary/30 bg-primary/10 text-primary";
		case "investment":
			return "border-accent/40 bg-accent/40 text-foreground";
		case "credit":
		case "loan":
			return "border-destructive/30 bg-destructive/15 text-destructive";
		default:
			return "border-border/50 bg-muted/30 text-foreground";
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
					className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/30 p-4"
				>
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 animate-pulse rounded-2xl bg-muted/70" />
						<div className="space-y-1">
							<div className="h-4 w-28 animate-pulse rounded-full bg-muted/70" />
							<div className="h-3 w-32 animate-pulse rounded-full bg-muted/70" />
						</div>
					</div>
					<div className="space-y-1 text-right">
						<div className="h-4 w-20 animate-pulse rounded-full bg-muted/70" />
						<div className="h-3 w-16 animate-pulse rounded-full bg-muted/70" />
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
					<div className="py-10 text-center text-muted-foreground">
						<Building2 className="mx-auto mb-3 h-12 w-12 text-primary/60" />
						<p className="font-medium text-foreground">No accounts connected</p>
						<p className="text-sm">
							Connect your first account to see your balance breakdown
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{accounts.map((account) => (
							<div
								key={account.id}
								className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm transition hover:border-border/80 hover:bg-card/90 hover:shadow-md"
							>
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
										{getAccountIcon(account.account_type)}
									</div>
									<div className="space-y-1">
										<p className="text-sm font-semibold text-foreground">
											{account.account_name}
										</p>
										<div className="flex items-center gap-2">
											<p className="text-xs text-muted-foreground">
												{account.institution_name}
											</p>
											<Badge
												variant="outline"
												className={`border text-xs font-medium ${getAccountTypeBadgeClasses(
													account.account_type,
												)}`}
											>
												{formatAccountType(account.account_type)}
											</Badge>
										</div>
									</div>
								</div>

								<div className="space-y-1 text-right">
									<p
										className={`text-sm font-semibold ${
											["credit", "loan"].includes(account.account_type)
												? "text-destructive"
												: account.current_balance >= 0
													? "text-primary"
													: "text-destructive"
										}`}
									>
										{formatCurrency(
											account.current_balance,
											account.currency || "GBP",
										)}
									</p>
									{account.last_synced && (
										<p className="text-xs text-muted-foreground">
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
