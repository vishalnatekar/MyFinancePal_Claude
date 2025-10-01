import { trueLayerService } from "@/services/truelayer-service";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		console.log("Fetching TrueLayer providers from server...");

		// Get all providers from TrueLayer (server-side call, no CORS issues)
		const allProviders = await trueLayerService.getProviders();
		console.log(`Retrieved ${allProviders.length} total providers`);

		// Filter for UK providers that support accounts (exclude mock/test providers)
		const ukProviders = allProviders.filter(
			(provider) =>
				(provider.country === "uk" || provider.country_code === "GB") &&
				(provider.scopes?.includes("accounts") ||
					provider.capabilities?.accounts === true) &&
				provider.provider_id !== "mock", // Exclude TrueLayer's mock test provider
		);

		console.log(`Filtered to ${ukProviders.length} UK providers`);

		return NextResponse.json({
			success: true,
			providers: ukProviders,
			total: allProviders.length,
			ukTotal: ukProviders.length,
		});
	} catch (error) {
		console.error("Error fetching TrueLayer providers:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch providers",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
