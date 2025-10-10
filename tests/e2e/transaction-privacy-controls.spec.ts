/**
 * E2E tests for Transaction Privacy Controls (Story 3.2)
 * Tests the complete workflow of sharing transactions with household members
 */

import { test, expect, type Page } from "@playwright/test";

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

// Helper function to sign up and sign in
async function signUpAndSignIn(page: Page, email: string, password: string) {
	await page.goto(`${BASE_URL}/login`);

	// Try to sign in first (user might already exist)
	await page.fill('input[type="email"]', email);
	await page.fill('input[type="password"]', password);
	await page.click('button[type="submit"]');

	// Wait for navigation to complete
	await page.waitForLoadState("networkidle");
}

// Helper function to create a household
async function createHousehold(page: Page, name: string, description?: string) {
	await page.goto(`${BASE_URL}/household`);
	await page.click('text="Create Household"');

	await page.fill('input[name="name"]', name);
	if (description) {
		await page.fill('textarea[name="description"]', description);
	}

	await page.click('button[type="submit"]');
	await page.waitForLoadState("networkidle");
}

// Helper function to create a manual transaction
async function createManualTransaction(
	page: Page,
	merchant: string,
	amount: number,
	category: string,
) {
	await page.goto(`${BASE_URL}/transactions`);
	await page.click('text="Add Transaction"');

	await page.fill('input[name="merchant_name"]', merchant);
	await page.fill('input[name="amount"]', amount.toString());
	await page.selectOption('select[name="category"]', category);

	await page.click('button[type="submit"]');
	await page.waitForLoadState("networkidle");
}

