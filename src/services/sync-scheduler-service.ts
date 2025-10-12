/**
 * Sync Scheduler Service
 * Manages intelligent sync scheduling with rate limiting and priority syncing
 *
 * Features:
 * - Intelligent scheduling based on account activity
 * - Rate limiting to prevent API quota exhaustion
 * - Priority syncing for recently active accounts
 * - Conflict resolution for concurrent updates
 * - Sync status tracking and notifications
 */

import { supabaseAdmin } from "@/lib/supabase";

/**
 * Sync priority levels
 */
export enum SyncPriority {
	HIGH = "high", // Recently active accounts
	NORMAL = "normal", // Regular syncs
	LOW = "low", // Inactive accounts
}

/**
 * Sync schedule configuration
 */
export interface SyncSchedule {
	accountId: string;
	priority: SyncPriority;
	lastSyncedAt?: Date;
	nextSyncAt: Date;
	syncIntervalMinutes: number;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
	maxSyncsPerHour: number;
	maxConcurrentSyncs: number;
	cooldownPeriodMinutes: number;
}

/**
 * Sync result
 */
export interface SyncResult {
	accountId: string;
	status: "success" | "failed" | "rate_limited" | "conflict";
	syncedAt: Date;
	transactionsProcessed?: number;
	error?: string;
}

/**
 * Default rate limits
 */
const DEFAULT_RATE_LIMITS: RateLimitConfig = {
	maxSyncsPerHour: 60, // Max 60 syncs per hour per user
	maxConcurrentSyncs: 3, // Max 3 concurrent syncs
	cooldownPeriodMinutes: 5, // 5 minute cooldown after rate limit
};

/**
 * Sync interval by priority (in minutes)
 */
const SYNC_INTERVALS = {
	[SyncPriority.HIGH]: 30, // High priority: every 30 minutes
	[SyncPriority.NORMAL]: 360, // Normal: every 6 hours
	[SyncPriority.LOW]: 1440, // Low priority: every 24 hours
};

export class SyncSchedulerService {
	private static activeSyncs = new Map<
		string,
		{ userId: string; startedAt: Date }
	>();
	private static syncHistory = new Map<string, Date[]>();

	/**
	 * Check if account can be synced (rate limiting)
	 * @param userId - User ID
	 * @param accountId - Account ID
	 * @param rateLimits - Rate limit configuration
	 * @returns True if sync is allowed
	 */
	static canSync(
		userId: string,
		accountId: string,
		rateLimits: RateLimitConfig = DEFAULT_RATE_LIMITS,
	): { allowed: boolean; reason?: string; retryAfter?: Date } {
		// Check if already syncing
		if (this.activeSyncs.has(accountId)) {
			return {
				allowed: false,
				reason: "Sync already in progress",
			};
		}

		// Check concurrent syncs limit
		const userActiveSyncs = Array.from(this.activeSyncs.values()).filter(
			(sync) => sync.userId === userId,
		);
		if (userActiveSyncs.length >= rateLimits.maxConcurrentSyncs) {
			return {
				allowed: false,
				reason: `Maximum ${rateLimits.maxConcurrentSyncs} concurrent syncs reached`,
			};
		}

		// Check hourly rate limit
		const userSyncHistory = this.syncHistory.get(userId) || [];
		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
		const recentSyncs = userSyncHistory.filter((date) => date > oneHourAgo);

		if (recentSyncs.length >= rateLimits.maxSyncsPerHour) {
			const oldestSync = recentSyncs[0];
			const retryAfter = new Date(oldestSync.getTime() + 60 * 60 * 1000);
			return {
				allowed: false,
				reason: `Rate limit exceeded: ${rateLimits.maxSyncsPerHour} syncs per hour`,
				retryAfter,
			};
		}

		return { allowed: true };
	}

	/**
	 * Start a sync operation (registers in active syncs)
	 * @param userId - User ID
	 * @param accountId - Account ID
	 */
	static startSync(userId: string, accountId: string): void {
		this.activeSyncs.set(accountId, { userId, startedAt: new Date() });

		// Update sync history
		const history = this.syncHistory.get(userId) || [];
		history.push(new Date());
		this.syncHistory.set(userId, history);

		// Clean up old history (keep last 24 hours)
		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
		this.syncHistory.set(
			userId,
			history.filter((date) => date > oneDayAgo),
		);
	}

	/**
	 * Complete a sync operation (removes from active syncs)
	 * @param accountId - Account ID
	 */
	static completeSync(accountId: string): void {
		this.activeSyncs.delete(accountId);
	}

	/**
	 * Determine sync priority based on account activity
	 * @param accountId - Account ID
	 * @param lastTransactionDate - Date of last transaction
	 * @param lastSyncedAt - Date of last sync
	 * @returns Sync priority
	 */
	static async determineSyncPriority(
		accountId: string,
		lastTransactionDate?: Date,
		lastSyncedAt?: Date,
	): Promise<SyncPriority> {
		// If no last sync, give high priority
		if (!lastSyncedAt) {
			return SyncPriority.HIGH;
		}

		// If last transaction was recent (within 7 days), high priority
		if (lastTransactionDate) {
			const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
			if (lastTransactionDate > sevenDaysAgo) {
				return SyncPriority.HIGH;
			}
		}

		// If last sync was recent (within 12 hours), low priority
		const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
		if (lastSyncedAt > twelveHoursAgo) {
			return SyncPriority.LOW;
		}

		// Otherwise normal priority
		return SyncPriority.NORMAL;
	}

