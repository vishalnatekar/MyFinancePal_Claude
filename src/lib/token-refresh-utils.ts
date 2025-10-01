import { CryptoService } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { TrueLayerService } from "@/services/truelayer-service";
import type { TrueLayerAccessToken } from "@/types/truelayer";

/**
 * Token Refresh Utilities
 *
 * Shared logic for refreshing TrueLayer access tokens and updating database storage.
 * Extracted from account-sync-service and callback handler to eliminate duplication.
 */

export interface StoredTokenData {
	access_token: string;
	refresh_token?: string;
	expires_at: number;
}

export interface RefreshTokenResult {
	accessToken: string;
	tokenRefreshed: boolean;
	error?: string;
}

/**
 * Decrypt and parse stored token data from encrypted string
 */
export function decryptTokenData(encryptedToken: string): StoredTokenData {
	const decrypted = CryptoService.decrypt(encryptedToken);
	return JSON.parse(decrypted);
}

/**
 * Encrypt and serialize token data for database storage
 */
export function encryptTokenData(tokenData: StoredTokenData): string {
	return CryptoService.encrypt(JSON.stringify(tokenData));
}

/**
 * Check if a token is expired or will expire soon (within 5 minutes)
 */
export function isTokenExpired(expiresAt: number): boolean {
	const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
	return Date.now() >= expiresAt - EXPIRY_BUFFER_MS;
}

/**
 * Refresh an access token and update the database
 *
 * @param accountId - The financial account ID
 * @param tokenData - Current token data (must include refresh_token)
 * @returns Updated access token or error
 */
export async function refreshAndUpdateToken(
	accountId: string,
	tokenData: StoredTokenData,
): Promise<RefreshTokenResult> {
	if (!tokenData.refresh_token) {
		return {
			accessToken: tokenData.access_token,
			tokenRefreshed: false,
			error: "No refresh token available",
		};
	}

	try {
		const trueLayerService = new TrueLayerService();
		const refreshedTokens: TrueLayerAccessToken =
			await trueLayerService.refreshToken(tokenData.refresh_token);

		// Prepare new token data
		const newTokenData: StoredTokenData = {
			access_token: refreshedTokens.access_token,
			refresh_token: refreshedTokens.refresh_token || tokenData.refresh_token,
			expires_at: Date.now() + refreshedTokens.expires_in * 1000,
		};

		// Update database with new encrypted token
		const { error: updateError } = await supabaseAdmin
			.from("financial_accounts")
			.update({
				encrypted_access_token: encryptTokenData(newTokenData),
				updated_at: new Date().toISOString(),
			})
			.eq("id", accountId);

		if (updateError) {
			console.error(
				"Failed to update refreshed token in database:",
				updateError,
			);
			return {
				accessToken: refreshedTokens.access_token,
				tokenRefreshed: true,
				error: "Token refreshed but database update failed",
			};
		}

		return {
			accessToken: refreshedTokens.access_token,
			tokenRefreshed: true,
		};
	} catch (error) {
		console.error("Token refresh failed:", error);
		return {
			accessToken: tokenData.access_token,
			tokenRefreshed: false,
			error: error instanceof Error ? error.message : "Unknown refresh error",
		};
	}
}

/**
 * Get a valid access token, refreshing if necessary
 *
 * @param accountId - The financial account ID
 * @param encryptedToken - Encrypted token data from database
 * @returns Valid access token or throws error
 */
export async function getValidAccessToken(
	accountId: string,
	encryptedToken: string,
): Promise<string> {
	const tokenData = decryptTokenData(encryptedToken);

	// If token is not expired, return as-is
	if (!isTokenExpired(tokenData.expires_at)) {
		return tokenData.access_token;
	}

	// Token expired - attempt refresh
	const result = await refreshAndUpdateToken(accountId, tokenData);

	if (result.error && !result.tokenRefreshed) {
		throw new Error(`Token expired and refresh failed: ${result.error}`);
	}

	return result.accessToken;
}

/**
 * Mark account connection as expired in database
 */
export async function markConnectionExpired(
	accountId: string,
	errorMessage?: string,
): Promise<void> {
	await supabaseAdmin
		.from("financial_accounts")
		.update({
			connection_status: "expired",
			updated_at: new Date().toISOString(),
		})
		.eq("id", accountId);

	console.warn(
		`Connection marked as expired for account ${accountId}:`,
		errorMessage,
	);
}
