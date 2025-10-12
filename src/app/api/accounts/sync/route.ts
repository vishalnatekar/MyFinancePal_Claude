import {
	checkRateLimit,
	createAuthErrorResponse,
	withAuth,
} from "@/lib/auth-middleware";
import { CryptoService } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";
import {
	TrueLayerService,
	TrueLayerServiceError,
} from "@/services/truelayer-service";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for sync request
const syncAccountSchema = z.object({
	accountId: z.string().uuid("Invalid account ID"),
});

export const POST = withAuth(async (request: NextRequest, user: User) => {
	try {
		// Rate limiting check (stricter for sync operations)
		if (!checkRateLimit(`sync_${user.id}`, 30, 300000)) {
			// 30 sync operations per 5 minutes
			return createAuthErrorResponse("Too many sync requests", 429);
		}

		const body = await request.json();

		// Validate input data
		const validatedData = syncAccountSchema.parse(body);

		// Fetch the account to sync
		const { data: account, error: fetchError } = await supabaseAdmin
			.from("financial_accounts")
			.select("*")
			.eq("id", validatedData.accountId)
			.eq("user_id", user.id)
			.single();

		if (fetchError || !account) {
			return NextResponse.json(
				{ error: "Account not found or access denied" },
				{ status: 404 },
			);
		}

		// Only sync connected accounts (not manual ones)
		if (account.is_manual) {
			return NextResponse.json(
				{ error: "Cannot sync manual accounts" },
				{ status: 400 },
			);
		}

		if (!account.truelayer_account_id || !account.encrypted_access_token) {
			return NextResponse.json(
				{ error: "Account not connected to TrueLayer" },
				{ status: 400 },
			);
		}

		const trueLayerService = new TrueLayerService();

		// Decrypt and parse token data
		let accessToken: string;
		let tokenData: {
			access_token: string;
			refresh_token: string;
			expires_at: number;
		};

		try {
			const decrypted = CryptoService.decrypt(account.encrypted_access_token);
			tokenData = JSON.parse(decrypted);

			// Check if token is expired (with 5 minute buffer)
			const now = Date.now();
			const isExpired = tokenData.expires_at <= now + 5 * 60 * 1000;

			if (isExpired && tokenData.refresh_token) {
				console.log(
					`Access token expired for account ${account.id}, refreshing...`,
				);

				// Refresh the access token
				const refreshedToken = await trueLayerService.refreshToken(
					tokenData.refresh_token,
				);

				// Update token data
				tokenData = {
					access_token: refreshedToken.access_token,
					refresh_token:
						refreshedToken.refresh_token || tokenData.refresh_token,
					expires_at: Date.now() + refreshedToken.expires_in * 1000,
				};

				// Store updated token in database
				const { error: updateTokenError } = await supabaseAdmin
					.from("financial_accounts")
					.update({
						encrypted_access_token: CryptoService.encrypt(
							JSON.stringify(tokenData),
						),
						updated_at: new Date().toISOString(),
					})
					.eq("id", account.id);

				if (updateTokenError) {
					console.error("Failed to update refreshed token:", updateTokenError);
				} else {
					console.log(
						`✅ Token refreshed successfully for account ${account.id}`,
					);
				}
			}

			accessToken = tokenData.access_token;
		} catch (error) {
			console.error("Failed to decrypt or refresh access token:", error);
			return NextResponse.json(
				{ error: "Invalid access token - please reconnect account" },
				{ status: 401 },
			);
		}

		try {
			console.log(
				`Starting sync for account ${account.id} (${account.account_name})`,
			);

			// Fetch balance from TrueLayer
			const balance = await trueLayerService.getAccountBalance(
				account.truelayer_account_id,
				accessToken,
			);

			// Fetch transactions from TrueLayer (last 3 months)
			const threeMonthsAgo = new Date();
			threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
			const from = threeMonthsAgo.toISOString().split("T")[0];

			const transactions = await trueLayerService.getAccountTransactions(
				account.truelayer_account_id,
				accessToken,
				from,
				undefined,
				500, // Get up to 500 transactions
			);

			console.log(
				`Fetched ${transactions.length} transactions for account ${account.account_name}`,
			);

			// Update account balance
			const { error: updateError } = await supabaseAdmin
				.from("financial_accounts")
				.update({
					current_balance: balance.current,
					connection_status: "active",
					last_synced: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.eq("id", account.id);

			if (updateError) {
				console.error("Error updating account:", updateError);
				return NextResponse.json(
					{ error: "Failed to update account data" },
					{ status: 500 },
				);
			}

			// Save transactions to database
			if (transactions.length > 0) {
				const transactionsToInsert = transactions.map((txn) => ({
					account_id: account.id,
					truelayer_transaction_id: txn.transaction_id,
					date: txn.timestamp.split("T")[0], // Extract date part
					amount: Math.abs(txn.amount),
					currency: txn.currency || balance.currency || "GBP", // Use transaction currency, fallback to account currency
					transaction_type: txn.transaction_type,
					description: txn.description || "",
					merchant_name: txn.merchant_name || null,
					category: txn.transaction_category || "uncategorized",
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				}));

				// Use upsert to avoid duplicates based on truelayer_transaction_id
				const { error: txnError } = await supabaseAdmin
					.from("transactions")
					.upsert(transactionsToInsert, {
						onConflict: "truelayer_transaction_id",
						ignoreDuplicates: false,
					});

				if (txnError) {
					console.error("Error saving transactions:", txnError);
					// Don't fail the whole sync if transactions fail
				} else {
					console.log(
						`Saved ${transactions.length} transactions for account ${account.account_name}`,
					);
				}
			}

			return NextResponse.json({
				message: "Account synced successfully",
				account: {
					id: account.id,
					current_balance: balance.current,
					last_synced: new Date().toISOString(),
					connection_status: "active",
					transactions_synced: transactions.length,
				},
			});
		} catch (serviceError) {
			console.error("TrueLayer sync error:", serviceError);

			let errorMessage = "Failed to sync with TrueLayer";
			let connectionStatus = "failed";

			if (TrueLayerServiceError.isRateLimitError(serviceError)) {
				errorMessage = "Rate limit exceeded - try again later";
				connectionStatus = "active"; // Don't mark as failed for rate limits
			} else if (TrueLayerServiceError.isExpiredTokenError(serviceError)) {
				errorMessage = "Connection expired - please reconnect account";
				connectionStatus = "expired";
			}

			// Update account connection status if needed
			if (connectionStatus !== "active") {
				await supabaseAdmin
					.from("financial_accounts")
					.update({
						connection_status: connectionStatus as
							| "active"
							| "expired"
							| "failed",
						updated_at: new Date().toISOString(),
					})
					.eq("id", account.id);
			}

			return NextResponse.json(
				{ error: errorMessage },
				{
					status:
						serviceError instanceof TrueLayerServiceError
							? serviceError.statusCode
							: 500,
				},
			);
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid input data", details: error.errors },
				{ status: 400 },
			);
		}

		console.error("Error in POST /api/accounts/sync:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
});
