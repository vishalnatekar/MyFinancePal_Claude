/**
 * Historical Data Service
 * Manages balance history tracking, transaction retention, and data archiving
 *
 * Features:
 * - Balance history tracking for trend analysis
 * - Transaction retention policies
 * - Incremental data updates
 * - Data export functionality
 * - Efficient archiving for long-term storage
 */

import { supabaseAdmin } from "@/lib/supabase";
import type { FinancialAccount } from "@/types/account";
import type { Database } from "@/types/database";

/**
 * Balance history record
 */
export interface BalanceHistoryEntry {
	id?: string;
	account_id: string;
	balance: number;
	currency: string;
	recorded_at: string;
}

/**
 * Balance history query options
 */
export interface BalanceHistoryQuery {
	accountId: string;
	startDate?: Date;
	endDate?: Date;
	limit?: number;
}

/**
 * Transaction retention policy configuration
 */
export interface RetentionPolicy {
	keepDays: number; // Number of days to keep transactions
	archiveOlder: boolean; // Whether to archive older transactions
}

/**
 * Data export options
 */
export interface ExportOptions {
	format: "json" | "csv";
	includeBalanceHistory?: boolean;
	includeTransactions?: boolean;
	startDate?: Date;
	endDate?: Date;
}

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];

interface AccountHistoryExport {
	accountId: string;
	exportedAt: string;
	balanceHistory?: BalanceHistoryEntry[];
	transactions?: TransactionRow[];
}

