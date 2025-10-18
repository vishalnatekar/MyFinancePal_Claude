/**
 * Data Export Service
 * Handles financial data export in multiple formats (CSV, JSON)
 *
 * Features:
 * - Export account balances and net worth history
 * - CSV and JSON format support
 * - Date range filtering
 * - Account selection
 * - Data privacy controls
 */

import { supabaseAdmin } from "@/lib/supabase";
import type { NetWorthHistoryPoint } from "@/types/dashboard";

export interface ExportOptions {
	format: "csv" | "json";
	dateFrom?: string;
	dateTo?: string;
	accountIds?: string[];
	includeTransactions?: boolean;
}

export interface ExportResult {
	data: string;
	filename: string;
	mimeType: string;
}

interface AccountExportData {
	id: string;
	accountName: string;
	accountType: string;
	institution: string;
	currentBalance: number;
	currency: string;
	lastSynced: string | null;
}

export class DataExportService {
	constructor(private userId: string) {}

	/**
	 * Export financial data based on options
	 */
	async exportData(options: ExportOptions): Promise<ExportResult> {
		const { format } = options;

		const data = await this.gatherExportData(options);

		switch (format) {
			case "csv":
				return this.generateCSV(data);
			case "json":
				return this.generateJSON(data);
			default:
				throw new Error(`Unsupported export format: ${format}`);
		}
	}

	/**
	 * Gather all data for export
	 */
	private async gatherExportData(options: ExportOptions) {
		const { dateFrom, dateTo, accountIds } = options;

		// Fetch accounts
		let accountQuery = supabaseAdmin
			.from("financial_accounts")
			.select("*")
			.eq("user_id", this.userId);

		if (accountIds && accountIds.length > 0) {
			accountQuery = accountQuery.in("id", accountIds);
		}

		const { data: accounts, error: accountsError } = await accountQuery;

		if (accountsError) {
			throw new Error(`Failed to fetch accounts: ${accountsError.message}`);
		}

		// Fetch net worth history
		const history = await this.fetchNetWorthHistory(
			dateFrom,
			dateTo,
			accountIds,
		);

		// Format account data
		const formattedAccounts: AccountExportData[] = (accounts || []).map(
			(acc) => ({
				id: acc.id,
				accountName: acc.account_name,
				accountType: acc.account_type,
				institution: acc.institution_name || "Unknown",
				currentBalance: acc.current_balance || 0,
				currency: acc.currency || "GBP",
				lastSynced: acc.last_synced_at,
			}),
		);

		return {
			accounts: formattedAccounts,
			history,
			exportedAt: new Date().toISOString(),
			dateRange: {
				from: dateFrom || "Beginning",
				to: dateTo || "Present",
			},
		};
	}

	/**
	 * Fetch net worth history for export
	 */
	private async fetchNetWorthHistory(
		dateFrom?: string,
		dateTo?: string,
		accountIds?: string[],
	): Promise<NetWorthHistoryPoint[]> {
		// Build query for balance history
		let query = supabaseAdmin
			.from("account_balance_history")
			.select("*")
			.eq("user_id", this.userId)
			.order("recorded_at", { ascending: true });

		if (dateFrom) {
			query = query.gte("recorded_at", dateFrom);
		}

		if (dateTo) {
			query = query.lte("recorded_at", dateTo);
		}

		if (accountIds && accountIds.length > 0) {
			query = query.in("account_id", accountIds);
		}

		const { data: balanceHistory, error } = await query;

		if (error) {
			console.error("Error fetching balance history:", error);
			return [];
		}

		if (!balanceHistory || balanceHistory.length === 0) {
			return [];
		}

		// Aggregate by date
		const historyMap = new Map<string, NetWorthHistoryPoint>();

		for (const record of balanceHistory) {
			const date = record.recorded_at.split("T")[0];
			const existing = historyMap.get(date) || {
				date,
				net_worth: 0,
				assets: 0,
				liabilities: 0,
			};

			const balanceGbp = record.balance_gbp || 0;
			const accountType = record.account_type;

			if (["checking", "savings", "investment"].includes(accountType)) {
				existing.assets += balanceGbp;
			} else if (["credit", "loan"].includes(accountType)) {
				existing.liabilities += Math.abs(balanceGbp);
			}

			existing.net_worth = existing.assets - existing.liabilities;
			historyMap.set(date, existing);
		}

		return Array.from(historyMap.values()).sort((a, b) =>
			a.date.localeCompare(b.date),
		);
	}

	/**
	 * Generate CSV export
	 */
	private generateCSV(data: any): ExportResult {
		const lines: string[] = [];

		// Accounts section
		lines.push("# Account Summary");
		lines.push(
			"Account Name,Type,Institution,Current Balance,Currency,Last Synced",
		);

		for (const account of data.accounts) {
			lines.push(
				[
					account.accountName,
					account.accountType,
					account.institution,
					account.currentBalance.toFixed(2),
					account.currency,
					account.lastSynced || "Never",
				].join(","),
			);
		}

		lines.push("");
		lines.push("# Net Worth History");
		lines.push("Date,Net Worth,Assets,Liabilities");

		for (const point of data.history) {
			lines.push(
				[
					point.date,
					point.net_worth.toFixed(2),
					point.assets.toFixed(2),
					point.liabilities.toFixed(2),
				].join(","),
			);
		}

		lines.push("");
		lines.push("# Export Information");
		lines.push(`Exported At,${data.exportedAt}`);
		lines.push(`Date Range,${data.dateRange.from} to ${data.dateRange.to}`);

		const csvContent = lines.join("\n");
		const timestamp = new Date().toISOString().split("T")[0];

		return {
			data: csvContent,
			filename: `myfinancepal-export-${timestamp}.csv`,
			mimeType: "text/csv",
		};
	}

	/**
	 * Generate JSON export
	 */
	private generateJSON(data: any): ExportResult {
		const jsonContent = JSON.stringify(data, null, 2);
		const timestamp = new Date().toISOString().split("T")[0];

		return {
			data: jsonContent,
			filename: `myfinancepal-export-${timestamp}.json`,
			mimeType: "application/json",
		};
	}
}
