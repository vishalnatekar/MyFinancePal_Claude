import { expect, test } from "@playwright/test";

test.describe("Account Connection Flow", () => {
	test.beforeEach(async ({ page }) => {
		// Mock authentication
		await page.route("**/api/auth/callback", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					user: { id: "test-user", email: "test@example.com" },
				}),
			});
		});

		// Mock accounts API
		await page.route("**/api/accounts", (route) => {
			if (route.request().method() === "GET") {
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ accounts: [] }),
				});
			} else if (route.request().method() === "POST") {
				const body = route.request().postDataJSON();
				route.fulfill({
					status: 201,
					contentType: "application/json",
					body: JSON.stringify({
						account: {
							id: "new-account-123",
							...body,
							user_id: "test-user",
							created_at: new Date().toISOString(),
						},
					}),
				});
			}
		});

		// Mock providers API
		await page.route("**/api/accounts/providers", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					providers: [
						{
							id: "monzo",
							name: "Monzo",
							displayName: "Monzo Bank",
							logo: "https://via.placeholder.com/40x40/FF6B6B/FFFFFF?text=M",
							status: "active",
							country: "GB",
							type: "bank",
							features: {
								accounts: true,
								transactions: true,
								balance: true,
								identity: true,
							},
						},
						{
							id: "starling",
							name: "Starling",
							displayName: "Starling Bank",
							logo: "https://via.placeholder.com/40x40/4ECDC4/FFFFFF?text=S",
							status: "active",
							country: "GB",
							type: "bank",
							features: {
								accounts: true,
								transactions: true,
								balance: true,
								identity: true,
							},
						},
					],
				}),
			});
		});

		// Mock connection initiation
		await page.route("**/api/accounts/connect", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					authUrl: "https://auth.truelayer.com?code=test123",
					connectionId: "connection-123",
					state: "test-state",
				}),
			});
		});

		// Navigate to accounts page
		await page.goto("/accounts");
	});

	test("should display empty state when no accounts exist", async ({
		page,
	}) => {
		await expect(page.getByText("No Accounts Connected")).toBeVisible();
		await expect(
			page.getByText("Get started by connecting your first bank account"),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Add Account" }),
		).toBeVisible();
	});

	test("should open account connection dialog", async ({ page }) => {
		await page.getByRole("button", { name: "Add Account" }).click();

		await expect(page.getByText("Add an Account")).toBeVisible();
		await expect(page.getByText("Connect Bank")).toBeVisible();
		await expect(page.getByText("Add Manually")).toBeVisible();
	});

	test("should show institution selector when connecting bank", async ({
		page,
	}) => {
		await page.getByRole("button", { name: "Add Account" }).click();
		await page.getByText("Connect Bank").click();

		await expect(page.getByText("Connect Your Bank Account")).toBeVisible();
		await expect(
			page.getByPlaceholder("e.g. Monzo, Barclays, Halifax..."),
		).toBeVisible();
		await expect(page.getByText("Monzo Bank")).toBeVisible();
		await expect(page.getByText("Starling Bank")).toBeVisible();
	});

	test("should filter institutions based on search", async ({ page }) => {
		await page.getByRole("button", { name: "Add Account" }).click();
		await page.getByText("Connect Bank").click();

		const searchInput = page.getByPlaceholder(
			"e.g. Monzo, Barclays, Halifax...",
		);
		await searchInput.fill("monzo");

		await expect(page.getByText("Monzo Bank")).toBeVisible();
		await expect(page.getByText("Starling Bank")).not.toBeVisible();
	});

	test("should initiate connection flow when selecting institution", async ({
		page,
	}) => {
		await page.getByRole("button", { name: "Add Account" }).click();
		await page.getByText("Connect Bank").click();

		// Mock external redirect to prevent actual navigation
		await page.route("https://auth.truelayer.com/**", (route) => {
			// Simulate successful OAuth callback
			route.fulfill({
				status: 302,
				headers: {
					Location: "/api/accounts/callback?code=auth123&state=test-state",
				},
			});
		});

		await page
			.getByText("Monzo Bank")
			.locator("..")
			.getByRole("button", { name: "Connect" })
			.click();

		// Should redirect to TrueLayer OAuth
		await page.waitForURL("**/auth.truelayer.com/**");
	});

	test("should show manual account form", async ({ page }) => {
		await page.getByRole("button", { name: "Add Account" }).click();
		await page.getByText("Add Manually").click();

		await expect(page.getByText("Add Manual Account")).toBeVisible();
		await expect(page.getByLabel("Account Type")).toBeVisible();
		await expect(page.getByLabel("Account Name")).toBeVisible();
		await expect(page.getByLabel("Institution Name")).toBeVisible();
		await expect(page.getByLabel("Current Balance (£)")).toBeVisible();
	});

	test("should create manual account with valid data", async ({ page }) => {
		await page.getByRole("button", { name: "Add Account" }).click();
		await page.getByText("Add Manually").click();

		// Fill form
		await page.getByLabel("Account Type").click();
		await page.getByText("Checking Account").click();
		await page.getByLabel("Account Name").fill("Test Checking Account");
		await page.getByLabel("Institution Name").fill("Test Bank");
		await page.getByLabel("Current Balance (£)").fill("1000.00");

		await page.getByRole("button", { name: "Create Account" }).click();

		// Should close dialog and refresh accounts
		await expect(page.getByText("Add Manual Account")).not.toBeVisible();
	});

	test("should validate manual account form", async ({ page }) => {
		await page.getByRole("button", { name: "Add Account" }).click();
		await page.getByText("Add Manually").click();

		// Try to submit with empty fields
		await page.getByRole("button", { name: "Create Account" }).click();

		// Should show validation errors
		await expect(page.getByText("Please select an account type")).toBeVisible();
		await expect(page.getByText("Account name is required")).toBeVisible();
		await expect(page.getByText("Institution name is required")).toBeVisible();
	});

	test("should navigate back from institution selector", async ({ page }) => {
		await page.getByRole("button", { name: "Add Account" }).click();
		await page.getByText("Connect Bank").click();
		await page.getByText("← Back").click();

		await expect(page.getByText("Add an Account")).toBeVisible();
		await expect(page.getByText("Connect Bank")).toBeVisible();
		await expect(page.getByText("Add Manually")).toBeVisible();
	});

	test("should navigate back from manual form", async ({ page }) => {
		await page.getByRole("button", { name: "Add Account" }).click();
		await page.getByText("Add Manually").click();
		await page.getByText("← Back").click();

		await expect(page.getByText("Add an Account")).toBeVisible();
	});

	test("should handle connection errors gracefully", async ({ page }) => {
		// Mock connection error
		await page.route("**/api/accounts/connect", (route) => {
			route.fulfill({
				status: 500,
				contentType: "application/json",
				body: JSON.stringify({ error: "Connection failed" }),
			});
		});

		await page.getByRole("button", { name: "Add Account" }).click();
		await page.getByText("Connect Bank").click();

		await page
			.getByText("Monzo Bank")
			.locator("..")
			.getByRole("button", { name: "Connect" })
			.click();

		// Should show error message
		await expect(page.getByText("Connection failed")).toBeVisible();
	});

	test("should handle successful OAuth callback", async ({ page }) => {
		// Mock OAuth callback success
		await page.route("**/api/accounts/callback", (route) => {
			route.fulfill({
				status: 302,
				headers: {
					Location:
						"/accounts?success=true&message=Account connected successfully",
				},
			});
		});

		// Navigate directly to callback URL (simulating OAuth return)
		await page.goto(
			"/accounts?success=true&message=Account connected successfully",
		);

		await expect(
			page.getByText("Account connected successfully!"),
		).toBeVisible();
	});

	test("should handle OAuth callback errors", async ({ page }) => {
		await page.goto(
			"/accounts?error=connection_failed&message=Failed to connect account",
		);

		await expect(
			page.getByText("Failed to connect account. Please try again."),
		).toBeVisible();
	});

	test("should display account overview when accounts exist", async ({
		page,
	}) => {
		// Mock accounts response with data
		await page.route("**/api/accounts", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					accounts: [
						{
							id: "account-1",
							account_type: "checking",
							account_name: "Main Account",
							institution_name: "Monzo Bank",
							current_balance: 1500.5,
							is_shared: false,
							is_manual: false,
							connection_status: "active",
							last_synced: "2023-01-01T12:00:00Z",
						},
						{
							id: "account-2",
							account_type: "savings",
							account_name: "Savings Account",
							institution_name: "Test Bank",
							current_balance: 5000.0,
							is_shared: false,
							is_manual: true,
							connection_status: "active",
						},
					],
				}),
			});
		});

		await page.reload();

		await expect(page.getByText("Main Account")).toBeVisible();
		await expect(page.getByText("Monzo Bank")).toBeVisible();
		await expect(page.getByText("£1,500.50")).toBeVisible();
		await expect(page.getByText("Connected")).toBeVisible();

		await expect(page.getByText("Savings Account")).toBeVisible();
		await expect(page.getByText("Manual")).toBeVisible();
		await expect(page.getByText("£5,000.00")).toBeVisible();

		// Should show overview stats
		await expect(page.getByText("£6,500.50")).toBeVisible(); // Total balance
		await expect(page.getByText("Across 2 accounts")).toBeVisible();
	});

	test("should filter accounts by tabs", async ({ page }) => {
		// Mock accounts response
		await page.route("**/api/accounts", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					accounts: [
						{
							id: "connected-account",
							account_name: "Connected Account",
							is_manual: false,
							connection_status: "active",
							current_balance: 1000,
						},
						{
							id: "manual-account",
							account_name: "Manual Account",
							is_manual: true,
							current_balance: 2000,
						},
					],
				}),
			});
		});

		await page.reload();

		// Test Connected tab
		await page.getByRole("tab", { name: "Connected" }).click();
		await expect(page.getByText("Connected Account")).toBeVisible();
		await expect(page.getByText("Manual Account")).not.toBeVisible();

		// Test Manual tab
		await page.getByRole("tab", { name: "Manual" }).click();
		await expect(page.getByText("Manual Account")).toBeVisible();
		await expect(page.getByText("Connected Account")).not.toBeVisible();

		// Test All tab
		await page.getByRole("tab", { name: "All Accounts" }).click();
		await expect(page.getByText("Connected Account")).toBeVisible();
		await expect(page.getByText("Manual Account")).toBeVisible();
	});
});
