import { supabaseAdmin } from "@/lib/supabase";
import { getValidAccessToken } from "@/lib/token-refresh-utils";
import type { FinancialAccount } from "@/types/account";
import { dataValidationService } from "./data-validation-service";
import { trueLayerDataProcessor } from "./truelayer-data-processor";
import { TrueLayerServiceError, trueLayerService } from "./truelayer-service";

export interface SyncResult {
	accountId: string;
	success: boolean;
	error?: string;
	balanceUpdated?: boolean;
	oldBalance?: number;
	newBalance?: number;
}

export interface BulkSyncResult {
	totalAccounts: number;
	successCount: number;
	failureCount: number;
	results: SyncResult[];
	duration: number;
}

// biome-ignore lint/complexity/noStaticOnlyClass: Static helpers provide procedural sync operations
export class AccountSyncService {
	/**
	 * Sync a single account with TrueLayer
	 */
	static async syncAccount(accountId: string): Promise<SyncResult> {
		const startTime = Date.now();

		try {
			// Fetch the account from database
			const { data: account, error: fetchError } = await supabaseAdmin
				.from("financial_accounts")
				.select("*")
				.eq("id", accountId)
				.single();

			if (fetchError || !account) {
				return {
					accountId,
					success: false,
					error: "Account not found",
				};
			}

			// Skip manual accounts
			if (account.is_manual) {
				return {
					accountId,
					success: false,
					error: "Cannot sync manual accounts",
				};
			}

			if (!account.truelayer_connection_id || !account.truelayer_account_id) {
				return {
					accountId,
					success: false,
					error: "Account not connected to TrueLayer",
				};
			}

			// Check if sync is already in progress
			const { data: inProgressSync } = await supabaseAdmin
				.from("account_sync_history")
				.select("id")
				.eq("account_id", accountId)
				.eq("sync_status", "in_progress")
				.limit(1)
				.single();

			if (inProgressSync) {
				return {
					accountId,
					success: false,
					error: "Sync already in progress",
				};
			}

			// Create sync history entry
			const { data: syncHistory, error: syncHistoryError } = await supabaseAdmin
				.from("account_sync_history")
				.insert({
					account_id: accountId,
					sync_status: "in_progress",
					synced_at: new Date().toISOString(),
				})
				.select()
				.single();

			if (syncHistoryError || !syncHistory) {
				return {
					accountId,
					success: false,
					error: "Failed to create sync history",
				};
			}

			try {
				// Get valid access token (automatically refreshes if expired)
				if (!account.encrypted_access_token) {
					throw new Error("No access token found for account");
				}

				const accessToken = await getValidAccessToken(
					accountId,
					account.encrypted_access_token,
				);

				// Fetch fresh balance from TrueLayer
				const balance = await trueLayerService.getAccountBalance(
					account.truelayer_account_id,
					accessToken,
				);

				// Validate balance data
				const balanceValidation =
					dataValidationService.validateBalance(balance);
				if (!balanceValidation.valid) {
					throw new Error(
						`Invalid balance data: ${balanceValidation.errors.map((e) => e.message).join(", ")}`,
					);
				}

				// Process balance with data processor
				const normalizedBalance = trueLayerDataProcessor.normalizeAmount(
					balance.current,
				);

				const oldBalance = account.current_balance;
				const newBalance = normalizedBalance;
				const balanceUpdated = Math.abs(oldBalance - newBalance) > 0.001; // Handle floating point precision

				// Update account with fresh data
				const { error: updateError } = await supabaseAdmin
					.from("financial_accounts")
					.update({
						current_balance: newBalance,
						connection_status: "active",
						last_synced: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					})
					.eq("id", accountId);

				if (updateError) {
					await supabaseAdmin
						.from("account_sync_history")
						.update({
							sync_status: "failed",
							error_message: "Failed to update account data",
						})
						.eq("id", syncHistory.id);

					return {
						accountId,
						success: false,
						error: "Failed to update account data",
					};
				}

				// Mark sync as successful
				await supabaseAdmin
					.from("account_sync_history")
					.update({
						sync_status: "success",
					})
					.eq("id", syncHistory.id);

				return {
					accountId,
					success: true,
					balanceUpdated,
					oldBalance,
					newBalance,
				};
			} catch (serviceError) {
				console.error("TrueLayer sync error:", serviceError);

				let errorMessage = "Failed to sync with TrueLayer";
				let connectionStatus = "failed";

				if (TrueLayerServiceError.isRateLimitError(serviceError)) {
					errorMessage = "Rate limit exceeded";
					connectionStatus = "active"; // Don't mark as failed for rate limits
				} else if (TrueLayerServiceError.isExpiredTokenError(serviceError)) {
					errorMessage = "Connection expired";
					connectionStatus = "expired";
				}

				// Update sync history with error
				await supabaseAdmin
					.from("account_sync_history")
					.update({
						sync_status: "failed",
						error_message: errorMessage,
					})
					.eq("id", syncHistory.id);

				// Update account connection status if needed
				if (connectionStatus !== "active") {
					await supabaseAdmin
						.from("financial_accounts")
						.update({
							connection_status: connectionStatus,
							updated_at: new Date().toISOString(),
						})
						.eq("id", accountId);
				}

				return {
					accountId,
					success: false,
					error: errorMessage,
				};
			}
		} catch (error) {
			console.error("Unexpected error syncing account:", error);
			return {
				accountId,
				success: false,
				error: "Unexpected error occurred",
			};
		}
	}

