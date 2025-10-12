import { config } from "@/lib/config";
import type { DateRange, NetWorthHistoryPoint } from "@/types/dashboard";
import { createClient } from "@supabase/supabase-js";
import { HistoricalDataService } from "./historical-data-service";
import { NetWorthCalculationService } from "./net-worth-calculation-service";
import { TransactionBasedHistoryService } from "./transaction-based-history-service";

export class NetWorthHistoryService {
	private supabase = createClient(config.supabase.url, config.supabase.anonKey);
	private netWorthService = new NetWorthCalculationService();
	private historicalDataService = new HistoricalDataService();
	private transactionHistoryService = new TransactionBasedHistoryService();

	async getNetWorthTrend(
		userId: string,
		dateRange: DateRange,
	): Promise<NetWorthHistoryPoint[]> {
		const endDate = new Date();
		const startDate = this.calculateStartDate(endDate, dateRange);

		// Get unique dates where we have balance snapshots
		const { data: balanceDates, error } = await this.supabase
			.from("account_balance_history")
			.select("recorded_at")
			.gte("recorded_at", startDate.toISOString())
			.lte("recorded_at", endDate.toISOString())
			.order("recorded_at", { ascending: true });

		if (error) {
			throw new Error(
				`Failed to fetch balance history dates: ${error.message}`,
			);
		}

		// If we have insufficient balance snapshots (less than 3 data points),
		// use transaction-based backfill to generate historical trend
		if (!balanceDates || balanceDates.length < 3) {
			console.log(
				"Insufficient balance snapshots, using transaction-based backfill",
			);
			const daysBack = this.getDaysFromDateRange(dateRange);
			const intervalDays =
				TransactionBasedHistoryService.getIntervalForRange(daysBack);

			try {
				const transactionBasedHistory =
					await this.transactionHistoryService.generateHistoricalTrend(
						userId,
						daysBack,
						intervalDays,
					);

				// If we got meaningful data, return it
				if (transactionBasedHistory.length > 1) {
					return transactionBasedHistory;
				}
			} catch (error) {
				console.error(
					"Transaction-based backfill failed, falling back to current balance:",
					error,
				);
			}

			// Fallback: return current net worth only
			const currentNetWorth =
				await this.netWorthService.calculateNetWorth(userId);
			return [
				{
					date: endDate.toISOString().split("T")[0],
					net_worth: currentNetWorth.total_net_worth,
					assets: currentNetWorth.total_assets,
					liabilities: currentNetWorth.total_liabilities,
				},
			];
		}

		// Get unique dates and sample them if there are too many data points
		const uniqueDates = [
			...new Set(balanceDates.map((d) => d.recorded_at.split("T")[0])),
		];
		const sampledDates = this.sampleDates(uniqueDates, 50); // Limit to 50 points for performance

		// Calculate net worth for each sampled date
		const netWorthHistory = await Promise.all(
			sampledDates.map(async (date) => {
				const netWorth = await this.calculateNetWorthForDate(userId, date);
				return {
					date,
					net_worth: netWorth.total,
					assets: netWorth.assets,
					liabilities: netWorth.liabilities,
				};
			}),
		);

		return netWorthHistory.filter((point) => point.net_worth !== 0);
	}

	private calculateStartDate(endDate: Date, dateRange: DateRange): Date {
		const startDate = new Date(endDate);

		switch (dateRange) {
			case "1M":
				startDate.setMonth(startDate.getMonth() - 1);
				break;
			case "3M":
				startDate.setMonth(startDate.getMonth() - 3);
				break;
			case "6M":
				startDate.setMonth(startDate.getMonth() - 6);
				break;
			case "1Y":
				startDate.setFullYear(startDate.getFullYear() - 1);
				break;
			case "ALL":
				startDate.setFullYear(startDate.getFullYear() - 10); // 10 years max
				break;
		}

		return startDate;
	}

