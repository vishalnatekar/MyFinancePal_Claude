import { checkRateLimit } from "@/lib/auth-helpers";
import { config } from "@/lib/config";
import { CryptoService } from "@/lib/crypto";
import { oauthStateManager } from "@/lib/oauth-state";
import { supabaseAdmin } from "@/lib/supabase";
import { accountCategorizationService } from "@/services/account-categorization-service";
import { HistoricalDataService } from "@/services/historical-data-service";
import { trueLayerDataProcessor } from "@/services/truelayer-data-processor";
import {
	TRUELAYER_ERROR_MESSAGES,
	TrueLayerServiceError,
	trueLayerService,
} from "@/services/truelayer-service";
import type { TrueLayerConnectionCallback } from "@/types/truelayer";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	console.log("\n=== TrueLayer OAuth Callback Started ===");
	console.log("Timestamp:", new Date().toISOString());
	try {
		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");
		const errorDescription = searchParams.get("error_description");

		console.log("Received parameters:", {
			hasCode: !!code,
			hasState: !!state,
			hasError: !!error,
			codePreview: `${code?.substring(0, 10)}...`,
			statePreview: `${state?.substring(0, 10)}...`,
		});

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
		console.log(
			"Validating OAuth state token:",
			`${state?.substring(0, 10)}...`,
		);
		const stateData = await oauthStateManager.validateAndConsumeState(state);
		if (!stateData) {
			console.error(
				"Invalid or expired state token:",
				`${state?.substring(0, 10)}...`,
			);
			console.error("This could mean:");
			console.error("1. State expired (>10 minutes since connection started)");
			console.error("2. State already used (duplicate callback)");
			console.error(
				"3. State not found in database (check oauth_states table)",
			);
			const redirectUrl = new URL("/accounts", config.app.url);
			redirectUrl.searchParams.set("error", "invalid_state");
			redirectUrl.searchParams.set("message", "Invalid or expired session");
			return NextResponse.redirect(redirectUrl);
		}
		console.log("✅ State validated successfully for user:", stateData.userId);

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
			console.log("📡 Step 1: Exchanging OAuth code for access token...");
			// IMPORTANT: Must match the redirect_uri used in the initial OAuth request
			const redirectUri = `${config.app.url}/callback`;
			console.log("Redirect URI for token exchange:", redirectUri);
			const tokenData = await trueLayerService.exchangeCodeForToken(
				code,
				redirectUri,
			);
			const { access_token, refresh_token, expires_in } = tokenData;
			console.log(
				"✅ Token exchange successful, expires in:",
				expires_in,
				"seconds",
			);

			// Fetch account data from TrueLayer
			console.log("📡 Step 2: Fetching accounts from TrueLayer...");
			const accounts = await trueLayerService.getAccounts(access_token);
			console.log("✅ Fetched", accounts.length, "accounts from TrueLayer");

			// Get provider information for each account
			console.log(
				"📡 Step 3: Fetching balances for",
				accounts.length,
				"accounts...",
			);
			const accountsWithBalances = await Promise.all(
				accounts.map(async (account) => {
					try {
						const balance = await trueLayerService.getAccountBalance(
							account.account_id,
							access_token,
						);
						console.log(
							`✅ Balance fetched for ${account.display_name}:`,
							balance.current,
							balance.currency,
						);
						return { account, balance };
					} catch (err) {
						console.warn(
							`⚠️  Failed to get balance for account ${account.account_id}:`,
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
			console.log("✅ All balances fetched");

			// Store financial accounts in database using data processor
			const financialAccounts = accountsWithBalances.map(
				({ account, balance }) => {
					// Use account categorization service for accurate type detection
					const accountType =
						accountCategorizationService.detectAccountType(account);

					// Normalize balance using data processor
					const normalizedBalance = trueLayerDataProcessor.normalizeAmount(
						balance.current,
					);

					return {
						user_id: userId,
						truelayer_account_id: account.account_id,
						truelayer_connection_id: `${providerId}_${userId}`, // Unique connection identifier
						account_type: accountType,
						account_name: account.display_name,
						institution_name: account.provider?.display_name || "Unknown Bank",
						current_balance: normalizedBalance,
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
					};
				},
			);

			console.log(
				`💾 Step 4: Creating ${financialAccounts.length} accounts in database for user ${userId}`,
			);
			console.log(
				"Account data to be inserted:",
				financialAccounts.map((a) => ({
					name: a.account_name,
					type: a.account_type,
					balance: a.current_balance,
					institution: a.institution_name,
				})),
			);

			// Use upsert with ignoreDuplicates to update existing accounts
			const { data: createdAccounts, error: dbError } = await supabaseAdmin
				.from("financial_accounts")
				.upsert(financialAccounts, {
					onConflict: "truelayer_account_id",
					ignoreDuplicates: false,
				})
				.select();

			if (dbError) {
				console.error("❌ Database error storing financial accounts:", dbError);
				console.error("Database error details:", {
					message: dbError.message,
					details: dbError.details,
					hint: dbError.hint,
					code: dbError.code,
				});
				const redirectUrl = new URL("/accounts", config.app.url);
				redirectUrl.searchParams.set("error", "storage_failed");
				redirectUrl.searchParams.set("message", "Failed to save account data");
				return NextResponse.redirect(redirectUrl);
			}

			console.log(
				`✅ Step 4 Complete: Successfully created ${createdAccounts?.length || 0} accounts in database`,
			);
			console.log(
				"Created account IDs:",
				createdAccounts?.map((a) => a.id),
			);

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

				// Record initial balance snapshots for historical tracking
				console.log("📊 Recording initial balance snapshots...");
				try {
					// Map database nulls to undefined for TypeScript types
					const accountsForSnapshot = createdAccounts.map((account) => ({
						...account,
						truelayer_account_id: account.truelayer_account_id ?? undefined,
						truelayer_connection_id:
							account.truelayer_connection_id ?? undefined,
						currency: account.currency ?? undefined,
						last_synced: account.last_synced ?? undefined,
						connection_status: account.connection_status as
							| "active"
							| "expired"
							| "failed"
							| undefined,
						encrypted_access_token: account.encrypted_access_token ?? undefined,
						created_at: account.created_at ?? undefined,
						updated_at: account.updated_at ?? undefined,
						account_type: account.account_type as
							| "checking"
							| "savings"
							| "investment"
							| "credit",
					}));
					await HistoricalDataService.recordBalanceSnapshotBatch(
						accountsForSnapshot,
					);
					console.log(
						`✅ Recorded ${createdAccounts.length} balance snapshots`,
					);
				} catch (error) {
					console.error("Failed to record balance snapshots:", error);
					// Don't fail the whole flow if history recording fails
				}
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
		console.error("❌ Unexpected error in OAuth callback:", error);
		console.error("Error details:", {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			type: typeof error,
		});
		const redirectUrl = new URL("/accounts", config.app.url);
		redirectUrl.searchParams.set("error", "unknown_error");
		redirectUrl.searchParams.set(
			"message",
			"We couldn't connect to your bank. Please try again.",
		);
		return NextResponse.redirect(redirectUrl);
	}
}
