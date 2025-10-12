import { authenticateRequest } from "@/lib/auth-middleware";
import { DataExportService } from "@/services/data-export-service";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Data Export Endpoint
 * GET /api/dashboard/export
 *
 * Query parameters:
 * - format: 'csv' | 'json' (required)
 * - dateFrom: ISO date string (optional)
 * - dateTo: ISO date string (optional)
 * - accountIds: comma-separated account IDs (optional)
 */
export async function GET(request: NextRequest) {
	try {
		const { user } = await authenticateRequest(request);

		// Parse query parameters
		const searchParams = request.nextUrl.searchParams;
		const format = searchParams.get("format");
		const dateFrom = searchParams.get("dateFrom");
		const dateTo = searchParams.get("dateTo");
		const accountIdsParam = searchParams.get("accountIds");

		// Validate format
		if (!format || !["csv", "json"].includes(format)) {
			return NextResponse.json(
				{
					error:
						'Invalid or missing format parameter. Must be "csv" or "json".',
				},
				{ status: 400 },
			);
		}

		// Parse account IDs
		const accountIds = accountIdsParam
			? accountIdsParam.split(",").filter(Boolean)
			: undefined;

		// Create export service and generate export
		const exportService = new DataExportService(user.id);
		const result = await exportService.exportData({
			format: format as "csv" | "json",
			dateFrom: dateFrom || undefined,
			dateTo: dateTo || undefined,
			accountIds,
		});

		// Return file as downloadable response
		return new NextResponse(result.data, {
			headers: {
				"Content-Type": result.mimeType,
				"Content-Disposition": `attachment; filename="${result.filename}"`,
				"Cache-Control": "no-cache, no-store, must-revalidate",
			},
		});
	} catch (error) {
		console.error("Data export failed:", error);

		return NextResponse.json(
			{
				error: "Export failed",
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
			},
			{ status: 500 },
		);
	}
}
