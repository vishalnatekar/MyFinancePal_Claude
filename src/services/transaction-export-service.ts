import type { Transaction } from "@/types/transaction";
import { format } from "date-fns";

/**
 * Service for exporting transactions to CSV format
 */
export class TransactionExportService {
	/**
	 * Generate CSV content from transactions
	 */
	static generateCSV(transactions: Transaction[]): string {
		if (transactions.length === 0) {
			return "";
		}

		// Define CSV headers
		const headers = [
			"Date",
			"Merchant",
			"Amount",
			"Category",
			"Description",
			"Account ID",
			"Transaction ID",
			"Manual Override",
		];

		// Create CSV rows
		const rows = transactions.map((tx) => [
			format(new Date(tx.date), "yyyy-MM-dd"),
			this.escapeCSVField(tx.merchant_name || ""),
			tx.amount.toFixed(2),
			tx.category,
			this.escapeCSVField(tx.description || ""),
			tx.account_id,
			tx.id,
			tx.manual_override ? "Yes" : "No",
		]);

		// Combine headers and rows
		const csvLines = [headers.join(","), ...rows.map((row) => row.join(","))];

		return csvLines.join("\n");
	}

	/**
	 * Escape CSV field to handle commas, quotes, and newlines
	 */
	private static escapeCSVField(field: string): string {
		if (!field) return "";

		// If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
		if (field.includes(",") || field.includes('"') || field.includes("\n")) {
			return `"${field.replace(/"/g, '""')}"`;
		}

		return field;
	}

	/**
	 * Download CSV file
	 */
	static downloadCSV(csvContent: string, filename: string): void {
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");

		if (link.download !== undefined) {
			// Create a temporary URL for the blob
			const url = URL.createObjectURL(blob);
			link.setAttribute("href", url);
			link.setAttribute("download", filename);
			link.style.visibility = "hidden";

			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Clean up the URL
			URL.revokeObjectURL(url);
		}
	}

	/**
	 * Generate filename for export
	 */
	static generateFilename(prefix = "transactions"): string {
		const timestamp = format(new Date(), "yyyy-MM-dd-HHmmss");
		return `${prefix}-${timestamp}.csv`;
	}

	/**
	 * Export transactions with custom configuration
	 */
	static async exportTransactions(
		transactions: Transaction[],
		options: {
			filename?: string;
			includeHeaders?: boolean;
		} = {},
	): Promise<void> {
		const { filename, includeHeaders = true } = options;

		if (transactions.length === 0) {
			throw new Error("No transactions to export");
		}

		const csvContent = this.generateCSV(transactions);
		const exportFilename = filename || this.generateFilename();

		this.downloadCSV(csvContent, exportFilename);
	}
}