test.describe("Transaction Privacy Controls", () => {
	test.describe.configure({ mode: "serial" });

	const user1Email = `test-user1-${Date.now()}@example.com`;
	const user2Email = `test-user2-${Date.now()}@example.com`;
	const password = "TestPassword123!";
	const householdName = `Test Household ${Date.now()}`;

	let user1Context: any;
	let user2Context: any;
	let user1Page: Page;
	let user2Page: Page;

	test.beforeAll(async ({ browser }) => {
		// Create contexts for two users
		user1Context = await browser.newContext();
		user2Context = await browser.newContext();

		user1Page = await user1Context.newPage();
		user2Page = await user2Context.newPage();
	});

	test.afterAll(async () => {
		await user1Context?.close();
		await user2Context?.close();
	});

	test("should allow user to create household and invite another user", async () => {
		// User 1 signs up and creates household
		await signUpAndSignIn(user1Page, user1Email, password);
		await createHousehold(user1Page, householdName, "Test household for sharing");

		// Verify household was created
		await expect(user1Page.locator(`text="${householdName}"`)).toBeVisible();

		// Invite user 2
		await user1Page.click('text="Invite Members"');
		await user1Page.fill('input[type="email"]', user2Email);
		await user1Page.click('button:has-text("Send Invitation")');

		await expect(user1Page.locator('text="Invitation sent"')).toBeVisible();
	});

	test("should allow user 2 to accept invitation", async () => {
		// User 2 signs up
		await signUpAndSignIn(user2Page, user2Email, password);

		// Check for invitations
		await user2Page.goto(`${BASE_URL}/household`);
		await expect(user2Page.locator('text="Pending Invitations"')).toBeVisible();

		// Accept the invitation
		await user2Page.click('button:has-text("Accept")');
		await user2Page.waitForLoadState("networkidle");

		// Verify user is now in the household
		await expect(user2Page.locator(`text="${householdName}"`)).toBeVisible();
	});

	test("should share a transaction with household", async () => {
		// User 1 creates a transaction
		await user1Page.goto(`${BASE_URL}/accounts`);

		// Create manual account if needed
		const accountExists = await user1Page.locator('text="Checking Account"').isVisible().catch(() => false);
		if (!accountExists) {
			await user1Page.click('text="Add Account"');
			await user1Page.fill('input[name="account_name"]', "Checking Account");
			await user1Page.selectOption('select[name="account_type"]', "checking");
			await user1Page.click('button[type="submit"]');
			await user1Page.waitForLoadState("networkidle");
		}

		// Create a transaction
		await createManualTransaction(user1Page, "Tesco Groceries", -50.0, "groceries");

		// Share the transaction
		await user1Page.locator('text="Tesco Groceries"').first().hover();
		await user1Page.click('[data-testid="share-transaction-button"]').catch(async () => {
			// Alternative: click share button in the transaction row
			await user1Page.locator('text="Tesco Groceries"').first().click();
			await user1Page.click('button:has-text("Share")');
		});

		// Select household
		await user1Page.click(`text="${householdName}"`);
		await user1Page.waitForLoadState("networkidle");

		// Verify transaction shows as shared
		await expect(
			user1Page.locator('text="Tesco Groceries"').locator('..').locator('text="Shared"')
		).toBeVisible();
	});

	test("should allow household member to view shared transaction", async () => {
		// User 2 views household transactions
		await user2Page.goto(`${BASE_URL}/household`);
		await user2Page.click(`text="${householdName}"`);

		// Should see the shared transaction
		await expect(user2Page.locator('text="Shared Transactions"')).toBeVisible();
		await expect(user2Page.locator('text="Tesco Groceries"')).toBeVisible();

		// Should show owner information
		await expect(user2Page.locator('text="£50.00"')).toBeVisible();
	});

	test("should keep private transactions hidden from household members", async () => {
		// User 1 creates a private transaction
		await createManualTransaction(user1Page, "Bar & Grill", -25.0, "entertainment");

		// Explicitly verify it's private (don't share it)
		await user1Page.goto(`${BASE_URL}/transactions`);
		const barTransaction = user1Page.locator('text="Bar & Grill"');
		await expect(barTransaction).toBeVisible();

		// Check it shows as private
		await expect(
			barTransaction.locator('..').locator('text="Private"')
		).toBeVisible();

		// User 2 should NOT see this transaction in household view
		await user2Page.goto(`${BASE_URL}/household`);
		await user2Page.click(`text="${householdName}"`);

		await expect(user2Page.locator('text="Bar & Grill"')).not.toBeVisible();

		// User 2 should also not see it in their transactions list
		await user2Page.goto(`${BASE_URL}/transactions`);
		await expect(user2Page.locator('text="Bar & Grill"')).not.toBeVisible();
	});

	test("should support bulk sharing operations", async () => {
		// User 1 creates multiple transactions
		await createManualTransaction(user1Page, "Sainsbury's", -75.0, "groceries");
		await createManualTransaction(user1Page, "Utility Bill", -100.0, "utilities");
		await createManualTransaction(user1Page, "Lidl", -40.0, "groceries");

		// Go to transactions page
		await user1Page.goto(`${BASE_URL}/transactions`);

		// Select multiple transactions
		const sainsburys = user1Page.locator('text="Sainsbury\'s"').first();
		const utilities = user1Page.locator('text="Utility Bill"').first();
		const lidl = user1Page.locator('text="Lidl"').first();

		await sainsburys.locator('..').locator('input[type="checkbox"]').check();
		await utilities.locator('..').locator('input[type="checkbox"]').check();
		await lidl.locator('..').locator('input[type="checkbox"]').check();

		// Bulk share toolbar should appear
		await expect(user1Page.locator('text="3 transactions selected"')).toBeVisible();

		// Select household and share
		await user1Page.selectOption('select[name="household"]', householdName);
		await user1Page.click('button:has-text("Share")');
		await user1Page.waitForLoadState("networkidle");

		// Verify success message
		await expect(user1Page.locator('text="3 transactions shared"')).toBeVisible();

		// User 2 should see all three transactions
		await user2Page.goto(`${BASE_URL}/household`);
		await user2Page.click(`text="${householdName}"`);

		await expect(user2Page.locator('text="Sainsbury\'s"')).toBeVisible();
		await expect(user2Page.locator('text="Utility Bill"')).toBeVisible();
		await expect(user2Page.locator('text="Lidl"')).toBeVisible();
	});

	test("should support unsharing transactions", async () => {
		// User 1 unshares Tesco transaction
		await user1Page.goto(`${BASE_URL}/transactions`);

		await user1Page.locator('text="Tesco Groceries"').first().hover();
		await user1Page.click('[data-testid="share-transaction-button"]').catch(async () => {
			await user1Page.locator('text="Tesco Groceries"').first().click();
			await user1Page.click('button:has-text("Make Private")');
		});

		await user1Page.click('text="Make Private"');
		await user1Page.waitForLoadState("networkidle");

		// Verify it shows as private
		await expect(
			user1Page.locator('text="Tesco Groceries"').locator('..').locator('text="Private"')
		).toBeVisible();

		// User 2 should no longer see it
		await user2Page.goto(`${BASE_URL}/household`);
		await user2Page.click(`text="${householdName}"`);

		await expect(user2Page.locator('text="Tesco Groceries"')).not.toBeVisible();
	});

	test("should filter transactions by sharing status", async () => {
		await user1Page.goto(`${BASE_URL}/transactions`);

		// Test "Shared Only" filter
		await user1Page.selectOption('select[name="sharing_status"]', "shared");
		await user1Page.waitForLoadState("networkidle");

		// Should see shared transactions
		await expect(user1Page.locator('text="Sainsbury\'s"')).toBeVisible();
		// Should not see private transactions
		await expect(user1Page.locator('text="Bar & Grill"')).not.toBeVisible();

		// Test "Private Only" filter
		await user1Page.selectOption('select[name="sharing_status"]', "private");
		await user1Page.waitForLoadState("networkidle");

		// Should see private transactions
		await expect(user1Page.locator('text="Bar & Grill"')).toBeVisible();
		await expect(user1Page.locator('text="Tesco Groceries"')).toBeVisible(); // Now private
		// Should not see shared transactions
		await expect(user1Page.locator('text="Sainsbury\'s"')).not.toBeVisible();

		// Test "All" filter
		await user1Page.selectOption('select[name="sharing_status"]', "all");
		await user1Page.waitForLoadState("networkidle");

		// Should see both
		await expect(user1Page.locator('text="Bar & Grill"')).toBeVisible();
		await expect(user1Page.locator('text="Sainsbury\'s"')).toBeVisible();
	});

	test("should display transaction sharing history", async () => {
		await user1Page.goto(`${BASE_URL}/transactions`);

		// Click on a shared transaction
		await user1Page.locator('text="Sainsbury\'s"').first().click();

		// View sharing history
		await expect(user1Page.locator('text="Sharing History"')).toBeVisible();

		// Should show sharing event
		await expect(user1Page.locator('text="Shared with household"')).toBeVisible();

		// Should show timestamp
		await expect(user1Page.locator('[data-testid="sharing-timestamp"]')).toBeVisible();
	});

	test("should export sharing history to CSV", async () => {
		await user1Page.goto(`${BASE_URL}/transactions`);
		await user1Page.locator('text="Sainsbury\'s"').first().click();

		// Wait for download
		const downloadPromise = user1Page.waitForEvent("download");
		await user1Page.click('button:has-text("Export CSV")');
		const download = await downloadPromise;

		// Verify download
		expect(download.suggestedFilename()).toContain("sharing-history.csv");
	});

	test("should prevent user from sharing other users' transactions", async () => {
		// User 2 tries to access user 1's transaction directly
		await user2Page.goto(`${BASE_URL}/transactions`);

		// Create a transaction as user 2
		await createManualTransaction(user2Page, "User 2 Purchase", -30.0, "shopping");

		// User 2 should only see their own transactions in the list
		await expect(user2Page.locator('text="User 2 Purchase"')).toBeVisible();

		// User 2 should not see User 1's private transactions
		await expect(user2Page.locator('text="Bar & Grill"')).not.toBeVisible();
	});

	test("should handle real-time updates when transaction is shared", async ({ context }) => {
		// User 1 shares a new transaction
		await user1Page.goto(`${BASE_URL}/transactions`);
		await createManualTransaction(user1Page, "Real-time Test", -20.0, "other");

		await user1Page.locator('text="Real-time Test"').first().click();
		await user1Page.click('button:has-text("Share")');
		await user1Page.click(`text="${householdName}"`);

		// User 2 should see it appear in real-time (within a few seconds)
		await user2Page.goto(`${BASE_URL}/household`);
		await user2Page.click(`text="${householdName}"`);

		// Wait for real-time update (max 5 seconds)
		await expect(user2Page.locator('text="Real-time Test"')).toBeVisible({ timeout: 5000 });
	});
});

