import {
	checkRateLimit,
	createAuthErrorResponse,
	withAuth,
} from "@/lib/auth-middleware";
import { trueLayerService } from "@/services/truelayer-service";
import type { TrueLayerProvider } from "@/types/truelayer";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (request: NextRequest, user: User) => {
	try {
		// Rate limiting check
		if (!checkRateLimit(`providers_${user.id}`, 10, 60000)) {
			// 10 requests per minute for providers
			return createAuthErrorResponse("Too many requests", 429);
		}

		const { searchParams } = new URL(request.url);
		const search = searchParams.get("search");
		const type = searchParams.get("type");

		let providers: TrueLayerProvider[];

		if (search) {
			// Search for providers
			providers = await trueLayerService.searchProviders(search);
		} else if (type === "bank") {
			// Get UK banks only
			providers = await trueLayerService.getUKBankProviders();
		} else {
			// Get all providers
			providers = await trueLayerService.getProviders();
		}

		// Filter to UK providers with account capabilities
		const filteredProviders = providers.filter(
			(provider) =>
				provider.country_code === "GB" &&
				provider.capabilities?.accounts === true,
		);

		return NextResponse.json({
			providers: filteredProviders,
			count: filteredProviders.length,
		});
	} catch (error) {
		console.error("Error fetching providers:", error);
		return NextResponse.json(
			{ error: "Failed to fetch providers" },
			{ status: 500 },
		);
	}
});
