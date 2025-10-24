import { config } from "@/lib/config";
import {
	TrueLayerService,
	TrueLayerServiceError,
} from "@/services/truelayer-service";

// Mock the config to avoid needing real API keys in tests
jest.mock("@/lib/config", () => ({
	config: {
		truelayer: {
			clientId: "test_client_id",
			clientSecret: "test_client_secret",
			apiUrl: "https://api.truelayer-sandbox.com",
			environment: "sandbox",
		},
	},
}));

// Mock fetch globally
global.fetch = jest.fn();

describe("TrueLayerService", () => {
	let service: TrueLayerService;

	beforeEach(() => {
		service = new TrueLayerService();
		jest.clearAllMocks();
	});

	describe("generateAuthUrl", () => {
		it("should generate correct auth URL for sandbox", () => {
			const providerId = "ob-monzo";
			const redirectUri = "https://localhost:3000/api/accounts/callback";
			const state = "test-state-123";

			const authUrl = service.generateAuthUrl(providerId, redirectUri, state);
			const parsed = new URL(authUrl);

			expect(authUrl).toContain("https://auth.truelayer.com");
			expect(authUrl).toContain(`client_id=${config.truelayer.clientId}`);
			expect(authUrl).toContain(
				`redirect_uri=${encodeURIComponent(redirectUri)}`,
			);
			expect(authUrl).toContain(`providers=${providerId}`);
			expect(authUrl).toContain(`state=${state}`);
			expect(parsed.searchParams.get("scope")).toBe(
				"info offline_access accounts balance transactions",
			);
			// Note: enable_mock is commented out in service for production readiness
		});

		it("should generate auth URL without mock mode for production", () => {
			// Temporarily modify the environment
			const originalEnv = config.truelayer.environment;
			(config.truelayer as any).environment = "production";

			const providerId = "ob-monzo";
			const redirectUri = "https://myapp.com/callback";

			const authUrl = service.generateAuthUrl(providerId, redirectUri);

			expect(authUrl).not.toContain("enable_mock=true");

			// Restore original environment
			(config.truelayer as any).environment = originalEnv;
		});

		it("should include custom scopes when provided", () => {
			const providerId = "cards-amex";
			const redirectUri = "https://localhost:3000/callback";
			const scopes = [
				"info",
				"offline_access",
				"cards",
				"cards.balance",
				"cards.transactions",
			];

			const authUrl = service.generateAuthUrl(
				providerId,
				redirectUri,
				undefined,
				scopes,
			);
			const parsed = new URL(authUrl);

			expect(parsed.searchParams.get("scope")).toBe(
				"info offline_access cards cards.balance cards.transactions",
			);
		});
	});

	describe("getClientCredentialsToken", () => {
		it("should successfully get client credentials token", async () => {
			const mockTokenResponse = {
				access_token: "test-token-123",
				token_type: "bearer",
				expires_in: 3600,
				scope: "info",
			};

			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue(mockTokenResponse),
			});

			const result = await service.getClientCredentialsToken();

			expect(result).toEqual(mockTokenResponse);
			expect(fetch).toHaveBeenCalledWith(
				"https://auth.truelayer.com/connect/token",
				expect.objectContaining({
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
				}),
			);
		});

		it("should handle API errors", async () => {
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: jest.fn().mockResolvedValue({
					error: "invalid_client",
					error_description: "Invalid client credentials",
				}),
			});

			await expect(service.getClientCredentialsToken()).rejects.toThrow(
				TrueLayerServiceError,
			);
		});
	});

	describe("exchangeCodeForToken", () => {
		it("should successfully exchange code for token", async () => {
			const mockTokenResponse = {
				access_token: "access-token-123",
				token_type: "bearer",
				expires_in: 3600,
				refresh_token: "refresh-token-123",
			};

			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue(mockTokenResponse),
			});

			const result = await service.exchangeCodeForToken(
				"auth-code-123",
				"https://localhost:3000/callback",
			);

			expect(result).toEqual(mockTokenResponse);
			expect(fetch).toHaveBeenCalledWith(
				"https://auth.truelayer.com/connect/token",
				expect.objectContaining({
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
				}),
			);
		});

		it("should handle invalid authorization code", async () => {
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: jest.fn().mockResolvedValue({
					error: "invalid_grant",
					error_description: "Invalid authorization code",
				}),
			});

			await expect(
				service.exchangeCodeForToken(
					"invalid-code",
					"https://localhost:3000/callback",
				),
			).rejects.toThrow(TrueLayerServiceError);
		});
	});

	describe("getProviders", () => {
		it("should fetch providers successfully", async () => {
			const mockProviders = [
				{
					provider_id: "ob-monzo",
					display_name: "Monzo",
					logo_uri: "https://truelayer.com/logos/monzo.png",
					icon_uri: "https://truelayer.com/icons/monzo.png",
					country_code: "GB",
					auth_type: "oauth",
					scopes: ["accounts", "balance", "transactions"],
					capabilities: {
						accounts: true,
						transactions: true,
						balance: true,
						cards: false,
						identity: true,
					},
				},
			];

			const mockTokenResponse = {
				access_token: "test-token",
				token_type: "bearer",
				expires_in: 3600,
			};

			// Mock the token call
			(fetch as jest.Mock)
				.mockResolvedValueOnce({
					ok: true,
					json: jest.fn().mockResolvedValue(mockTokenResponse),
				})
				// Base providers call
				.mockResolvedValueOnce({
					ok: true,
					json: jest.fn().mockResolvedValue(mockProviders),
				})
				// Card providers call (none returned)
				.mockResolvedValueOnce({
					ok: true,
					json: jest.fn().mockResolvedValue([]),
				});

			const result = await service.getProviders();

			expect(result).toEqual(mockProviders);
		});

		it("should include card providers when available", async () => {
			const mockTokenResponse = {
				access_token: "test-token",
				token_type: "bearer",
				expires_in: 3600,
			};

			const baseProviders = [
				{
					provider_id: "ob-monzo",
					display_name: "Monzo",
					scopes: ["accounts", "balance"],
				},
			];

			const cardProviders = [
				{
					provider_id: "cards-amex",
					display_name: "American Express",
					scopes: ["cards", "cards.balance", "cards.transactions"],
				},
			];

			(fetch as jest.Mock)
				.mockResolvedValueOnce({
					ok: true,
					json: jest.fn().mockResolvedValue(mockTokenResponse),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: jest.fn().mockResolvedValue(baseProviders),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: jest.fn().mockResolvedValue(cardProviders),
				});

			const result = await service.getProviders();

			expect(result).toHaveLength(2);
			expect(result).toEqual([
				{ ...baseProviders[0], scopes: baseProviders[0].scopes },
				{ ...cardProviders[0], scopes: cardProviders[0].scopes },
			]);
		});

		it("should continue when card providers fetch fails", async () => {
			const mockTokenResponse = {
				access_token: "test-token",
				token_type: "bearer",
				expires_in: 3600,
			};

			const baseProviders = [
				{
					provider_id: "ob-monzo",
					display_name: "Monzo",
					scopes: ["accounts"],
				},
			];

			const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

			(fetch as jest.Mock)
				.mockResolvedValueOnce({
					ok: true,
					json: jest.fn().mockResolvedValue(mockTokenResponse),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: jest.fn().mockResolvedValue(baseProviders),
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 403,
					json: jest.fn().mockResolvedValue({
						error: "forbidden",
						error_description: "Cards not enabled",
					}),
				});

			const result = await service.getProviders();

			expect(result).toEqual([
				{ ...baseProviders[0], scopes: baseProviders[0].scopes },
			]);

			warnSpy.mockRestore();
		});

		it("should return provider by id", async () => {
			const mockProviders = [
				{
					provider_id: "cards-amex",
					display_name: "American Express",
					logo_uri: "https://example.com/amex.svg",
					country_code: "US",
					scopes: ["cards", "cards.balance"],
					capabilities: {
						cards: true,
					},
				},
			];

			const mockTokenResponse = {
				access_token: "test-token",
				token_type: "bearer",
				expires_in: 3600,
			};

			(fetch as jest.Mock)
				.mockResolvedValueOnce({
					ok: true,
					json: jest.fn().mockResolvedValue(mockTokenResponse),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: jest.fn().mockResolvedValue([]),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: jest.fn().mockResolvedValue(mockProviders),
				});

			const provider = await service.getProviderById("cards-amex");

			expect(provider).toEqual(mockProviders[0]);
		});
	});

	describe("error handling", () => {
		it("should correctly identify rate limit errors", () => {
			const rateLimitError = new TrueLayerServiceError(
				"Rate limit exceeded",
				429,
				{
					error: "rate_limit_exceeded",
					error_description: "Too many requests",
				},
			);

			expect(TrueLayerServiceError.isRateLimitError(rateLimitError)).toBe(true);
			expect(TrueLayerServiceError.isServerError(rateLimitError)).toBe(false);
			expect(TrueLayerServiceError.isExpiredTokenError(rateLimitError)).toBe(
				false,
			);
		});

		it("should correctly identify server errors", () => {
			const serverError = new TrueLayerServiceError(
				"Internal server error",
				500,
				{
					error: "internal_error",
					error_description: "Something went wrong",
				},
			);

			expect(TrueLayerServiceError.isServerError(serverError)).toBe(true);
			expect(TrueLayerServiceError.isRateLimitError(serverError)).toBe(false);
			expect(TrueLayerServiceError.isExpiredTokenError(serverError)).toBe(
				false,
			);
		});

		it("should correctly identify expired token errors", () => {
			const expiredTokenError = new TrueLayerServiceError(
				"Token expired",
				401,
				{
					error: "invalid_token",
					error_description: "The access token expired",
				},
			);

			expect(TrueLayerServiceError.isExpiredTokenError(expiredTokenError)).toBe(
				true,
			);
			expect(TrueLayerServiceError.isRateLimitError(expiredTokenError)).toBe(
				false,
			);
			expect(TrueLayerServiceError.isServerError(expiredTokenError)).toBe(
				false,
			);
		});
	});
});
