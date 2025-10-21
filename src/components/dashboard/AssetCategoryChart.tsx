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
	cash: "#22c55e", // green-500
	investments: "#3b82f6", // blue-500
	property: "#f59e0b", // amber-500
	other: "#8b5cf6", // violet-500
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
		<div className="h-[200px] md:h-[300px] bg-gray-100 rounded animate-pulse flex items-center justify-center">
			<div className="text-gray-400">Loading chart...</div>
		</div>
	);
}

function NoDataMessage() {
	return (
		<div className="h-[200px] md:h-[300px] flex items-center justify-center text-gray-500">
			<div className="text-center">
				<div className="text-4xl mb-2">📊</div>
				<p>No asset data available</p>
				<p className="text-sm">Connect accounts to see your asset breakdown</p>
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
				<div className="bg-white p-3 border rounded-lg shadow-lg">
					<p className="font-medium">{data.name}</p>
					<p className="text-sm text-gray-600">
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
			<div className="flex flex-wrap justify-center gap-4 mt-4">
				{payload.map((entry: LegendPayload) => (
					<div
						key={String(entry.value ?? entry.dataKey)}
						className="flex items-center gap-2"
					>
						<div
							className="w-3 h-3 rounded-full"
							style={{ backgroundColor: entry.color }}
						/>
						<span className="text-sm text-gray-600">{entry.value}</span>
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
				<div className="mt-4 space-y-2">
					{chartData.map((item) => (
						<div
							key={item.name}
							className="flex justify-between items-center text-sm"
						>
							<div className="flex items-center gap-2">
								<div
									className="w-3 h-3 rounded-full"
									style={{ backgroundColor: item.color }}
								/>
								<span>{item.name}</span>
							</div>
							<div className="text-right">
								<span className="font-medium">
									{formatCurrency(item.value)}
								</span>
								<span className="text-gray-500 ml-2">
									({item.percentage.toFixed(1)}%)
								</span>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
