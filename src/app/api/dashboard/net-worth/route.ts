import { authenticateRequest } from "@/lib/auth-helpers";
import { NetWorthCalculationService } from "@/services/net-worth-calculation-service";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Authentication
		const authResult = await authenticateRequest(request);
		if (!authResult.authenticated || !authResult.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Calculate net worth
		const netWorthService = new NetWorthCalculationService();
		const netWorth = await netWorthService.calculateNetWorth(
			authResult.user.id,
		);

		return NextResponse.json(netWorth);
	} catch (error) {
		console.error("Net worth calculation error:", error);
		return NextResponse.json(
			{ error: "Failed to calculate net worth" },
			{ status: 500 },
		);
	}
}
