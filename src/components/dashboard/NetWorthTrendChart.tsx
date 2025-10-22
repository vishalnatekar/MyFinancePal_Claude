"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DateRange, NetWorthHistoryPoint } from "@/types/dashboard";
import { useState } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";

interface NetWorthTrendChartProps {
	history: NetWorthHistoryPoint[];
	loading?: boolean;
	onDateRangeChange?: (range: DateRange) => void;
}

const DATE_RANGES: { label: string; value: DateRange }[] = [
	{ label: "1M", value: "1M" },
	{ label: "3M", value: "3M" },
	{ label: "6M", value: "6M" },
	{ label: "1Y", value: "1Y" },
	{ label: "All", value: "ALL" },
];

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: "GBP",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatDateForChart(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
	});
}

function ChartSkeleton() {
	return (
		<div className="h-[200px] md:h-[300px] bg-gray-100 rounded animate-pulse flex items-center justify-center">
			<div className="text-gray-400">Loading trend data...</div>
		</div>
	);
}

function NoDataMessage() {
	return (
		<div className="h-[200px] md:h-[300px] flex items-center justify-center text-gray-500">
			<div className="text-center">
				<div className="text-4xl mb-2">📈</div>
				<p>No historical data available</p>
				<p className="text-sm">
					Data will appear as your accounts sync over time
				</p>
			</div>
		</div>
	);
}

export function NetWorthTrendChart({
	history,
	loading,
	onDateRangeChange,
}: NetWorthTrendChartProps) {
	const [selectedRange, setSelectedRange] = useState<DateRange>("6M");

	const handleRangeChange = (range: DateRange) => {
		setSelectedRange(range);
		onDateRangeChange?.(range);
	};

	if (loading) {
		return (
			<Card className="net-worth-trend-chart">
				<CardHeader>
					<div className="flex justify-between items-center">
						<CardTitle>Net Worth Trend</CardTitle>
						<div className="flex gap-1">
							{DATE_RANGES.map((range) => (
								<Button key={range.value} variant="outline" size="sm" disabled>
									{range.label}
								</Button>
							))}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<ChartSkeleton />
				</CardContent>
			</Card>
		);
	}

	if (!history || history.length === 0) {
		return (
			<Card className="net-worth-trend-chart">
				<CardHeader>
					<div className="flex justify-between items-center">
						<CardTitle>Net Worth Trend</CardTitle>
						<div className="flex gap-1">
							{DATE_RANGES.map((range) => (
								<Button
									key={range.value}
									variant={
										selectedRange === range.value ? "default" : "outline"
									}
									size="sm"
									onClick={() => handleRangeChange(range.value)}
								>
									{range.label}
								</Button>
							))}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<NoDataMessage />
				</CardContent>
			</Card>
		);
	}

	// Prepare chart data
	const chartData = history.map((point) => ({
		...point,
		date_formatted: formatDateForChart(point.date),
	}));

	const minValue = Math.min(...history.map((h) => h.net_worth));
	const maxValue = Math.max(...history.map((h) => h.net_worth));
	const range = maxValue - minValue;
	const padding = range * 0.1; // 10% padding

	const yAxisDomain = [
		Math.max(minValue - padding, minValue * 1.1), // Don't go too far below if negative
		maxValue + padding,
	];

	const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
		if (active && payload && payload.length) {
			const data = payload[0].payload as NetWorthHistoryPoint;
			return (
				<div className="bg-card border border-border rounded-lg shadow-lg p-3">
					<p className="font-medium text-card-foreground text-sm">
						{new Date(data.date).toLocaleDateString("en-GB")}
					</p>
					<p className="text-sm text-primary font-semibold mt-1">
						Net Worth: {formatCurrency(data.net_worth)}
					</p>
					<div className="mt-2 space-y-0.5">
						<p className="text-xs text-muted-foreground">
							Assets: {formatCurrency(data.assets)}
						</p>
						<p className="text-xs text-muted-foreground">
							Liabilities: {formatCurrency(data.liabilities)}
						</p>
					</div>
				</div>
			);
		}
		return null;
	};

	// Determine line color based on overall trend
	const firstValue = history[0]?.net_worth || 0;
	const lastValue = history[history.length - 1]?.net_worth || 0;
	const isPositiveTrend = lastValue >= firstValue;
	const lineColor = "var(--primary)"; // Use theme primary color (blue)

	return (
		<Card className="net-worth-trend-chart">
			<CardHeader>
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<CardTitle>Net Worth Trend</CardTitle>
					<div className="flex gap-1">
						{DATE_RANGES.map((range) => (
							<Button
								key={range.value}
								variant={selectedRange === range.value ? "default" : "outline"}
								size="sm"
								onClick={() => handleRangeChange(range.value)}
							>
								{range.label}
							</Button>
						))}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={200} className="md:h-[300px]">
					<LineChart
						data={chartData}
						margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
					>
						<defs>
							<linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor={lineColor} stopOpacity={0.15} />
								<stop offset="95%" stopColor={lineColor} stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="var(--border)"
							vertical={false}
						/>
						<XAxis
							dataKey="date_formatted"
							tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
							tickLine={false}
							axisLine={false}
						/>
						<YAxis
							domain={yAxisDomain}
							tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
							tickLine={false}
							axisLine={false}
							tickFormatter={(value) => formatCurrency(value).replace("£", "£")}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Line
							type="monotone"
							dataKey="net_worth"
							stroke={lineColor}
							strokeWidth={2.5}
							dot={false}
							activeDot={{
								r: 5,
								fill: lineColor,
								stroke: "var(--background)",
								strokeWidth: 2,
							}}
							animationDuration={1000}
							fill="url(#colorNetWorth)"
						/>
					</LineChart>
				</ResponsiveContainer>

				{/* Trend summary */}
				{history.length > 1 && (
					<div className="mt-4 flex justify-between items-center text-sm">
						<div className="flex items-center gap-2">
							<span className="text-gray-500">Change:</span>
							<span
								className={`font-medium ${isPositiveTrend ? "text-green-600" : "text-red-600"}`}
							>
								{isPositiveTrend ? "+" : ""}
								{formatCurrency(lastValue - firstValue)}
							</span>
						</div>
						<div className="text-gray-500">{history.length} data points</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
