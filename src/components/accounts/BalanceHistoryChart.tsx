"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCallback, useEffect, useState } from "react";

interface BalanceHistoryChartProps {
	accountId: string;
	accountName: string;
}

interface BalanceDataPoint {
	date: string;
	balance: number;
}

interface BalanceStatistics {
	currentBalance: number;
	changeAmount: number;
	changePercent: number;
	highestBalance: number;
	lowestBalance: number;
}

export function BalanceHistoryChart({
	accountId,
	accountName,
}: BalanceHistoryChartProps) {
	const [history, setHistory] = useState<BalanceDataPoint[]>([]);
	const [stats, setStats] = useState<BalanceStatistics | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchBalanceHistory = useCallback(async () => {
		try {
			setLoading(true);

			// Fetch balance history
			const historyResponse = await fetch(
				`/api/accounts/${accountId}/balance-history?days=30`,
			);
			const historyData = await historyResponse.json();

			// Fetch statistics
			const statsResponse = await fetch(
				`/api/accounts/${accountId}/statistics?days=30`,
			);
			const statsData = await statsResponse.json();

			setHistory(historyData.history || []);
			setStats(statsData.statistics || null);
		} catch (error) {
			console.error("Failed to fetch balance history:", error);
		} finally {
			setLoading(false);
		}
	}, [accountId]);

	useEffect(() => {
		void fetchBalanceHistory();
	}, [fetchBalanceHistory]);

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Balance History - {accountName}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">Loading balance history...</p>
				</CardContent>
			</Card>
		);
	}

	if (history.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Balance History - {accountName}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						No balance history available yet. Balance snapshots are recorded
						during account syncs.
					</p>
				</CardContent>
			</Card>
		);
	}

	// Format currency
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-GB", {
			style: "currency",
			currency: "GBP",
		}).format(amount);
	};

	// Format date
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-GB", {
			day: "numeric",
			month: "short",
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Balance History - {accountName}</CardTitle>
			</CardHeader>
			<CardContent>
				{/* Statistics */}
				{stats && (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
						<div>
							<p className="text-sm text-muted-foreground">Current Balance</p>
							<p className="text-lg font-semibold">
								{formatCurrency(stats.currentBalance)}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">30-Day Change</p>
							<p
								className={`text-lg font-semibold ${
									stats.changeAmount >= 0 ? "text-green-600" : "text-red-600"
								}`}
							>
								{stats.changeAmount >= 0 ? "+" : ""}
								{formatCurrency(stats.changeAmount)}
								<span className="text-sm ml-1">
									({stats.changePercent.toFixed(1)}%)
								</span>
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Highest</p>
							<p className="text-lg font-semibold">
								{formatCurrency(stats.highestBalance)}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Lowest</p>
							<p className="text-lg font-semibold">
								{formatCurrency(stats.lowestBalance)}
							</p>
						</div>
					</div>
				)}

				{/* Simple list view of balance history */}
				<div className="space-y-2">
					<h3 className="text-sm font-medium mb-2">
						Balance Snapshots (Last 30 Days)
					</h3>
					<div className="max-h-64 overflow-y-auto space-y-1">
						{history.map((point) => (
							<div
								key={point.date}
								className="flex justify-between items-center py-2 px-3 rounded-md hover:bg-muted/50"
							>
								<span className="text-sm text-muted-foreground">
									{formatDate(point.date)}
								</span>
								<span className="font-medium">
									{formatCurrency(point.balance)}
								</span>
							</div>
						))}
					</div>
				</div>

				<p className="text-xs text-muted-foreground mt-4">
					Balance history is recorded during account syncs. Sync your account to
					see the latest data.
				</p>
			</CardContent>
		</Card>
	);
}
