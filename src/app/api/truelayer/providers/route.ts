import { trueLayerService } from "@/services/truelayer-service";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	try {
		console.log("Fetching TrueLayer providers from server...");

		// Get all providers from TrueLayer (server-side call, no CORS issues)
		const allProviders = await trueLayerService.getProviders();
		console.log(`Retrieved ${allProviders.length} total providers`);

		// Filter for providers that support accounts OR cards (exclude mock/test providers)
		const supportedProviders = allProviders
			.filter((provider) => provider.provider_id !== "mock")
			.filter((provider) => {
				const scopes = Array.isArray(provider.scopes) ? provider.scopes : [];
				const supportsAccounts =
					scopes.includes("accounts") ||
					scopes.includes("balance") ||
					scopes.includes("transactions") ||
					provider.capabilities?.accounts === true;
				const supportsCards =
					scopes.some((scope) => scope.startsWith("cards")) ||
					provider.capabilities?.cards === true;

				return supportsAccounts || supportsCards;
			});

		console.log(`Filtered to ${supportedProviders.length} supported providers`);

		return NextResponse.json({
			success: true,
			providers: supportedProviders,
			total: allProviders.length,
			supportedTotal: supportedProviders.length,
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
