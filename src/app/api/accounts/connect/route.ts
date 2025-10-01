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

		// Generate secure state token
		const state = await oauthStateManager.generateState(userId, providerId);

		// Generate TrueLayer OAuth URL
		// Try the callback path that matches your existing TrueLayer setup
		const redirectUri = `${config.app.url}/callback`;
		const authUrl = trueLayerService.generateAuthUrl(
			providerId,
			redirectUri,
			state,
		);

		console.log("Initiating TrueLayer OAuth flow:");
		console.log("- User ID:", userId);
		console.log("- Provider ID:", providerId);
		console.log("- Redirect URI:", redirectUri);
		console.log("- State:", state.substring(0, 8) + "...");
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