	private getDaysFromDateRange(dateRange: DateRange): number {
		switch (dateRange) {
			case "1M":
				return 30;
			case "3M":
				return 90;
			case "6M":
				return 180;
			case "1Y":
				return 365;
			case "ALL":
				return 3650; // 10 years
			default:
				return 180; // Default to 6 months
		}
	}

	private sampleDates(dates: string[], maxPoints: number): string[] {
		if (dates.length <= maxPoints) {
			return dates;
		}

		const step = Math.floor(dates.length / maxPoints);
		const sampled: string[] = [];

		for (let i = 0; i < dates.length; i += step) {
			sampled.push(dates[i]);
		}

		// Always include the last date
		if (sampled[sampled.length - 1] !== dates[dates.length - 1]) {
			sampled.push(dates[dates.length - 1]);
		}

		return sampled;
	}

	private async calculateNetWorthForDate(
		userId: string,
		date: string,
	): Promise<{
		total: number;
		assets: number;
		liabilities: number;
	}> {
		// Get the latest balance for each account on or before the specified date
		const { data: balanceHistory, error } = await this.supabase
			.from("account_balance_history")
			.select(`
        account_id,
        balance,
        currency,
        recorded_at,
        financial_accounts!inner(account_type, user_id)
      `)
			.eq("financial_accounts.user_id", userId)
			.lte("recorded_at", `${date} 23:59:59`)
			.order("recorded_at", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch historical balances: ${error.message}`);
		}

		if (!balanceHistory || balanceHistory.length === 0) {
			return { total: 0, assets: 0, liabilities: 0 };
		}

		// Get the most recent balance for each account
		const accountBalances = new Map<
			string,
			{
				balance: number;
				accountType: string;
				currency: string;
			}
		>();

		for (const record of balanceHistory) {
			if (!accountBalances.has(record.account_id)) {
				accountBalances.set(record.account_id, {
					balance: record.balance,
					accountType: record.financial_accounts.account_type,
					currency: record.currency || "GBP",
				});
			}
		}

		// Calculate assets and liabilities
		let assets = 0;
		let liabilities = 0;

		for (const [_, accountData] of accountBalances) {
			// Note: Currency normalization would be done here in production
			// For now, assuming all balances are in GBP
			const balance = accountData.balance;

			if (
				["checking", "savings", "investment"].includes(accountData.accountType)
			) {
				assets += Math.max(0, balance); // Only positive balances count as assets
			} else if (["credit", "loan"].includes(accountData.accountType)) {
				liabilities += Math.abs(balance);
			}
		}

		return {
			total: assets - liabilities,
			assets,
			liabilities,
		};
	}

	/**
	 * Get trend analysis (percentage change, growth rate)
	 */
	async getTrendAnalysis(
		userId: string,
		dateRange: DateRange,
	): Promise<{
		percentageChange: number;
		growthRate: number;
		trend: "up" | "down" | "stable";
	}> {
		const history = await this.getNetWorthTrend(userId, dateRange);

		if (history.length < 2) {
			return { percentageChange: 0, growthRate: 0, trend: "stable" };
		}

		const firstValue = history[0].net_worth;
		const lastValue = history[history.length - 1].net_worth;

		const percentageChange =
			firstValue !== 0
				? ((lastValue - firstValue) / Math.abs(firstValue)) * 100
				: 0;

		// Calculate annualized growth rate
		const daysDiff = Math.max(
			1,
			this.daysBetweenDates(history[0].date, history[history.length - 1].date),
		);
		const periodsPerYear = 365 / daysDiff;
		const growthRate =
			firstValue !== 0
				? (Math.pow(lastValue / Math.abs(firstValue), 1 / periodsPerYear) - 1) *
					100
				: 0;

		const trend =
			percentageChange > 1 ? "up" : percentageChange < -1 ? "down" : "stable";

		return { percentageChange, growthRate, trend };
	}

	private daysBetweenDates(date1: string, date2: string): number {
		const d1 = new Date(date1);
		const d2 = new Date(date2);
		const timeDiff = Math.abs(d2.getTime() - d1.getTime());
		return Math.ceil(timeDiff / (1000 * 3600 * 24));
	}
}
