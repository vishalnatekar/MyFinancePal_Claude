import { checkRateLimit } from "@/lib/auth-helpers";
import { config } from "@/lib/config";
import { CryptoService } from "@/lib/crypto";
import { oauthStateManager } from "@/lib/oauth-state";
import { supabaseAdmin } from "@/lib/supabase";
import {
	TRUELAYER_ERROR_MESSAGES,
	TrueLayerServiceError,
	trueLayerService,
} from "@/services/truelayer-service";
import type { TrueLayerConnectionCallback } from "@/types/truelayer";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");
		const errorDescription = searchParams.get("error_description");

		// Handle OAuth errors
		if (error) {
			console.error("TrueLayer OAuth error:", error, errorDescription);
			const redirectUrl = new URL("/accounts", config.app.url);
			redirectUrl.searchParams.set("error", "connection_failed");
			redirectUrl.searchParams.set(
				"message",
				errorDescription || "Connection failed",
			);
			return NextResponse.redirect(redirectUrl);
		}

		if (!code || !state) {
			console.error("Missing OAuth parameters:", {
				code: !!code,
				state: !!state,
			});
			const redirectUrl = new URL("/accounts", config.app.url);
			redirectUrl.searchParams.set("error", "invalid_request");
			redirectUrl.searchParams.set("message", "Missing required parameters");
			return NextResponse.redirect(redirectUrl);
		}

		// Validate state (CSRF protection) using secure state manager
		const stateData = await oauthStateManager.validateAndConsumeState(state);
		if (!stateData) {
			console.error("Invalid or expired state:", state);
			const redirectUrl = new URL("/accounts", config.app.url);
			redirectUrl.searchParams.set("error", "invalid_state");
			redirectUrl.searchParams.set("message", "Invalid or expired session");
			return NextResponse.redirect(redirectUrl);
		}

		const { userId, providerId } = stateData;

		// Check rate limiting for OAuth callbacks (max 20 per minute per user)
		const rateLimitResult = checkRateLimit(userId, 20, 1);
		if (!rateLimitResult.allowed) {
			console.warn("Rate limit exceeded for OAuth callback:", userId);
			const redirectUrl = new URL("/accounts", config.app.url);
			redirectUrl.searchParams.set("error", "rate_limit");
			redirectUrl.searchParams.set(
				"message",
				"Too many requests. Please try again later.",
			);
			return NextResponse.redirect(redirectUrl);
		}

		// Exchange code for connection and fetch account data
		try {
			// Exchange OAuth code for access tokens with TrueLayer
			const redirectUri = `${config.app.url}/api/accounts/callback`;
			const tokenData = await trueLayerService.exchangeCodeForToken(
				code,
				redirectUri,
			);
			const { access_token, refresh_token, expires_in } = tokenData;

			// Fetch account data from TrueLayer
			const accounts = await trueLayerService.getAccounts(access_token);

			// Get provider information for each account
			const accountsWithBalances = await Promise.all(
				accounts.map(async (account) => {
					try {
						const balance = await trueLayerService.getAccountBalance(
							account.account_id,
							access_token,
						);
						return { account, balance };
					} catch (err) {
						console.warn(
							`Failed to get balance for account ${account.account_id}:`,
							err,
						);
						return {
							account,
							balance: {
								current: 0,
								available: 0,
								currency: account.currency,
								update_timestamp: new Date().toISOString(),
							},
						};
					}
				}),
			);

			// Store financial accounts in database
			const financialAccounts = accountsWithBalances.map(
				({ account, balance }) => ({
					user_id: userId,
					truelayer_account_id: account.account_id,
					truelayer_connection_id: `${providerId}_${userId}`, // Unique connection identifier
					account_type: (account.account_type === "TRANSACTION"
						? "checking"
						: account.account_type === "SAVINGS"
							? "savings"
							: account.account_type === "CREDIT_CARD"
								? "credit"
								: "checking") as
						| "checking"
						| "savings"
						| "investment"
						| "credit",
					account_name: account.display_name,
					institution_name: account.provider?.display_name || "Unknown Bank",
					current_balance: balance.current,
					is_shared: false,
					is_manual: false,
					connection_status: "active" as "active" | "expired" | "failed",
					encrypted_access_token: CryptoService.encrypt(
						JSON.stringify({
							access_token,
							refresh_token,
							expires_at: Date.now() + expires_in * 1000,
						}),
					),
					last_synced: new Date().toISOString(),
				}),
			);

			const { data: createdAccounts, error: dbError } = await supabaseAdmin
				.from("financial_accounts")
				.insert(financialAccounts)
				.select();

			if (dbError) {
				console.error("Error storing financial accounts:", dbError);
				const redirectUrl = new URL("/accounts", config.app.url);
				redirectUrl.searchParams.set("error", "storage_failed");
				redirectUrl.searchParams.set("message", "Failed to save account data");
				return NextResponse.redirect(redirectUrl);
			}

			// Create sync history entry
			if (createdAccounts && createdAccounts.length > 0) {
				const syncHistoryEntries = createdAccounts.map((account) => ({
					account_id: account.id,
					sync_status: "success" as const,
					synced_at: new Date().toISOString(),
				}));

				await supabaseAdmin
					.from("account_sync_history")
					.insert(syncHistoryEntries);
			}

			// Successful connection - redirect to accounts page with success message
			const redirectUrl = new URL("/accounts", config.app.url);
			redirectUrl.searchParams.set("success", "true");
			redirectUrl.searchParams.set("message", "Account connected successfully");
			return NextResponse.redirect(redirectUrl);
		} catch (serviceError) {
			console.error("TrueLayer service error:", serviceError);

			let errorKey = "CONNECTION_FAILED";
			if (TrueLayerServiceError.isRateLimitError(serviceError)) {
				errorKey = "RATE_LIMIT";
			} else if (TrueLayerServiceError.isServerError(serviceError)) {
				errorKey = "SERVER_ERROR";
			} else if (TrueLayerServiceError.isExpiredTokenError(serviceError)) {
				errorKey = "EXPIRED_CONNECTION";
			}

			const errorConfig =
				TRUELAYER_ERROR_MESSAGES[
					errorKey as keyof typeof TRUELAYER_ERROR_MESSAGES
				];
			const redirectUrl = new URL("/accounts", config.app.url);
			redirectUrl.searchParams.set("error", "service_error");
			redirectUrl.searchParams.set("message", errorConfig.message);
			return NextResponse.redirect(redirectUrl);
		}
	} catch (error) {
		console.error("Unexpected error in OAuth callback:", error);
		const redirectUrl = new URL("/accounts", config.app.url);
		redirectUrl.searchParams.set("error", "unknown_error");
		redirectUrl.searchParams.set("message", "An unexpected error occurred");
		return NextResponse.redirect(redirectUrl);
	}
}
