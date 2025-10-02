/**
 * OAuth State Management Service
 * Provides secure, persistent storage for OAuth state tokens
 */

interface OAuthState {
	userId: string;
	providerId: string;
	expiresAt: number;
}

interface OAuthStateStore {
	set(state: string, data: OAuthState, ttlSeconds: number): Promise<void>;
	get(state: string): Promise<OAuthState | null>;
	delete(state: string): Promise<void>;
}

/**
 * Database-backed OAuth state storage for production use
 * Stores state in Supabase with automatic TTL cleanup
 */
class DatabaseOAuthStateStore implements OAuthStateStore {
	async set(
		state: string,
		data: OAuthState,
		ttlSeconds: number,
	): Promise<void> {
		const { supabaseAdmin } = await import("@/lib/supabase");

		const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

		const { error } = await supabaseAdmin.from("oauth_states").upsert({
			state_token: state,
			user_id: data.userId,
			provider_id: data.providerId,
			expires_at: expiresAt,
			created_at: new Date().toISOString(),
		});

		if (error) {
			throw new Error(`Failed to store OAuth state: ${error.message}`);
		}
	}

	async get(state: string): Promise<OAuthState | null> {
		const { supabaseAdmin } = await import("@/lib/supabase");

		const { data, error } = await supabaseAdmin
			.from("oauth_states")
			.select("user_id, provider_id, expires_at")
			.eq("state_token", state)
			.gt("expires_at", new Date().toISOString())
			.single();

		if (error || !data) {
			return null;
		}

		return {
			userId: data.user_id,
			providerId: data.provider_id,
			expiresAt: new Date(data.expires_at).getTime(),
		};
	}

	async delete(state: string): Promise<void> {
		const { supabaseAdmin } = await import("@/lib/supabase");

		await supabaseAdmin.from("oauth_states").delete().eq("state_token", state);
	}
}

/**
 * Memory-backed OAuth state storage for development only
 * WARNING: Do not use in production - state is lost on server restart
 */
class MemoryOAuthStateStore implements OAuthStateStore {
	private states = new Map<string, OAuthState>();

	async set(
		state: string,
		data: OAuthState,
		ttlSeconds: number,
	): Promise<void> {
		this.states.set(state, {
			...data,
			expiresAt: Date.now() + ttlSeconds * 1000,
		});

		// Clean up expired states periodically
		setTimeout(() => {
			if (this.states.has(state)) {
				const stateData = this.states.get(state);
				if (stateData && Date.now() > stateData.expiresAt) {
					this.states.delete(state);
				}
			}
		}, ttlSeconds * 1000);
	}

	async get(state: string): Promise<OAuthState | null> {
		const data = this.states.get(state);
		if (!data || Date.now() > data.expiresAt) {
			if (data) {
				this.states.delete(state);
			}
			return null;
		}
		return data;
	}

	async delete(state: string): Promise<void> {
		this.states.delete(state);
	}
}

/**
 * OAuth State Manager
 * Provides secure state token generation and validation
 */
export class OAuthStateManager {
	private store: OAuthStateStore;

	constructor() {
		// Always use database storage for persistence
		// Memory storage can lose state during dev server hot reloads
		this.store = new DatabaseOAuthStateStore();
	}

	/**
	 * Generate a secure state token and store associated data
	 */
	async generateState(userId: string, providerId: string): Promise<string> {
		// Generate cryptographically secure random state
		const { webcrypto } = await import("crypto");
		const array = new Uint8Array(32);
		webcrypto.getRandomValues(array);
		const state = Array.from(array, (byte) =>
			byte.toString(16).padStart(2, "0"),
		).join("");

		// Store state with 10 minute TTL
		await this.store.set(state, { userId, providerId, expiresAt: 0 }, 10 * 60);

		return state;
	}

	/**
	 * Validate and consume a state token
	 * Returns the associated data if valid, null if invalid/expired
	 */
	async validateAndConsumeState(
		state: string,
	): Promise<{ userId: string; providerId: string } | null> {
		const data = await this.store.get(state);
		if (!data) {
			return null;
		}

		// Delete state immediately after validation (one-time use)
		await this.store.delete(state);

		return {
			userId: data.userId,
			providerId: data.providerId,
		};
	}

	/**
	 * Clean up expired states (for maintenance)
	 */
	async cleanup(): Promise<void> {
		if (this.store instanceof DatabaseOAuthStateStore) {
			const { supabaseAdmin } = await import("@/lib/supabase");
			await supabaseAdmin
				.from("oauth_states")
				.delete()
				.lt("expires_at", new Date().toISOString());
		}
	}
}

// Singleton instance
export const oauthStateManager = new OAuthStateManager();
