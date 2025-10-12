import { authenticateRequest } from "@/lib/auth-helpers";
import { NetWorthHistoryService } from "@/services/net-worth-history-service";
import type { DateRange } from "@/types/dashboard";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
	range: z.enum(["1M", "3M", "6M", "1Y", "ALL"]).optional().default("6M"),
	includeTrend: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
	try {
		// Authentication
		const authResult = await authenticateRequest(request);
		if (!authResult.authenticated || !authResult.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = authResult.user;

		// Parse query parameters
		const { searchParams } = new URL(request.url);
		const queryParams = {
			range: searchParams.get("range") || "6M",
			includeTrend: searchParams.get("includeTrend") === "true",
		};

		const { range, includeTrend } = QuerySchema.parse(queryParams);

		// Get historical net worth data
		const historyService = new NetWorthHistoryService();
		const history = await historyService.getNetWorthTrend(
			user.id,
			range as DateRange,
		);

		const response: any = { history };

		// Include trend analysis if requested
		if (includeTrend) {
			const trendAnalysis = await historyService.getTrendAnalysis(
				user.id,
				range as DateRange,
			);
			response.trend = trendAnalysis;
		}

		return NextResponse.json(response);
	} catch (error) {
		console.error("Net worth history error:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid query parameters", details: error.errors },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ error: "Failed to fetch net worth history" },
			{ status: 500 },
		);
	}
}