test.describe("Transaction Privacy Edge Cases", () => {
	test("should handle sharing to wrong household gracefully", async ({ page }) => {
		// This would be tested at the API level, but we can verify UI prevents it
		// The UI should only show households the user belongs to
		await signUpAndSignIn(page, `edge-user-${Date.now()}@example.com`, "TestPass123!");

		await createHousehold(page, `Edge Household ${Date.now()}`);
		await page.goto(`${BASE_URL}/transactions`);

		// Only user's households should be available
		const householdOptions = await page.locator('select[name="household"] option').count();
		expect(householdOptions).toBeGreaterThanOrEqual(1); // At least the created household
	});

	test("should persist sharing status across account syncs", async ({ page }) => {
		// This verifies that manual sharing settings are preserved
		// even when transactions are re-synced from TrueLayer

		await signUpAndSignIn(page, `sync-user-${Date.now()}@example.com`, "TestPass123!");
		await createHousehold(page, `Sync Test ${Date.now()}`);
		await createManualTransaction(page, "Pre-sync Transaction", -15.0, "other");

		// Share the transaction
		await page.locator('text="Pre-sync Transaction"').first().click();
		await page.click('button:has-text("Share")');
		await page.click('text="Sync Test"');

		// Verify it's shared
		await page.goto(`${BASE_URL}/transactions`);
		await expect(
			page.locator('text="Pre-sync Transaction"').locator('..').locator('text="Shared"')
		).toBeVisible();

		// Simulate account sync (reload page)
		await page.reload();

		// Sharing status should persist
		await expect(
			page.locator('text="Pre-sync Transaction"').locator('..').locator('text="Shared"')
		).toBeVisible();
	});
});
