"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { NetWorthSummary } from "@/types/dashboard";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

interface NetWorthSummaryCardProps {
	netWorth: NetWorthSummary | null;
	loading: boolean;
	error?: string;
	onRetry?: () => void;
}

function formatCurrency(amount: number, currency = "GBP"): string {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function NetWorthSkeleton() {
	return (
		<Card className="net-worth-summary">
			<CardHeader>
				<div className="space-y-2">
					<div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
					<div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div className="h-12 w-48 bg-gray-200 rounded animate-pulse" />
					<div className="flex justify-between">
						<div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
						<div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function ErrorCard({
	message,
	onRetry,
}: { message: string; onRetry?: () => void }) {
	return (
		<Card className="net-worth-summary border-red-200">
			<CardContent className="pt-6">
				<div className="text-center space-y-2">
					<p className="text-red-600 text-sm">{message}</p>
					{onRetry && (
						<button
							type="button"
							onClick={onRetry}
							className="text-blue-600 hover:text-blue-800 text-sm underline"
						>
							Try again
						</button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export function NetWorthSummaryCard({
	netWorth,
	loading,
	error,
	onRetry,
}: NetWorthSummaryCardProps) {
	if (loading) return <NetWorthSkeleton />;
	if (error) return <ErrorCard message={error} onRetry={onRetry} />;
	if (!netWorth)
		return (
			<ErrorCard message="No net worth data available" onRetry={onRetry} />
		);

	const isPositive = netWorth.total_net_worth >= 0;
	const isNegative = netWorth.total_net_worth < 0;

	return (
		<Card className="net-worth-summary">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					Total Net Worth
					{isPositive && <TrendingUp className="h-5 w-5 text-green-500" />}
					{isNegative && <TrendingDown className="h-5 w-5 text-red-500" />}
					{netWorth.total_net_worth === 0 && (
						<Minus className="h-5 w-5 text-gray-500" />
					)}
				</CardTitle>
				<CardDescription>
					Last updated: {formatDate(netWorth.last_updated)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div
						className={`text-3xl font-bold ${
							isPositive
								? "text-green-600"
								: isNegative
									? "text-red-600"
									: "text-gray-600"
						}`}
					>
						{formatCurrency(netWorth.total_net_worth, netWorth.currency)}
					</div>

					<div className="grid grid-cols-2 gap-4 text-sm">
						<div className="space-y-1">
							<p className="text-gray-500">Assets</p>
							<p className="font-semibold text-green-600">
								{formatCurrency(netWorth.total_assets, netWorth.currency)}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-gray-500">Liabilities</p>
							<p className="font-semibold text-red-600">
								{formatCurrency(netWorth.total_liabilities, netWorth.currency)}
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
