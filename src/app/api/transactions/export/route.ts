import { config } from "@/lib/config";
import type { Database } from "@/types/database";
import type { Transaction } from "@/types/transaction";
import { createServerClient } from "@supabase/ssr";
import { format } from "date-fns";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Transaction export API endpoint
 * GET /api/transactions/export - Export transactions to CSV
 */

export const dynamic = "force-dynamic";

const exportFilterSchema = z.object({
	account_ids: z
		.string()
		.optional()
		.transform((val) => (val ? val.split(",") : undefined)),
	categories: z
		.string()
		.optional()
		.transform((val) => (val ? val.split(",") : undefined)),
	date_from: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	date_to: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
});

export async function GET(request: NextRequest) {
	try {
		const cookieStore = cookies();
		const supabase = createServerClient<Database>(
			config.supabase.url,
			config.supabase.anonKey,
			{
				cookies: {
					get(name: string) {
						return cookieStore.get(name)?.value;
					},
					set(name: string, value: string, options: Record<string, unknown>) {
						cookieStore.set({ name, value, ...options });
					},
					remove(name: string, options: Record<string, unknown>) {
						cookieStore.set({ name, value: "", ...options });
					},
				},
			},
		);

		// Authenticate user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Parse and validate query parameters
		const searchParams = request.nextUrl.searchParams;
		const rawParams: Record<string, string | undefined> = {};

		const accountIds = searchParams.get("account_ids");
		if (accountIds) rawParams.account_ids = accountIds;

		const categories = searchParams.get("categories");
		if (categories) rawParams.categories = categories;

		const dateFrom = searchParams.get("date_from");
		if (dateFrom) rawParams.date_from = dateFrom;

		const dateTo = searchParams.get("date_to");
		if (dateTo) rawParams.date_to = dateTo;

		const validationResult = exportFilterSchema.safeParse(rawParams);
		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "Invalid query parameters",
					details: validationResult.error.errors,
				},
				{ status: 400 },
			);
		}

		const filters = validationResult.data;

		// Build query - get ALL matching transactions for export (no pagination)
		let query = supabase
			.from("transactions")
			.select("*")
			.order("date", { ascending: false });

		// Apply filters
		if (filters.account_ids && filters.account_ids.length > 0) {
			query = query.in("account_id", filters.account_ids);
		}

		if (filters.categories && filters.categories.length > 0) {
			query = query.in("category", filters.categories);
		}

		if (filters.date_from) {
			query = query.gte("date", filters.date_from);
		}

		if (filters.date_to) {
			query = query.lte("date", filters.date_to);
		}

		// Execute query
		const { data: transactions, error } = await query;

		if (error) {
			console.error("Transaction export query error:", error);
			return NextResponse.json(
				{ error: "Failed to fetch transactions" },
				{ status: 500 },
			);
		}

		if (!transactions || transactions.length === 0) {
			return NextResponse.json(
				{ error: "No transactions found to export" },
				{ status: 404 },
			);
		}

		// Generate CSV content
		const csvContent = generateCSV(transactions);

		// Generate filename with timestamp
		const timestamp = format(new Date(), "yyyy-MM-dd-HHmmss");
		const filename = `transactions-${timestamp}.csv`;

		// Return CSV as downloadable file
		return new NextResponse(csvContent, {
			status: 200,
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="${filename}"`,
				"Cache-Control": "no-cache",
			},
		});
	} catch (error) {
		console.error("Unexpected error in transaction export:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

/**
 * Generate CSV content from transactions
 */
function generateCSV(transactions: Transaction[]): string {
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
		tx.date,
		escapeCSVField(tx.merchant_name || ""),
		tx.amount.toFixed(2),
		tx.category,
		escapeCSVField(tx.description || ""),
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
function escapeCSVField(field: string): string {
	if (!field) return "";

	// If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
	if (field.includes(",") || field.includes('"') || field.includes("\n")) {
		return `"${field.replace(/"/g, '""')}"`;
	}

	return field;
}
