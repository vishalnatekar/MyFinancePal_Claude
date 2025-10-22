"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AssetBreakdown } from "@/types/dashboard";
import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";
import type { LegendPayload, LegendProps, TooltipProps } from "recharts";

interface AssetCategoryChartProps {
	assets: AssetBreakdown | undefined;
	loading?: boolean;
}

const COLORS = {
	cash: "var(--chart-1)",
	investments: "var(--chart-2)",
	property: "var(--chart-3)",
	other: "var(--chart-4)",
};

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: "GBP",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

function ChartSkeleton() {
	return (
		<div className="flex h-[200px] items-center justify-center rounded-2xl bg-muted/40 md:h-[300px]">
			<div className="text-sm text-muted-foreground">Loading chart...</div>
		</div>
	);
}

function NoDataMessage() {
	return (
		<div className="flex h-[200px] items-center justify-center md:h-[300px]">
			<div className="text-center text-sm text-muted-foreground">
				<div className="mb-3 text-4xl">📊</div>
				<p className="font-medium text-foreground">No asset data available</p>
				<p>Connect accounts to see your asset breakdown.</p>
			</div>
		</div>
	);
}

export function AssetCategoryChart({
	assets,
	loading,
}: AssetCategoryChartProps) {
	if (loading) {
		return (
			<Card className="asset-category-chart">
				<CardHeader>
					<CardTitle>Asset Distribution</CardTitle>
				</CardHeader>
				<CardContent>
					<ChartSkeleton />
				</CardContent>
			</Card>
		);
	}

	if (!assets) {
		return (
			<Card className="asset-category-chart">
				<CardHeader>
					<CardTitle>Asset Distribution</CardTitle>
				</CardHeader>
				<CardContent>
					<NoDataMessage />
				</CardContent>
			</Card>
		);
	}

	// Prepare data for the chart
	const chartData = [
		{
			name: "Cash",
			value: assets.cash.amount,
			percentage: assets.cash.percentage,
			color: COLORS.cash,
		},
		{
			name: "Investments",
			value: assets.investments.amount,
			percentage: assets.investments.percentage,
			color: COLORS.investments,
		},
		{
			name: "Property",
			value: assets.property.amount,
			percentage: assets.property.percentage,
			color: COLORS.property,
		},
		{
			name: "Other",
			value: assets.other.amount,
			percentage: assets.other.percentage,
			color: COLORS.other,
		},
	].filter((item) => item.value > 0); // Only show categories with values

	const totalAssets = chartData.reduce((sum, item) => sum + item.value, 0);

	if (totalAssets === 0) {
		return (
			<Card className="asset-category-chart">
				<CardHeader>
					<CardTitle>Asset Distribution</CardTitle>
				</CardHeader>
				<CardContent>
					<NoDataMessage />
				</CardContent>
			</Card>
		);
	}

	const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
		if (active && payload && payload.length) {
			const data = payload[0].payload as (typeof chartData)[number];
			return (
				<div className="rounded-lg border border-border/60 bg-background/95 p-3 shadow-lg shadow-black/10 backdrop-blur">
					<p className="font-medium text-foreground">{data.name}</p>
					<p className="text-xs text-muted-foreground">
						{formatCurrency(data.value)} ({data.percentage.toFixed(1)}%)
					</p>
				</div>
			);
		}
		return null;
	};

	const renderLegend = ({ payload }: LegendProps) => {
		if (!payload) return null;
		return (
			<div className="mt-6 flex flex-wrap justify-center gap-3">
				{payload.map((entry: LegendPayload) => (
					<div
						key={String(entry.value ?? entry.dataKey)}
						className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground"
					>
						<div
							className="h-2.5 w-2.5 rounded-full"
							style={{ backgroundColor: entry.color }}
						/>
						<span>{entry.value}</span>
					</div>
				))}
			</div>
		);
	};

	return (
		<Card className="asset-category-chart">
			<CardHeader>
				<CardTitle>Asset Distribution</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={200} className="md:h-[300px]">
					<PieChart>
						<Pie
							data={chartData}
							cx="50%"
							cy="50%"
							innerRadius={40}
							outerRadius={80}
							paddingAngle={2}
							dataKey="value"
						>
							{chartData.map((entry) => (
								<Cell key={entry.name} fill={entry.color} />
							))}
						</Pie>
						<Tooltip content={<CustomTooltip />} />
						<Legend content={renderLegend} />
					</PieChart>
				</ResponsiveContainer>

				{/* Asset breakdown details */}
				<div className="mt-6 space-y-3 text-sm">
					{chartData.map((item) => (
						<div
							key={item.name}
							className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 px-4 py-3"
						>
							<div className="flex items-center gap-2">
								<div
									className="h-2.5 w-2.5 rounded-full"
									style={{ backgroundColor: item.color }}
								/>
								<span className="font-medium text-foreground">{item.name}</span>
							</div>
							<div className="text-right text-xs">
								<div className="font-semibold text-foreground">
									{formatCurrency(item.value)}
								</div>
								<div className="text-muted-foreground">
									{item.percentage.toFixed(1)}%
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
