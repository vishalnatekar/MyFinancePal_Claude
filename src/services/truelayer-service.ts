import { config } from "@/lib/config";
import type {
	TrueLayerAccessToken,
	TrueLayerAccount,
	TrueLayerAccountsResponse,
	TrueLayerBalance,
	TrueLayerBalanceResponse,
	TrueLayerCard,
	TrueLayerCardBalance,
	TrueLayerCardBalanceResponse,
	TrueLayerCardsResponse,
	TrueLayerCardTransaction,
	TrueLayerCardTransactionsResponse,
	TrueLayerError,
	TrueLayerProvider,
	TrueLayerTransaction,
	TrueLayerTransactionsResponse,
} from "@/types/truelayer";

export class TrueLayerService {
	private baseUrl: string;
	private clientId: string;
	private clientSecret: string;
	private environment: string;

	constructor() {
		this.baseUrl = config.truelayer.apiUrl;
		this.clientId = config.truelayer.clientId;
		this.clientSecret = config.truelayer.clientSecret;
		this.environment = config.truelayer.environment;
	}

	private async fetchWithAuth(
		endpoint: string,
		accessToken: string,
		options: RequestInit = {},
	): Promise<Response> {
		const url = `${this.baseUrl}${endpoint}`;
		const headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
			...options.headers,
		};

		const response = await fetch(url, {
			...options,
			headers,
		});

		if (!response.ok) {
			const error: TrueLayerError = await response.json().catch(() => ({
				error: "unknown_error",
				error_description: "An unknown error occurred",
			}));
			throw new TrueLayerServiceError(
				error.error_description || error.error,
				response.status,
				error,
			);
		}

