import { test, expect } from "@playwright/test";

// Mock user data for testing
const mockUser = {
	id: "test-user-id",
	email: "test@example.com",
	full_name: "Test User",
	avatar_url: null,
};

test.describe("Dashboard User Flow", () => {
	test.beforeEach(async ({ page }) => {
		// Mock authentication state
		await page.addInitScript(() => {
			// Mock localStorage for auth state
			localStorage.setItem(
				"supabase.auth.token",
				JSON.stringify({
					access_token: "mock-access-token",
					refresh_token: "mock-refresh-token",
					user: {
						id: "test-user-id",
						email: "test@example.com",
						user_metadata: {
							full_name: "Test User",
							avatar_url: null,
						},
					},
				})
			);
		});

		// Mock API responses
		await page.route("**/api/user/preferences", async (route) => {
			if (route.request().method() === "GET") {
				await route.fulfill({
					json: {
						email_notifications: true,
						shared_expense_alerts: true,
						settlement_reminders: true,
						timezone: "America/New_York",
					},
				});
			} else if (route.request().method() === "PUT") {
				await route.fulfill({
					json: {
						email_notifications: false,
						shared_expense_alerts: false,
						settlement_reminders: true,
						timezone: "America/Los_Angeles",
					},
				});
			}
		});
	});

	test("should display dashboard welcome message", async ({ page }) => {
		await page.goto("/");

		// Should show welcome message
		await expect(page.locator("h2")).toContainText("Good");
		await expect(page.locator("h2")).toContainText("Test!");
		await expect(page.getByText("Welcome back to MyFinancePal")).toBeVisible();
	});

	test("should navigate between dashboard tabs", async ({ page }) => {
		await page.goto("/");

		// Should show tabs
		await expect(page.getByRole("tab", { name: "My Finances" })).toBeVisible();
		await expect(page.getByRole("tab", { name: "Household" })).toBeVisible();

		// Click on Household tab
		await page.getByRole("tab", { name: "Household" }).click();
		await expect(page.getByText("No household created")).toBeVisible();

		// Click back to My Finances tab
		await page.getByRole("tab", { name: "My Finances" }).click();
		await expect(page.getByText("No financial accounts yet")).toBeVisible();
	});

	test("should navigate to profile page and update preferences", async ({ page }) => {
		await page.goto("/");

		// Click on profile/settings from header dropdown
		await page.getByRole("button").first().click(); // Avatar button
		await page.getByRole("menuitem", { name: "Profile" }).click();

		// Should navigate to profile page
		await expect(page).toHaveURL("/profile");
		await expect(page.getByText("Profile Settings")).toBeVisible();

		// Should show user information
		await expect(page.getByText("Test User")).toBeVisible();
		await expect(page.getByText("test@example.com")).toBeVisible();

		// Should show preferences form
		await expect(page.getByText("Email Notifications")).toBeVisible();
		await expect(page.getByText("Shared Expense Alerts")).toBeVisible();

		// Toggle email notifications
		await page.getByRole("switch", { name: "Email Notifications" }).click();

		// Save changes button should be enabled
		const saveButton = page.getByRole("button", { name: "Save Changes" });
		await expect(saveButton).toBeEnabled();
		await saveButton.click();

		// Should show success message
		await expect(page.getByText("Preferences saved successfully!")).toBeVisible();
	});

	test("should use responsive navigation on mobile", async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");

		// Menu button should be visible on mobile
		const menuButton = page.getByRole("button").first();
		await expect(menuButton).toBeVisible();

		// Click menu to open sidebar
		await menuButton.click();

		// Sidebar navigation should be visible
		await expect(page.getByText("Dashboard")).toBeVisible();
		await expect(page.getByText("My Finances")).toBeVisible();
		await expect(page.getByText("Household")).toBeVisible();

		// Click on a navigation item
		await page.getByText("My Finances").click();
		await expect(page).toHaveURL("/finances");
	});

	test("should show breadcrumb navigation", async ({ page }) => {
		await page.goto("/profile");

		// Should show breadcrumb
		await expect(page.getByRole("navigation")).toContainText("Dashboard");
		await expect(page.getByRole("navigation")).toContainText("Profile");

		// Home icon should link back to dashboard
		await page.getByRole("link").first().click(); // Home icon
		await expect(page).toHaveURL("/");
	});

	test("should display empty states for unimplemented features", async ({ page }) => {
		await page.goto("/finances");

		// Should show finances empty state
		await expect(page.getByText("No financial accounts connected")).toBeVisible();
		await expect(page.getByText("Connect Account")).toBeVisible();

		// Navigate to reports
		await page.goto("/reports");

		// Should show reports empty state
		await expect(page.getByText("Reports coming soon")).toBeVisible();
		await expect(page.getByText("Coming Soon")).toBeVisible();
	});

	test("should handle authentication redirects", async ({ page }) => {
		// Clear authentication state
		await page.addInitScript(() => {
			localStorage.clear();
		});

		// Try to access protected page
		await page.goto("/profile");

		// Should redirect to login (this would depend on your auth implementation)
		// For now, we'll check that it doesn't show the protected content
		await expect(page.getByText("Profile Settings")).not.toBeVisible();
	});

	test("should sign out successfully", async ({ page }) => {
		await page.goto("/");

		// Open user menu
		await page.getByRole("button").first().click();

		// Click sign out
		await page.getByRole("menuitem", { name: "Sign out" }).click();

		// Should redirect away from dashboard
		// This behavior would depend on your auth implementation
		await expect(page).not.toHaveURL("/");
	});
});