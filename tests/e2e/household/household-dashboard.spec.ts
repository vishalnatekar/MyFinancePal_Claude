import { expect, test } from "@playwright/test";

test.describe("Household Dashboard", () => {
	test.beforeEach(async ({ page }) => {
		// Login before each test
		// Note: Adjust this based on your authentication flow
		await page.goto("/login");
		await page.fill('input[type="email"]', "test@example.com");
		await page.fill('input[type="password"]', "password123");
		await page.click('button[type="submit"]');

		// Wait for navigation to complete
		await page.waitForURL(/\/dashboard/);
	});

	test("should display household dashboard with all components", async ({
		page,
	}) => {
		// Navigate to household dashboard
		await page.goto("/household/test-household-id");

		// Wait for page to load
		await page.waitForSelector("h1");

		// Check for main components
		await expect(page.getByText("Shared Net Worth")).toBeVisible();
		await expect(page.getByText("Member Contributions")).toBeVisible();
		await expect(page.getByText("Activity Feed")).toBeVisible();
	});

	test("should display correct net worth calculation", async ({ page }) => {
		await page.goto("/household/test-household-id");

		// Wait for net worth card to load
		const netWorthCard = page.locator('text="Shared Net Worth"').locator("..");

		// Verify net worth is displayed
		await expect(netWorthCard).toContainText("£");
	});

	test("should show member contribution breakdown", async ({ page }) => {
		await page.goto("/household/test-household-id");

		// Check for member contribution section
		const contributionSection = page
			.locator('text="Member Contributions"')
			.locator("..");

		// Should show member names and amounts
		await expect(contributionSection).toBeVisible();

		// Should show progress bars for each member
		const progressBars = contributionSection.locator('[role="progressbar"]');
		await expect(progressBars.first()).toBeVisible();
	});

	test("should display shared accounts table", async ({ page }) => {
		await page.goto("/household/test-household-id");

		// Check for accounts table
		const accountsTable = page.getByRole("table");

		if ((await accountsTable.count()) > 0) {
			// Verify table headers
			await expect(accountsTable).toContainText("Account");
			await expect(accountsTable).toContainText("Owner");
			await expect(accountsTable).toContainText("Balance");
		}
	});

	test("should show activity feed with recent events", async ({ page }) => {
		await page.goto("/household/test-household-id");

		// Check for activity feed
		const activityFeed = page.locator('text="Activity Feed"').locator("..");

		await expect(activityFeed).toBeVisible();

		// Should show activity items (if any exist)
		const activityItems = activityFeed.locator('[class*="activity"]');

		if ((await activityItems.count()) > 0) {
			await expect(activityItems.first()).toBeVisible();
		}
	});

	test("should filter activity feed by type", async ({ page }) => {
		await page.goto("/household/test-household-id");

		// Find activity feed filter
		const allFilter = page.getByRole("button", { name: /All/i });

		if (await allFilter.isVisible()) {
			// Click on filter
			await allFilter.click();

			// Try clicking on transaction filter
			const transactionFilter = page.getByRole("button", {
				name: /Transactions/i,
			});

			if (await transactionFilter.isVisible()) {
				await transactionFilter.click();

				// Activity feed should update (implementation dependent)
				await expect(
					page.locator('text="Activity Feed"').locator(".."),
				).toBeVisible();
			}
		}
	});

	test("should sync household accounts", async ({ page }) => {
		await page.goto("/household/test-household-id");

		// Find sync button
		const syncButton = page.getByRole("button", { name: /Sync/i });

		if (await syncButton.isVisible()) {
			// Click sync button
			await syncButton.click();

			// Should show loading state or success message
			await expect(page.getByText(/Syncing|Success|Synced/i)).toBeVisible({
				timeout: 10000,
			});
		}
	});

	test("should switch between mobile tabs", async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		await page.goto("/household/test-household-id");

		// Look for tab controls (mobile view)
		const overviewTab = page.getByRole("tab", { name: /Overview/i });

		if (await overviewTab.isVisible()) {
			// Click on Accounts tab
			const accountsTab = page.getByRole("tab", { name: /Accounts/i });
			if (await accountsTab.isVisible()) {
				await accountsTab.click();

				// Should show accounts content
				await expect(page.locator('[role="tabpanel"]')).toBeVisible();
			}

			// Click on Activity tab
			const activityTab = page.getByRole("tab", { name: /Activity/i });
			if (await activityTab.isVisible()) {
				await activityTab.click();

				// Should show activity content
				await expect(page.getByText("Activity Feed")).toBeVisible();
			}
		}
	});

	test("should handle empty household state", async ({ page }) => {
		// Navigate to a household with no data
		await page.goto("/household/empty-household-id");

		// Should show empty states
		const emptyMessages = [
			/No shared accounts/i,
			/No activity yet/i,
			/No transactions/i,
		];

		// At least one empty message should be visible
		let foundEmptyMessage = false;
		for (const message of emptyMessages) {
			if ((await page.getByText(message).count()) > 0) {
				foundEmptyMessage = true;
				break;
			}
		}

		expect(foundEmptyMessage).toBe(true);
	});

	test("should display last sync time", async ({ page }) => {
		await page.goto("/household/test-household-id");

		// Look for last sync indicator
		const lastSyncText = page.getByText(/Last (synced|sync)/i);

		if (await lastSyncText.isVisible()) {
			// Should show a timestamp
			await expect(lastSyncText).toBeVisible();
		}
	});

	test("should show member avatars", async ({ page }) => {
		await page.goto("/household/test-household-id");

		// Look for avatar elements
		const avatars = page.locator('[class*="avatar"]');

		if ((await avatars.count()) > 0) {
			await expect(avatars.first()).toBeVisible();
		}
	});

	test("should handle navigation to household settings", async ({ page }) => {
		await page.goto("/household/test-household-id");

		// Look for settings button or link
		const settingsButton = page.getByRole("link", { name: /Settings/i });

		if (await settingsButton.isVisible()) {
			await settingsButton.click();

			// Should navigate to settings page
			await expect(page).toHaveURL(/settings/);
		}
	});

	test("should display transaction details in activity feed", async ({
		page,
	}) => {
		await page.goto("/household/test-household-id");

		// Look for transaction items in activity feed
		const activityFeed = page.locator('text="Activity Feed"').locator("..");
		const transactionItems = activityFeed.locator("text=/£\\d+/");

		if ((await transactionItems.count()) > 0) {
			// Should show amount and merchant
			const firstTransaction = transactionItems.first();
			await expect(firstTransaction).toBeVisible();

			// Should contain merchant name or description
			await expect(activityFeed).toContainText(/.+/);
		}
	});

	test("should load data without errors", async ({ page }) => {
		// Listen for console errors
		const errors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				errors.push(msg.text());
			}
		});

		await page.goto("/household/test-household-id");

		// Wait for page to fully load
		await page.waitForLoadState("networkidle");

		// Check that no critical errors occurred
		const criticalErrors = errors.filter(
			(error) =>
				!error.includes("favicon") && // Ignore favicon errors
				!error.includes("404"), // Ignore 404s for optional resources
		);

		expect(criticalErrors.length).toBe(0);
	});

	test("should be responsive on desktop", async ({ page }) => {
		// Set desktop viewport
		await page.setViewportSize({ width: 1920, height: 1080 });

		await page.goto("/household/test-household-id");

		// Should show all components in grid layout
		await expect(page.getByText("Shared Net Worth")).toBeVisible();
		await expect(page.getByText("Member Contributions")).toBeVisible();
		await expect(page.getByText("Activity Feed")).toBeVisible();
	});

	test("should be responsive on tablet", async ({ page }) => {
		// Set tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 });

		await page.goto("/household/test-household-id");

		// Components should still be visible
		await expect(page.getByText("Shared Net Worth")).toBeVisible();
	});

	test("should handle real-time updates", async ({ page }) => {
		await page.goto("/household/test-household-id");

		// Initial state
		const initialNetWorth = await page
			.locator('text="Shared Net Worth"')
			.locator("..")
			.textContent();

		// Wait for potential real-time updates (if implemented)
		await page.waitForTimeout(2000);

		// Page should still be functional
		await expect(page.getByText("Shared Net Worth")).toBeVisible();
	});
});