// biome-ignore lint/complexity/noStaticOnlyClass: Service provides namespaced static helpers
export class HistoricalDataService {
	/**
	 * Record account balance for historical tracking
	 * @param accountId - Account ID
	 * @param balance - Current balance
	 * @param currency - Currency code
	 * @returns Created balance history entry
	 */
	static async recordBalanceSnapshot(
		accountId: string,
		balance: number,
		currency: string,
	): Promise<BalanceHistoryEntry> {
		const entry: BalanceHistoryEntry = {
			account_id: accountId,
			balance,
			currency,
			recorded_at: new Date().toISOString(),
		};

		const { data, error } = await supabaseAdmin
			.from("account_balance_history")
			.insert(entry)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to record balance snapshot: ${error.message}`);
		}

		return data;
	}

	/**
	 * Record balance snapshots for multiple accounts (batch operation)
	 * @param accounts - Array of financial accounts
	 * @returns Array of created balance history entries
	 */
	static async recordBalanceSnapshotBatch(
		accounts: FinancialAccount[],
	): Promise<BalanceHistoryEntry[]> {
		const entries: BalanceHistoryEntry[] = accounts.map((account) => ({
			account_id: account.id,
			balance: account.current_balance,
			currency: account.currency || "GBP",
			recorded_at: new Date().toISOString(),
		}));

		const { data, error } = await supabaseAdmin
			.from("account_balance_history")
			.insert(entries)
			.select();

		if (error) {
			throw new Error(`Failed to record balance snapshots: ${error.message}`);
		}

		return data;
	}

	/**
	 * Get balance history for an account
	 * @param query - Query options
	 * @returns Array of balance history entries
	 */
	static async getBalanceHistory(
		query: BalanceHistoryQuery,
	): Promise<BalanceHistoryEntry[]> {
		let queryBuilder = supabaseAdmin
			.from("account_balance_history")
			.select("*")
			.eq("account_id", query.accountId)
			.order("recorded_at", { ascending: false });

		// Apply date range filters
		if (query.startDate) {
			queryBuilder = queryBuilder.gte(
				"recorded_at",
				query.startDate.toISOString(),
			);
		}

		if (query.endDate) {
			queryBuilder = queryBuilder.lte(
				"recorded_at",
				query.endDate.toISOString(),
			);
		}

		// Apply limit
		if (query.limit) {
			queryBuilder = queryBuilder.limit(query.limit);
		}

		const { data, error } = await queryBuilder;

		if (error) {
			throw new Error(`Failed to get balance history: ${error.message}`);
		}

		return data || [];
	}

	/**
	 * Get latest balance snapshot for an account
	 * @param accountId - Account ID
	 * @returns Latest balance history entry or null
	 */
	static async getLatestBalanceSnapshot(
		accountId: string,
	): Promise<BalanceHistoryEntry | null> {
		const { data, error } = await supabaseAdmin
			.from("account_balance_history")
			.select("*")
			.eq("account_id", accountId)
			.order("recorded_at", { ascending: false })
			.limit(1)
			.single();

		if (error) {
			// No balance history yet
			return null;
		}

		return data;
	}

	/**
	 * Check if balance has changed significantly since last snapshot
	 * @param accountId - Account ID
	 * @param currentBalance - Current balance
	 * @param threshold - Minimum change threshold (default: 0.01)
	 * @returns True if balance changed significantly
	 */
	static async hasBalanceChanged(
		accountId: string,
		currentBalance: number,
		threshold = 0.01,
	): Promise<boolean> {
		const latest =
			await HistoricalDataService.getLatestBalanceSnapshot(accountId);

		if (!latest) {
			return true; // No history, consider it changed
		}

		const change = Math.abs(currentBalance - latest.balance);
		return change >= threshold;
	}

	/**
	 * Record balance only if it has changed significantly
	 * @param accountId - Account ID
	 * @param balance - Current balance
	 * @param currency - Currency code
	 * @param threshold - Change threshold
	 * @returns Balance history entry if recorded, null if skipped
	 */
	static async recordBalanceIfChanged(
		accountId: string,
		balance: number,
		currency: string,
		threshold = 0.01,
	): Promise<BalanceHistoryEntry | null> {
		const hasChanged = await HistoricalDataService.hasBalanceChanged(
			accountId,
			balance,
			threshold,
		);

		if (!hasChanged) {
			return null;
		}

		return await HistoricalDataService.recordBalanceSnapshot(
			accountId,
			balance,
			currency,
		);
	}

	/**
	 * Calculate balance change over time period
	 * @param accountId - Account ID
	 * @param startDate - Start date
	 * @param endDate - End date
	 * @returns Balance change amount
	 */
	static async calculateBalanceChange(
		accountId: string,
		startDate: Date,
		endDate: Date,
	): Promise<number> {
		const history = await HistoricalDataService.getBalanceHistory({
			accountId,
			startDate,
			endDate,
		});

		if (history.length < 2) {
			return 0;
		}

		// History is ordered descending, so first is newest, last is oldest
		const newest = history[0];
		const oldest = history[history.length - 1];

		return newest.balance - oldest.balance;
	}

	/**
	 * Get balance trend data (suitable for charts)
	 * @param accountId - Account ID
	 * @param days - Number of days to look back
	 * @returns Array of {date, balance} points
	 */
	static async getBalanceTrend(
		accountId: string,
		days: number,
	): Promise<Array<{ date: string; balance: number }>> {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const history = await HistoricalDataService.getBalanceHistory({
			accountId,
			startDate,
		});

		// Reverse to get chronological order for trend display
		return history.reverse().map((entry) => ({
			date: entry.recorded_at,
			balance: entry.balance,
		}));
	}

	/**
	 * Archive old balance history entries
	 * @param olderThanDays - Archive entries older than this many days
	 * @returns Number of archived entries
	 */
	static async archiveOldBalanceHistory(
		olderThanDays: number,
	): Promise<number> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

		// In a real implementation, this would move data to an archive table
		// For now, we just count what would be archived
		const { count, error } = await supabaseAdmin
			.from("account_balance_history")
			.select("*", { count: "exact", head: true })
			.lt("recorded_at", cutoffDate.toISOString());

		if (error) {
			throw new Error(`Failed to archive balance history: ${error.message}`);
		}

		return count || 0;
	}

	/**
	 * Clean up old balance history entries (delete)
	 * @param olderThanDays - Delete entries older than this many days
	 * @returns Number of deleted entries
	 */
	static async cleanupOldBalanceHistory(
		olderThanDays: number,
	): Promise<number> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

		const { count, error } = await supabaseAdmin
			.from("account_balance_history")
			.delete({ count: "exact" })
			.lt("recorded_at", cutoffDate.toISOString());

		if (error) {
			throw new Error(`Failed to cleanup balance history: ${error.message}`);
		}

		return count || 0;
	}

	/**
	 * Export account history data
	 * @param accountId - Account ID
	 * @param options - Export options
	 * @returns Exported data in requested format
	 */
	static async exportAccountHistory(
		accountId: string,
		options: ExportOptions,
	): Promise<string> {
		const exportData: AccountHistoryExport = {
			accountId,
			exportedAt: new Date().toISOString(),
		};

		// Include balance history if requested
		if (options.includeBalanceHistory !== false) {
			exportData.balanceHistory = await HistoricalDataService.getBalanceHistory(
				{
					accountId,
					startDate: options.startDate,
					endDate: options.endDate,
				},
			);
		}

		// Include transactions if requested
		if (options.includeTransactions) {
			const { data: transactions } = await supabaseAdmin
				.from("transactions")
				.select("*")
				.eq("account_id", accountId)
				.order("date", { ascending: false });

			exportData.transactions = transactions || [];
		}

		// Format output
		if (options.format === "json") {
			return JSON.stringify(exportData, null, 2);
		}

		// CSV format
		return HistoricalDataService.convertToCSV(exportData);
	}

	/**
	 * Convert export data to CSV format
	 * @param data - Export data object
	 * @returns CSV string
	 */
	private static convertToCSV(data: AccountHistoryExport): string {
		let csv = "";

		// Balance History CSV
		if (data.balanceHistory && data.balanceHistory.length > 0) {
			csv += "Balance History\n";
			csv += "Date,Balance,Currency\n";
			for (const entry of data.balanceHistory) {
				csv += `${entry.recorded_at},${entry.balance},${entry.currency}\n`;
			}
			csv += "\n";
		}

		// Transactions CSV
		if (data.transactions && data.transactions.length > 0) {
			csv += "Transactions\n";
			csv += "Date,Amount,Merchant,Description,Category,Type\n";
			for (const txn of data.transactions) {
				csv += `${txn.date},${txn.amount},"${txn.merchant_name || ""}","${txn.description || ""}","${txn.category || ""}","${txn.transaction_type || ""}"\n`;
			}
		}

		return csv;
	}

	/**
	 * Get account statistics from historical data
	 * @param accountId - Account ID
	 * @param days - Number of days to analyze
	 * @returns Account statistics
	 */
	static async getAccountStatistics(
		accountId: string,
		days: number,
	): Promise<{
		currentBalance: number;
		changeAmount: number;
		changePercent: number;
		highestBalance: number;
		lowestBalance: number;
		averageBalance: number;
	}> {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const history = await HistoricalDataService.getBalanceHistory({
			accountId,
			startDate,
		});

		if (history.length === 0) {
			return {
				currentBalance: 0,
				changeAmount: 0,
				changePercent: 0,
				highestBalance: 0,
				lowestBalance: 0,
				averageBalance: 0,
			};
		}

		const balances = history.map((h) => h.balance);
		const current = balances[0]; // Most recent (descending order)
		const oldest = balances[balances.length - 1];

		const changeAmount = current - oldest;
		const changePercent = oldest !== 0 ? (changeAmount / oldest) * 100 : 0;

		return {
			currentBalance: current,
			changeAmount,
			changePercent,
			highestBalance: Math.max(...balances),
			lowestBalance: Math.min(...balances),
			averageBalance: balances.reduce((a, b) => a + b, 0) / balances.length,
		};
	}
}