		return response;
	}

	private async fetchWithClientCredentials(
		endpoint: string,
		options: RequestInit = {},
	): Promise<Response> {
		const url = `${this.baseUrl}${endpoint}`;
		const credentials = btoa(`${this.clientId}:${this.clientSecret}`);

		const headers = {
			"Content-Type": "application/json",
			Authorization: `Basic ${credentials}`,
			...options.headers,
		};

		const response = await fetch(url, {
			...options,
			headers,
		});

		if (!response.ok) {
			const error: TrueLayerError = await response.json().catch(() => ({
				error: "unknown_error",
				error_description: "An unknown error occurred",
			}));
			throw new TrueLayerServiceError(
				error.error_description || error.error,
				response.status,
				error,
			);
		}

		return response;
	}

	/**
	 * Get client credentials access token for public operations
	 */
	async getClientCredentialsToken(): Promise<TrueLayerAccessToken> {
		// Use the correct auth endpoint
		const authUrl = "https://auth.truelayer.com";
		const response = await fetch(`${authUrl}/connect/token`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "client_credentials",
				client_id: this.clientId,
				client_secret: this.clientSecret,
				scope: "info",
			}),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => null);
			throw new TrueLayerServiceError(
				"Failed to obtain client credentials token",
				response.status,
				error,
			);
		}

		return response.json();
	}

	/**
	 * Exchange authorization code for access token
	 */
	async exchangeCodeForToken(
		code: string,
		redirectUri: string,
	): Promise<TrueLayerAccessToken> {
		// Use the correct auth endpoint
		const authUrl = "https://auth.truelayer.com";
		const response = await fetch(`${authUrl}/connect/token`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "authorization_code",
				client_id: this.clientId,
				client_secret: this.clientSecret,
				code,
				redirect_uri: redirectUri,
			}),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => null);
			throw new TrueLayerServiceError(
				"Failed to exchange code for token",
				response.status,
				error,
			);
		}

		return response.json();
	}

	/**
	 * Refresh access token using refresh token
	 */
	async refreshToken(refreshToken: string): Promise<TrueLayerAccessToken> {
		// Use the correct auth endpoint
		const authUrl = "https://auth.truelayer.com";
		const response = await fetch(`${authUrl}/connect/token`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "refresh_token",
				client_id: this.clientId,
				client_secret: this.clientSecret,
				refresh_token: refreshToken,
			}),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => null);
			throw new TrueLayerServiceError(
				"Failed to refresh token",
				response.status,
				error,
			);
		}

		return response.json();
	}

	private normalizeProvider(provider: TrueLayerProvider): TrueLayerProvider {
		return {
			...provider,
			scopes: Array.isArray(provider.scopes) ? provider.scopes : [],
		};
	}

	private async fetchProviders(
		token: TrueLayerAccessToken,
		queryParams?: string,
	): Promise<TrueLayerProvider[]> {
		const authUrl = "https://auth.truelayer.com";
		const url =
			queryParams && queryParams.length > 0
				? `${authUrl}/api/providers?${queryParams}`
				: `${authUrl}/api/providers`;
		const response = await fetch(url, {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token.access_token}`,
			},
		});

		if (!response.ok) {
			const error: TrueLayerError = await response.json().catch(() => ({
				error: "unknown_error",
				error_description: "An unknown error occurred",
			}));
			throw new TrueLayerServiceError(
				error.error_description || error.error,
				response.status,
				error,
			);
		}

		const providers: TrueLayerProvider[] = await response.json();
		return providers.map((provider) => this.normalizeProvider(provider));
	}

	/**
	 * Get all available providers (accounts + cards)
	 */
	async getProviders(): Promise<TrueLayerProvider[]> {
		const token = await this.getClientCredentialsToken();
		const providersById = new Map<string, TrueLayerProvider>();

		const addProviders = (list: TrueLayerProvider[]) => {
			for (const provider of list) {
				providersById.set(provider.provider_id, provider);
			}
		};

		const baseProviders = await this.fetchProviders(token);
		addProviders(baseProviders);

		try {
			const cardProviders = await this.fetchProviders(token, "provider_type=cards");
			addProviders(cardProviders);
		} catch (error) {
			console.warn("Unable to fetch card providers from TrueLayer:", error);
		}

		return Array.from(providersById.values());
	}

	/**
	 * Get UK bank providers only (includes both accounts and cards)
	 */
	async getUKBankProviders(): Promise<TrueLayerProvider[]> {
		const providers = await this.getProviders();
		return providers.filter(
			(provider) =>
				(provider.country === "uk" || provider.country_code === "GB") &&
				(provider.scopes.includes("accounts") ||
					provider.scopes.some((scope) => scope.startsWith("cards")) ||
					provider.capabilities?.accounts === true ||
					provider.capabilities?.cards === true),
		);
	}

	/**
	 * Get single provider by ID
	 */
	async getProviderById(
		providerId: string,
	): Promise<TrueLayerProvider | null> {
		const providers = await this.getProviders();
		return (
			providers.find((provider) => provider.provider_id === providerId) ?? null
		);
	}

	/**
	 * Search providers by query (includes both accounts and cards)
	 */
	async searchProviders(query: string): Promise<TrueLayerProvider[]> {
		const allProviders = await this.getProviders();
		const searchTerm = query.toLowerCase();

		return allProviders.filter(
			(provider) =>
				(provider.scopes.includes("accounts") ||
					provider.scopes.some((scope) => scope.startsWith("cards")) ||
					provider.capabilities?.accounts === true ||
					provider.capabilities?.cards === true) &&
				(provider.display_name.toLowerCase().includes(searchTerm) ||
					provider.provider_id.toLowerCase().includes(searchTerm)),
		);
	}

	/**
	 * Generate authorization URL for connecting to a provider
	 */
	generateAuthUrl(
		providerId: string,
		redirectUri: string,
		state?: string,
		scopes?: string[],
	): string {
		// Use the correct auth endpoint (TrueLayer uses the root domain, not /auth)
		const authUrl = "https://auth.truelayer.com";
		// Request both account and card scopes for maximum compatibility
		const defaultScopes = [
			"info",
			"offline_access",
			"accounts",
			"balance",
			"transactions",
		];
		const scopeValues =
			scopes && scopes.length > 0
				? Array.from(new Set(scopes))
				: defaultScopes;
		const params = new URLSearchParams({
			response_type: "code",
			client_id: this.clientId,
			scope: scopeValues.join(" "),
			redirect_uri: redirectUri,
			providers: providerId,
		});

		if (state) {
			params.set("state", state);
		}

		// Only enable mock mode if explicitly in sandbox with mock providers
		// Remove enable_mock for real providers with real credentials
		// if (this.environment === "sandbox") {
		// 	params.set("enable_mock", "true");
		// }

		return `${authUrl}?${params.toString()}`;
	}

	/**
	 * Get user's connected accounts
	 */
	async getAccounts(accessToken: string): Promise<TrueLayerAccount[]> {
		const response = await this.fetchWithAuth("/data/v1/accounts", accessToken);
		const data: TrueLayerAccountsResponse = await response.json();
		return data.results;
	}

	/**
	 * Get account balance
	 */
	async getAccountBalance(
		accountId: string,
		accessToken: string,
	): Promise<TrueLayerBalance> {
		const response = await this.fetchWithAuth(
			`/data/v1/accounts/${accountId}/balance`,
			accessToken,
		);
		const data: TrueLayerBalanceResponse = await response.json();
		return data.results[0];
	}

	/**
	 * Get account transactions
	 */
	async getAccountTransactions(
		accountId: string,
		accessToken: string,
		from?: string,
		to?: string,
		limit = 100,
	): Promise<TrueLayerTransaction[]> {
		const params = new URLSearchParams();
		if (from) params.set("from", from);
		if (to) params.set("to", to);
		params.set("limit", limit.toString());

		const endpoint = `/data/v1/accounts/${accountId}/transactions?${params.toString()}`;
		const response = await this.fetchWithAuth(endpoint, accessToken);
		const data: TrueLayerTransactionsResponse = await response.json();
		return data.results;
	}

	/**
	 * Get user's connected cards
	 */
	async getCards(accessToken: string): Promise<TrueLayerCard[]> {
		const response = await this.fetchWithAuth("/data/v1/cards", accessToken);
		const data: TrueLayerCardsResponse = await response.json();
		return data.results;
	}

	/**
	 * Get card balance
	 */
	async getCardBalance(
		cardId: string,
		accessToken: string,
	): Promise<TrueLayerCardBalance> {
		const response = await this.fetchWithAuth(
			`/data/v1/cards/${cardId}/balance`,
			accessToken,
		);
		const data: TrueLayerCardBalanceResponse = await response.json();
		return data.results[0];
	}

	/**
	 * Get card transactions
	 */
	async getCardTransactions(
		cardId: string,
		accessToken: string,
		from?: string,
		to?: string,
		limit = 100,
	): Promise<TrueLayerCardTransaction[]> {
		const params = new URLSearchParams();
		if (from) params.set("from", from);
		if (to) params.set("to", to);
		params.set("limit", limit.toString());

		const endpoint = `/data/v1/cards/${cardId}/transactions?${params.toString()}`;
		const response = await this.fetchWithAuth(endpoint, accessToken);
		const data: TrueLayerCardTransactionsResponse = await response.json();
		return data.results;
	}

	/**
	 * Revoke access token
	 */
	async revokeToken(accessToken: string): Promise<void> {
		// Use the correct auth endpoint
		const authUrl = "https://auth.truelayer.com";
		await fetch(`${authUrl}/connect/token/revoke`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				token: accessToken,
				client_id: this.clientId,
				client_secret: this.clientSecret,
			}),
		});
	}
}

export class TrueLayerServiceError extends Error {
	constructor(
		message: string,
		public statusCode: number,
		public details?: TrueLayerError | null,
	) {
		super(message);
		this.name = "TrueLayerServiceError";
	}

	static isConnectionError(error: unknown): error is TrueLayerServiceError {
		return (
			error instanceof TrueLayerServiceError &&
			error.statusCode >= 400 &&
			error.statusCode < 500
		);
	}

	static isServerError(error: unknown): error is TrueLayerServiceError {
		return error instanceof TrueLayerServiceError && error.statusCode >= 500;
	}

	static isRateLimitError(error: unknown): error is TrueLayerServiceError {
		return error instanceof TrueLayerServiceError && error.statusCode === 429;
	}

	static isExpiredTokenError(error: unknown): error is TrueLayerServiceError {
		return error instanceof TrueLayerServiceError && error.statusCode === 401;
	}
}

// Error message mappings for user-friendly display
export const TRUELAYER_ERROR_MESSAGES = {
	CONNECTION_FAILED: {
		title: "Connection Failed",
		message: "We couldn't connect to your bank. Please try again.",
		action: "Retry Connection",
	},
	INSTITUTION_NOT_SUPPORTED: {
		title: "Bank Not Supported",
		message:
			"We don't support this institution yet. You can add accounts manually.",
		action: "Add Manually",
	},
	EXPIRED_CONNECTION: {
		title: "Connection Expired",
		message: "Your bank connection has expired. Please reconnect your account.",
		action: "Reconnect",
	},
	INVESTMENT_ACCOUNT_DETECTED: {
		title: "Investment Account Detected",
		message:
			"Investment accounts need to be added manually. We'll add automated support soon.",
		action: "Add Manually",
	},
	RATE_LIMIT: {
		title: "Too Many Requests",
		message: "Please wait a moment before trying again.",
		action: "Try Again Later",
	},
	SERVER_ERROR: {
		title: "Service Unavailable",
		message: "Our service is temporarily unavailable. Please try again later.",
		action: "Try Again",
	},
	INVALID_CREDENTIALS: {
		title: "Authentication Failed",
		message: "Please check your bank login credentials and try again.",
		action: "Try Again",
	},
} as const;

// Singleton instance
export const trueLayerService = new TrueLayerService();