	/**
	 * Calculate next sync time based on priority
	 * @param priority - Sync priority
	 * @param lastSyncedAt - Date of last sync
	 * @returns Next sync date
	 */
	static calculateNextSyncTime(
		priority: SyncPriority,
		lastSyncedAt?: Date,
	): Date {
		const intervalMinutes = SYNC_INTERVALS[priority];
		const baseTime = lastSyncedAt || new Date();
		return new Date(baseTime.getTime() + intervalMinutes * 60 * 1000);
	}

	/**
	 * Get accounts that need syncing
	 * @param userId - User ID
	 * @returns Array of account IDs to sync
	 */
	static async getAccountsToSync(userId: string): Promise<string[]> {
		const { data: accounts, error } = await supabaseAdmin
			.from("financial_accounts")
			.select("id, last_synced")
			.eq("user_id", userId)
			.eq("is_manual", false) // Only sync connected accounts
			.eq("connection_status", "active");

		if (error || !accounts) {
			return [];
		}

		const now = new Date();
		const accountsToSync: string[] = [];

		for (const account of accounts) {
			const lastSynced = account.last_synced
				? new Date(account.last_synced)
				: undefined;

			const priority = await this.determineSyncPriority(
				account.id,
				undefined,
				lastSynced,
			);

			const nextSyncTime = this.calculateNextSyncTime(priority, lastSynced);

			if (now >= nextSyncTime) {
				accountsToSync.push(account.id);
			}
		}

		return accountsToSync;
	}

	/**
	 * Record sync attempt in data_sync_logs
	 * @param accountId - Account ID
	 * @param syncType - Type of sync
	 * @returns Log ID
	 */
	static async recordSyncStart(
		accountId: string,
		syncType: "manual" | "scheduled" | "retry",
	): Promise<string> {
		const { data, error } = await supabaseAdmin
			.from("data_sync_logs")
			.insert({
				account_id: accountId,
				sync_type: syncType,
				status: "started",
				started_at: new Date().toISOString(),
			})
			.select("id")
			.single();

		if (error) {
			throw new Error(`Failed to record sync start: ${error.message}`);
		}

		return data.id;
	}

	/**
	 * Update sync log with completion status
	 * @param logId - Sync log ID
	 * @param status - Final status
	 * @param transactionsProcessed - Number of transactions processed
	 * @param duplicatesFound - Number of duplicates found
	 * @param errors - Array of error messages
	 */
	static async recordSyncComplete(
		logId: string,
		status: "completed" | "failed",
		transactionsProcessed = 0,
		duplicatesFound = 0,
		errors: string[] = [],
	): Promise<void> {
		const { error } = await supabaseAdmin
			.from("data_sync_logs")
			.update({
				status,
				transactions_processed: transactionsProcessed,
				duplicates_found: duplicatesFound,
				errors_encountered: errors,
				completed_at: new Date().toISOString(),
			})
			.eq("id", logId);

		if (error) {
			console.error("Failed to record sync completion:", error);
		}
	}

	/**
	 * Handle sync conflict (concurrent updates)
	 * @param accountId - Account ID
	 * @param localVersion - Local data version
	 * @param remoteVersion - Remote data version
	 * @returns Resolution strategy
	 */
	static resolveSyncConflict(
		accountId: string,
		localVersion: Date,
		remoteVersion: Date,
	): "use_local" | "use_remote" | "merge" {
		// Simple strategy: newest wins
		if (remoteVersion > localVersion) {
			return "use_remote";
		}

		if (localVersion > remoteVersion) {
			return "use_local";
		}

		// Same timestamp: merge
		return "merge";
	}

	/**
	 * Get sync statistics for user
	 * @param userId - User ID
	 * @param days - Number of days to look back
	 * @returns Sync statistics
	 */
	static async getSyncStatistics(
		userId: string,
		days = 7,
	): Promise<{
		totalSyncs: number;
		successfulSyncs: number;
		failedSyncs: number;
		totalTransactionsProcessed: number;
		totalDuplicatesFound: number;
		averageSyncDuration: number;
	}> {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const { data: logs, error } = await supabaseAdmin
			.from("data_sync_logs")
			.select("*, financial_accounts!inner(user_id)")
			.eq("financial_accounts.user_id", userId)
			.gte("started_at", startDate.toISOString());

		if (error || !logs) {
			return {
				totalSyncs: 0,
				successfulSyncs: 0,
				failedSyncs: 0,
				totalTransactionsProcessed: 0,
				totalDuplicatesFound: 0,
				averageSyncDuration: 0,
			};
		}

		const totalSyncs = logs.length;
		const successfulSyncs = logs.filter((l) => l.status === "completed").length;
		const failedSyncs = logs.filter((l) => l.status === "failed").length;
		const totalTransactionsProcessed = logs.reduce(
			(sum, l) => sum + (l.transactions_processed || 0),
			0,
		);
		const totalDuplicatesFound = logs.reduce(
			(sum, l) => sum + (l.duplicates_found || 0),
			0,
		);

		// Calculate average sync duration
		const durations = logs
			.filter((l) => l.started_at && l.completed_at)
			.map((l) => {
				const start = new Date(l.started_at).getTime();
				const end = new Date(l.completed_at).getTime();
				return end - start;
			});

		const averageSyncDuration =
			durations.length > 0
				? durations.reduce((sum, d) => sum + d, 0) / durations.length
				: 0;

		return {
			totalSyncs,
			successfulSyncs,
			failedSyncs,
			totalTransactionsProcessed,
			totalDuplicatesFound,
			averageSyncDuration: Math.round(averageSyncDuration / 1000), // Convert to seconds
		};
	}

	/**
	 * Clear sync history (for testing)
	 */
	static clearSyncHistory(): void {
		this.activeSyncs.clear();
		this.syncHistory.clear();
	}
}
