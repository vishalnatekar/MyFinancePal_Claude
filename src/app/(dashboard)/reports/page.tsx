"use client";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { BarChart3, Calendar, PieChart, TrendingUp } from "lucide-react";

export default function ReportsPage() {
	const reportTypes = [
		{
			title: "Spending Analysis",
			description:
				"Detailed breakdown of your spending by category and time period",
			icon: PieChart,
		},
		{
			title: "Income vs Expenses",
			description: "Track your income against expenses over time",
			icon: BarChart3,
		},
		{
			title: "Trends & Insights",
			description: "Identify spending patterns and financial trends",
			icon: TrendingUp,
		},
		{
			title: "Monthly Reports",
			description: "Comprehensive monthly financial summaries",
			icon: Calendar,
		},
	];

	return (
		<div className="space-y-6">
			<Breadcrumb />

			<div>
				<h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
				<p className="text-muted-foreground">
					Analyze your financial data with comprehensive reports and insights
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{reportTypes.map((report) => (
					<Card key={report.title}>
						<CardHeader className="pb-3">
							<div className="flex items-center space-x-2">
								<report.icon className="w-5 h-5 text-primary" />
								<CardTitle className="text-lg">{report.title}</CardTitle>
							</div>
							<CardDescription>{report.description}</CardDescription>
						</CardHeader>
						<CardContent>
							<Button variant="outline" disabled className="w-full">
								Coming Soon
							</Button>
						</CardContent>
					</Card>
				))}
			</div>

			<EmptyState
				icon="📊"
				title="Reports coming soon"
				description="Financial reports and analytics will be available once you have connected your accounts and have transaction data to analyze."
				actionText="Connect Accounts"
				actionHref="/accounts"
			/>
		</div>
	);
}
