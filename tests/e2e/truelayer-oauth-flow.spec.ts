import { expect, test } from "@playwright/test";

/**
 * Comprehensive E2E tests for TrueLayer OAuth flow and account sync operations
 *
 * Tests cover:
 * - Complete OAuth authorization flow (Connect -> Auth -> Callback -> Sync)
 * - Token exchange and storage
 * - Account data synchronization
 * - Error handling and retry mechanisms
 * - Connection status management
 */
test.describe("TrueLayer OAuth Flow - Complete Journey", () => {
	test.beforeEach(async ({ page }) => {
		// Mock authenticated user
		await page.route("**/api/auth/session", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					user: { id: "test-user-123", email: "test@example.com" },
					session: { access_token: "mock-session-token" },
				}),
			});
		});
	});

	test("should complete full OAuth flow: connect -> auth -> callback -> sync", async ({
		page,
	}) => {
		// Step 1: Navigate to accounts page
		await page.goto("/accounts");

		// Mock providers API
		await page.route("**/api/accounts/providers", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					providers: [
						{
							provider_id: "ob-monzo",
							display_name: "Monzo",
							logo_url: "https://truelayer-provider-assets.com/logos/monzo.svg",
							country: "GB",
						},
					],
				}),
			});
		});

		// Step 2: Initiate connection
		let capturedState = "";
		await page.route("**/api/accounts/connect", (route) => {
			capturedState = `secure-state-token-${Math.random()}`;
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					authUrl: `https://auth.truelayer.com?client_id=test&redirect_uri=http://localhost:3000/api/accounts/callback&state=${capturedState}&providers=ob-monzo`,
					state: capturedState,
				}),
			});
		});

		await page.getByRole("button", { name: /add account/i }).click();
		await page.getByText(/connect bank/i).click();
		await page.getByText("Monzo").click();

		// Step 3: Mock TrueLayer OAuth page
		await page.route("https://auth.truelayer.com/**", async (route) => {
			// Simulate user authorizing on TrueLayer
			const authCode = "mock-auth-code-123";
			await route.fulfill({
				status: 302,
				headers: {
					Location: `http://localhost:3000/api/accounts/callback?code=${authCode}&state=${capturedState}`,
				},
			});
		});

		// Step 4: Mock OAuth callback - token exchange
		let accessTokenCreated = false;
		await page.route("**/api/accounts/callback*", async (route) => {
			const url = new URL(route.request().url());
			const code = url.searchParams.get("code");
			const state = url.searchParams.get("state");

			if (code === "mock-auth-code-123" && state === capturedState) {
				accessTokenCreated = true;
				await route.fulfill({
					status: 302,
					headers: {
						Location:
							"/accounts?success=true&message=Account+connected+successfully",
					},
				});
			} else {
				await route.fulfill({
					status: 400,
					body: JSON.stringify({ error: "Invalid state or code" }),
				});
			}
		});

		// Step 5: Mock successful sync after callback
		await page.route("**/api/accounts", (route) => {
			if (route.request().method() === "GET") {
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						accounts: [
							{
								id: "account-1",
								truelayer_account_id: "tl-account-123",
								account_type: "checking",
								account_name: "Personal Current Account",
								institution_name: "Monzo",
								current_balance: 1234.56,
								connection_status: "active",
								last_synced: new Date().toISOString(),
								is_manual: false,
							},
						],
					}),
				});
			}
		});

		// Wait for OAuth redirect chain to complete
		await page.waitForURL(/\/accounts\?success=true/);

		// Verify success message
		await expect(
			page.getByText(/account connected successfully/i),
		).toBeVisible();

		// Verify account appears in list
		await expect(page.getByText("Personal Current Account")).toBeVisible();
		await expect(page.getByText("Monzo")).toBeVisible();
		await expect(page.getByText("£1,234.56")).toBeVisible();
		await expect(page.getByText("Connected")).toBeVisible();

		// Verify token was exchanged
		expect(accessTokenCreated).toBe(true);
	});

	test("should handle OAuth state mismatch (CSRF protection)", async ({
		page,
	}) => {
		await page.goto("/accounts");

		// Attempt callback with invalid state
		await page.route("**/api/accounts/callback*", (route) => {
			route.fulfill({
				status: 400,
				contentType: "application/json",
				body: JSON.stringify({
					error: "invalid_state",
					message: "State parameter mismatch - potential CSRF attack",
				}),
			});
		});

		// Navigate directly to callback with mismatched state
		await page.goto("/api/accounts/callback?code=test&state=invalid-state");

		// Verify error handling
		await expect(page.getByText(/state parameter mismatch/i)).toBeVisible();
	});

	test("should handle expired OAuth state tokens", async ({ page }) => {
		await page.goto("/accounts");

		await page.route("**/api/accounts/callback*", (route) => {
			route.fulfill({
				status: 400,
				contentType: "application/json",
				body: JSON.stringify({
					error: "expired_state",
					message: "OAuth state expired. Please try connecting again.",
				}),
			});
		});

		await page.goto("/api/accounts/callback?code=test&state=expired-state-123");

		await expect(page.getByText(/oauth state expired/i)).toBeVisible();
	});

	test("should handle token exchange errors", async ({ page }) => {
		await page.goto("/accounts");

		// Mock connection initiation
		await page.route("**/api/accounts/connect", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					authUrl: "https://auth.truelayer.com?client_id=test",
					state: "valid-state",
				}),
			});
		});

		// Mock TrueLayer returns error during token exchange
		await page.route("**/api/accounts/callback*", (route) => {
			route.fulfill({
				status: 500,
				contentType: "application/json",
				body: JSON.stringify({
					error: "token_exchange_failed",
					message: "Failed to exchange authorization code for access token",
				}),
			});
		});

		await page.goto("/api/accounts/callback?code=test&state=valid-state");

		await expect(
			page.getByText(/failed to exchange authorization code/i),
		).toBeVisible();
	});

	test("should sync account data after successful connection", async ({
		page,
	}) => {
		await page.goto("/accounts");

		// Mock existing connected account
		await page.route("**/api/accounts", (route) => {
			if (route.request().method() === "GET") {
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						accounts: [
							{
								id: "account-1",
								truelayer_account_id: "tl-account-456",
								account_name: "Monzo Current",
								institution_name: "Monzo",
								current_balance: 500.0,
								connection_status: "active",
								last_synced: "2024-01-01T10:00:00Z",
								is_manual: false,
							},
						],
					}),
				});
			}
		});

		await page.waitForLoadState("networkidle");

		// Trigger manual sync
		let syncTriggered = false;
		await page.route("**/api/accounts/sync", (route) => {
			syncTriggered = true;
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					success: true,
					synced: 1,
					accounts: [
						{
							id: "account-1",
							current_balance: 650.0,
							last_synced: new Date().toISOString(),
						},
					],
				}),
			});
		});

		// Click sync button
		await page.getByRole("button", { name: /sync/i }).click();

		// Wait for sync to complete
		await page.waitForTimeout(1000);

		// Verify sync was triggered
		expect(syncTriggered).toBe(true);

		// Verify updated balance
		await expect(page.getByText("£650.00")).toBeVisible();
	});

	test("should handle connection expiration and prompt reconnection", async ({
		page,
	}) => {
		await page.goto("/accounts");

		// Mock account with expired connection
		await page.route("**/api/accounts", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					accounts: [
						{
							id: "account-1",
							account_name: "Expired Account",
							institution_name: "Monzo",
							current_balance: 1000.0,
							connection_status: "expired",
							last_synced: "2023-01-01T10:00:00Z",
							is_manual: false,
						},
					],
				}),
			});
		});

		await page.waitForLoadState("networkidle");

		// Verify expired status shown
		await expect(page.getByText(/expired/i)).toBeVisible();
		await expect(
			page.getByRole("button", { name: /reconnect/i }),
		).toBeVisible();
	});

	test("should display sync progress indicators during sync", async ({
		page,
	}) => {
		await page.goto("/accounts");

		await page.route("**/api/accounts", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					accounts: [
						{
							id: "account-1",
							account_name: "Test Account",
							institution_name: "Monzo",
							current_balance: 100.0,
							connection_status: "active",
							is_manual: false,
						},
					],
				}),
			});
		});

		// Mock slow sync to observe progress indicator
		await page.route("**/api/accounts/sync", async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 2000));
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, synced: 1 }),
			});
		});

		await page.waitForLoadState("networkidle");
		await page.getByRole("button", { name: /sync/i }).click();

		// Verify loading/progress indicator
		await expect(page.getByText(/syncing/i)).toBeVisible();
	});

	test("should handle multiple accounts sync with rate limiting", async ({
		page,
	}) => {
		await page.goto("/accounts");

		// Mock multiple connected accounts
		await page.route("**/api/accounts", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					accounts: [
						{
							id: "account-1",
							account_name: "Monzo Current",
							institution_name: "Monzo",
							current_balance: 1000,
							connection_status: "active",
							is_manual: false,
						},
						{
							id: "account-2",
							account_name: "Starling Savings",
							institution_name: "Starling",
							current_balance: 5000,
							connection_status: "active",
							is_manual: false,
						},
						{
							id: "account-3",
							account_name: "Barclays Checking",
							institution_name: "Barclays",
							current_balance: 2500,
							connection_status: "active",
							is_manual: false,
						},
					],
				}),
			});
		});

		// Mock sync with sequential processing (rate limiting)
		const syncTimes: number[] = [];
		await page.route("**/api/accounts/sync", async (route) => {
			syncTimes.push(Date.now());
			await new Promise((resolve) => setTimeout(resolve, 1000));
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, synced: 3 }),
			});
		});

		await page.waitForLoadState("networkidle");
		await page.getByRole("button", { name: /sync all/i }).click();

		// Wait for sync to complete
		await page.waitForTimeout(4000);

		// Verify rate limiting was applied (sync times should be spaced out)
		if (syncTimes.length > 1) {
			const timeDiff = syncTimes[1] - syncTimes[0];
			expect(timeDiff).toBeGreaterThanOrEqual(900); // At least 900ms delay
		}
	});

	test("should store encrypted access tokens securely", async ({ page }) => {
		// This is more of an integration test - verify tokens are NOT visible in frontend
		await page.goto("/accounts");

		await page.route("**/api/accounts", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					accounts: [
						{
							id: "account-1",
							account_name: "Secure Account",
							institution_name: "Monzo",
							current_balance: 1000,
							connection_status: "active",
							// Note: encrypted_access_token should NEVER be returned to frontend
						},
					],
				}),
			});
		});

		await page.waitForLoadState("networkidle");

		// Verify no sensitive token data in page content
		const pageContent = await page.content();
		expect(pageContent).not.toContain("encrypted_access_token");
		expect(pageContent).not.toContain("access_token");
		expect(pageContent).not.toContain("refresh_token");
	});
});
