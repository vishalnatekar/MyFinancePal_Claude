/**
 * Dashboard-specific types for net worth calculations and displays
 */

export interface NetWorthSummary {
	total_net_worth: number;
	total_assets: number;
	total_liabilities: number;
	asset_breakdown: AssetBreakdown;
	currency: string;
	last_updated: string;
}

export interface AssetBreakdown {
	cash: AssetCategory;
	investments: AssetCategory;
	property: AssetCategory;
	other: AssetCategory;
}

export interface AssetCategory {
	amount: number;
	percentage: number;
	accounts: string[]; // account IDs contributing to this category
}

export interface NetWorthHistoryPoint {
	date: string;
	net_worth: number;
	assets: number;
	liabilities: number;
}

export type DateRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

export interface ExportOptions {
	format: "csv" | "pdf" | "json";
	dateRange: DateRange;
	includeAccounts: string[];
	includePersonalInfo: boolean;
}

export interface ExportResult {
	filename: string;
	content: string | Buffer;
	mimeType: string;
}

export interface NetWorthExportData {
	summary: NetWorthSummary;
	history: NetWorthHistoryPoint[];
	accounts: AccountSummary[];
}

export interface AccountSummary {
	id: string;
	name: string;
	type: string;
	institution: string;
	balance: number;
	last_updated: string;
}

export interface SyncStatus {
	account_id: string;
	last_sync: string;
	next_sync: string;
	status: "success" | "failed" | "in_progress" | "pending";
	error_message?: string;
}
