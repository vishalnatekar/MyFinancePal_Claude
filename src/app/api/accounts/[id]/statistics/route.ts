import { authenticateRequest } from "@/lib/auth-helpers";
import { HistoricalDataService } from "@/services/historical-data-service";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		// Authenticate the user
		const authResult = await authenticateRequest(request);
		if (!authResult.authenticated || !authResult.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const accountId = params.id;

		// Get query parameters
		const { searchParams } = new URL(request.url);
		const days = Number.parseInt(searchParams.get("days") || "30");

		// Get account statistics
		const statistics = await HistoricalDataService.getAccountStatistics(
			accountId,
			days,
		);

		return NextResponse.json({
			statistics,
		});
	} catch (error) {
		console.error("Error fetching account statistics:", error);
		return NextResponse.json(
			{ error: "Failed to fetch account statistics" },
			{ status: 500 },
		);
	}
}