	/**
	 * Sync all connected accounts for a user
	 */
	static async syncUserAccounts(userId: string): Promise<BulkSyncResult> {
		const startTime = Date.now();

		try {
			// Fetch all connected accounts for the user
			const { data: accounts, error } = await supabaseAdmin
				.from("financial_accounts")
				.select("id, truelayer_connection_id")
				.eq("user_id", userId)
				.eq("is_manual", false)
				.not("truelayer_connection_id", "is", null);

			if (error) {
				console.error("Error fetching user accounts:", error);
				return {
					totalAccounts: 0,
					successCount: 0,
					failureCount: 0,
					results: [],
					duration: Date.now() - startTime,
				};
			}

			if (!accounts || accounts.length === 0) {
				return {
					totalAccounts: 0,
					successCount: 0,
					failureCount: 0,
					results: [],
					duration: Date.now() - startTime,
				};
			}

			// Sync each account
			const results: SyncResult[] = [];
			let successCount = 0;
			let failureCount = 0;

			// Process accounts sequentially to avoid rate limits
			for (const account of accounts) {
				const result = await AccountSyncService.syncAccount(account.id);
				results.push(result);

				if (result.success) {
					successCount++;
				} else {
					failureCount++;
				}

				// Add a small delay between requests to respect rate limits
				await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
			}

			return {
				totalAccounts: accounts.length,
				successCount,
				failureCount,
				results,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			console.error("Error in bulk sync:", error);
			return {
				totalAccounts: 0,
				successCount: 0,
				failureCount: 1,
				results: [],
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * Sync all connected accounts across all users
	 */
	static async syncAllAccounts(): Promise<{
		totalUsers: number;
		results: BulkSyncResult[];
		totalDuration: number;
	}> {
		const startTime = Date.now();
		console.log("Starting full account sync...");

		try {
			// Get all users with connected accounts
			const { data: usersWithAccounts, error } = await supabaseAdmin
				.from("financial_accounts")
				.select("user_id")
				.eq("is_manual", false)
				.not("truelayer_connection_id", "is", null);

			if (error) {
				console.error("Error fetching users with accounts:", error);
				return {
					totalUsers: 0,
					results: [],
					totalDuration: Date.now() - startTime,
				};
			}

			// Get unique user IDs
			const uniqueUserIds = [
				...new Set(usersWithAccounts?.map((acc) => acc.user_id) || []),
			];

			if (uniqueUserIds.length === 0) {
				console.log("No users with connected accounts found");
				return {
					totalUsers: 0,
					results: [],
					totalDuration: Date.now() - startTime,
				};
			}

			console.log(`Syncing accounts for ${uniqueUserIds.length} users`);

			// Sync accounts for each user
			const results: BulkSyncResult[] = [];
			for (const userId of uniqueUserIds) {
				const userResult = await AccountSyncService.syncUserAccounts(userId);
				results.push(userResult);

				console.log(
					`User ${userId}: ${userResult.successCount}/${userResult.totalAccounts} accounts synced successfully`,
				);
			}

			const totalDuration = Date.now() - startTime;
			const totalAccounts = results.reduce(
				(sum, r) => sum + r.totalAccounts,
				0,
			);
			const totalSuccess = results.reduce((sum, r) => sum + r.successCount, 0);
			const totalFailures = results.reduce((sum, r) => sum + r.failureCount, 0);

			console.log(
				`Full sync completed in ${totalDuration}ms: ${totalSuccess}/${totalAccounts} accounts synced successfully`,
			);

			return {
				totalUsers: uniqueUserIds.length,
				results,
				totalDuration,
			};
		} catch (error) {
			console.error("Error in full sync:", error);
			return {
				totalUsers: 0,
				results: [],
				totalDuration: Date.now() - startTime,
			};
		}
	}
}

// Export singleton instance
export const accountSyncService = AccountSyncService;
