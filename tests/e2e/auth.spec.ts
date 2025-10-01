import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
	test("should display sign in page for unauthenticated users", async ({
		page,
	}) => {
		await page.goto("/");

		// Should see the welcome message
		await expect(page.getByText("Welcome to MyFinancePal")).toBeVisible();

		// Should see the sign in button
		await expect(page.getByText("Sign in with Google")).toBeVisible();
	});

	test("should redirect to auth callback page when not signed in", async ({
		page,
	}) => {
		// Try to access protected route
		await page.goto("/household");

		// Should redirect to home page for unauthenticated users
		await expect(page).toHaveURL("/");
		await expect(page.getByText("Sign in with Google")).toBeVisible();
	});
});

test.describe("Navigation", () => {
	test("should navigate to different pages", async ({ page }) => {
		await page.goto("/");

		// Test navigation to different public pages
		await expect(page.getByText("Welcome to MyFinancePal")).toBeVisible();

		// Test that protected routes redirect
		await page.goto("/household/create");
		await expect(page).toHaveURL("/");
	});
});
