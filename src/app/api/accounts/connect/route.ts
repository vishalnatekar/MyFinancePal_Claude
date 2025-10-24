import { authenticateRequest, checkRateLimit } from "@/lib/auth-helpers";
import { config } from "@/lib/config";
import { oauthStateManager } from "@/lib/oauth-state";
import { trueLayerService } from "@/services/truelayer-service";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ConnectAccountSchema = z.object({
	providerId: z.string().min(1, "Provider ID is required"),
	institutionName: z.string().optional(),
});

export async function POST(request: NextRequest) {
	try {
		// Authenticate the request
		const authResult = await authenticateRequest(request);

		if (!authResult.success) {
			return NextResponse.json(
				{ error: "Unauthorized", message: "Authentication required" },
				{ status: 401 },
			);
		}

		if (!authResult.userId) {
			return NextResponse.json(
				{ error: "Unauthorized", message: "User ID not found" },
				{ status: 401 },
			);
		}

		const userId = authResult.userId;

		// Check rate limiting (max 10 connection attempts per minute per user)
		const rateLimitResult = checkRateLimit(userId, 10, 1);
		if (!rateLimitResult.allowed) {
			return NextResponse.json(
				{
					error: "rate_limit_exceeded",
					message: "Too many connection attempts. Please try again later.",
					resetTime: rateLimitResult.resetTime,
				},
				{
					status: 429,
					headers: {
						"X-RateLimit-Limit": "10",
						"X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
						"X-RateLimit-Reset": Math.ceil(
							rateLimitResult.resetTime / 1000,
						).toString(),
					},
				},
			);
		}

		// Validate request body
		const body = await request.json();
		const validationResult = ConnectAccountSchema.safeParse(body);

		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "validation_failed",
					message: "Invalid request data",
					details: validationResult.error.errors,
				},
				{ status: 400 },
			);
		}

		const { providerId, institutionName } = validationResult.data;

		// Fetch provider details to determine supported scopes
		const provider = await trueLayerService.getProviderById(providerId);
		if (!provider) {
			return NextResponse.json(
				{
					error: "provider_not_found",
					message: "Selected provider is not supported.",
				},
				{ status: 404 },
			);
		}

		const providerScopes = Array.isArray(provider.scopes) ? provider.scopes : [];
		const scopes = new Set<string>(["info", "offline_access"]);

		// Only add scopes that the provider actually advertises
		for (const scope of providerScopes) {
			scopes.add(scope);
		}

		// Verify provider supports at least accounts or cards
		const supportsAccounts =
			providerScopes.includes("accounts") ||
			providerScopes.includes("balance") ||
			providerScopes.includes("transactions") ||
			provider.capabilities?.accounts === true;
		const supportsCards =
			providerScopes.some((scope) => scope.startsWith("cards")) ||
			provider.capabilities?.cards === true;

		if (!supportsAccounts && !supportsCards) {
			return NextResponse.json(
				{
					error: "unsupported_provider",
					message:
						"This provider does not expose account or card data via TrueLayer.",
				},
				{ status: 400 },
			);
		}

		// Generate secure state token
		console.log("🔐 Generating OAuth state token for user:", userId);
		const state = await oauthStateManager.generateState(userId, providerId);
		console.log(
			"✅ State token generated and stored:",
			`${state.substring(0, 10)}...`,
		);

		// Generate TrueLayer OAuth URL
		// Use /callback page which will then call the API endpoint
		const redirectUri = `${config.app.url}/callback`;
		const authUrl = trueLayerService.generateAuthUrl(
			providerId,
			redirectUri,
			state,
			Array.from(scopes),
		);

		console.log("Provider supports accounts:", supportsAccounts);
		console.log("Provider supports cards:", supportsCards);
		console.log("Provider scopes:", providerScopes.join(", "));
		console.log("Requested scopes:", Array.from(scopes).join(" "));
		console.log("Initiating TrueLayer OAuth flow:");
		console.log("- User ID:", userId);
		console.log("- Provider ID:", providerId);
		console.log(
			"- Institution:",
			institutionName || provider.display_name || "Unknown provider",
		);
		console.log("- Redirect URI:", redirectUri);
		console.log("- State:", `${state.substring(0, 10)}...`);
		console.log("- Full Auth URL:", authUrl);
		console.log("");
		console.log(
			"🔍 IMPORTANT: Make sure this EXACT redirect URI is in your TrueLayer console:",
		);
		console.log("   ", redirectUri);
		console.log("");
		console.log(
			"⚠️  If you just added the redirect URI, it may take a few minutes to propagate.",
		);
		console.log(
			"   Also check you're editing the correct application and environment in TrueLayer console.",
		);

		return NextResponse.json({
			authUrl,
			state, // Return state for client-side validation if needed
		});
	} catch (error) {
		console.error("Error initiating account connection:", error);
		return NextResponse.json(
			{
				error: "server_error",
				message: "Failed to initiate account connection",
			},
			{ status: 500 },
		);
	}
}
