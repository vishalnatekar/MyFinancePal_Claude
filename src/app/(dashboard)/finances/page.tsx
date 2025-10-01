"use client";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function FinancesPage() {
	return (
		<div className="space-y-6">
			<Breadcrumb />

			<div>
				<h1 className="text-3xl font-bold tracking-tight">My Finances</h1>
				<p className="text-muted-foreground">
					View and manage your personal financial accounts and transactions
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-lg">Total Balance</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">Coming Soon</div>
						<p className="text-xs text-muted-foreground mt-1">
							Connect your accounts to see your balance
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-lg">This Month</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">Coming Soon</div>
						<p className="text-xs text-muted-foreground mt-1">
							Monthly spending summary
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-lg">Accounts</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0</div>
						<p className="text-xs text-muted-foreground mt-1">
							Connected accounts
						</p>
					</CardContent>
				</Card>
			</div>

			<EmptyState
				icon="💳"
				title="No financial accounts connected"
				description="Connect your bank accounts, credit cards, and investment accounts to start tracking your finances automatically."
				actionText="Connect Account"
				actionHref="/finances/connect"
				secondaryActionText="Manual Entry"
				secondaryActionHref="/finances/manual"
			/>
		</div>
	);
}
