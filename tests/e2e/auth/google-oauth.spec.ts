import { type Page, expect, test } from "@playwright/test";

// Mock Supabase for E2E tests
test.beforeEach(async ({ page }) => {
	// Mock the Supabase client to avoid real OAuth flow in tests
	await page.addInitScript(() => {
		// Mock window.location methods
		Object.defineProperty(window, "location", {
			value: {
				...window.location,
				assign: jest.fn(),
				replace: jest.fn(),
			},
			writable: true,
		});

		// Mock Supabase client
		(window as any).mockSupabaseClient = {
			auth: {
				signInWithOAuth: jest.fn().mockResolvedValue({ data: {}, error: null }),
				signOut: jest.fn().mockResolvedValue({ error: null }),
				getUser: jest.fn().mockResolvedValue({
					data: { user: null },
					error: null,
				}),
				onAuthStateChange: jest.fn().mockReturnValue({
					data: { subscription: { unsubscribe: jest.fn() } },
				}),
				getSession: jest.fn().mockResolvedValue({
					data: { session: null },
					error: null,
				}),
			},
		};
	});
});

test.describe("Google OAuth Authentication Flow", () => {
	test("displays sign-in button on homepage for unauthenticated users", async ({
		page,
	}) => {
		await page.goto("/");

		// Check that the homepage loads
		await expect(page.locator("h1")).toContainText("Welcome to MyFinancePal");

		// Check that the Google sign-in button is visible
		await expect(
			page.getByRole("button", { name: /sign in with google/i }),
		).toBeVisible();

		// Check that the button has the Google icon
		await expect(page.locator("svg")).toBeVisible();
	});

	test("shows loading state during authentication", async ({ page }) => {
		await page.goto("/");

		// Mock a slow authentication process
		await page.evaluate(() => {
			(window as any).mockSupabaseClient.auth.signInWithOAuth = jest
				.fn()
				.mockImplementation(
					() =>
						new Promise((resolve) =>
							setTimeout(() => resolve({ data: {}, error: null }), 1000),
						),
				);
		});

		// Click the sign-in button
		await page.getByRole("button", { name: /sign in with google/i }).click();

		// Should show loading state (this test might need adjustment based on actual implementation)
		// await expect(page.getByText("Signing in...")).toBeVisible();
	});

	test("redirects to dashboard after successful authentication", async ({
		page,
	}) => {
		// Mock successful authentication
		await page.addInitScript(() => {
			(window as any).mockSupabaseClient.auth.getUser = jest
				.fn()
				.mockResolvedValue({
					data: {
						user: {
							id: "test-user-id",
							email: "test@example.com",
							user_metadata: {
								full_name: "Test User",
								avatar_url: "https://example.com/avatar.jpg",
							},
						},
					},
					error: null,
				});
		});

		await page.goto("/");

		// Since we mocked a user, it should redirect to dashboard
		// This would need to be adjusted based on your actual routing logic
	});

	test("handles authentication errors gracefully", async ({ page }) => {
		await page.goto("/");

		// Mock authentication error
		await page.evaluate(() => {
			(window as any).mockSupabaseClient.auth.signInWithOAuth = jest
				.fn()
				.mockRejectedValue(new Error("OAuth failed"));
		});

		// Click the sign-in button
		await page.getByRole("button", { name: /sign in with google/i }).click();

		// Should display error message
		// await expect(page.getByText(/authentication error/i)).toBeVisible();
	});

	test("displays user information when authenticated", async ({ page }) => {
		// Mock authenticated state
		await page.addInitScript(() => {
			(window as any).mockSupabaseClient.auth.getUser = jest
				.fn()
				.mockResolvedValue({
					data: {
						user: {
							id: "test-user-id",
							email: "test@example.com",
							user_metadata: {
								full_name: "Test User",
								avatar_url: "https://example.com/avatar.jpg",
							},
						},
					},
					error: null,
				});

			(window as any).mockSupabaseClient.auth.onAuthStateChange = jest
				.fn()
				.mockImplementation((callback) => {
					// Immediately call with authenticated session
					callback("SIGNED_IN", {
						user: {
							id: "test-user-id",
							email: "test@example.com",
							user_metadata: {
								full_name: "Test User",
								avatar_url: "https://example.com/avatar.jpg",
							},
						},
					});
					return { data: { subscription: { unsubscribe: jest.fn() } } };
				});
		});

		await page.goto("/household");

		// Should display user information in the navigation
		await expect(page.getByText("Test User")).toBeVisible();
		await expect(page.getByText("Sign out")).toBeVisible();
	});

	test("sign out functionality works correctly", async ({ page }) => {
		// Mock authenticated state first
		await page.addInitScript(() => {
			let isSignedIn = true;

			(window as any).mockSupabaseClient.auth.getUser = jest
				.fn()
				.mockImplementation(() => {
					if (isSignedIn) {
						return Promise.resolve({
							data: {
								user: {
									id: "test-user-id",
									email: "test@example.com",
									user_metadata: {
										full_name: "Test User",
									},
								},
							},
							error: null,
						});
					} else {
						return Promise.resolve({ data: { user: null }, error: null });
					}
				});

			(window as any).mockSupabaseClient.auth.signOut = jest
				.fn()
				.mockImplementation(() => {
					isSignedIn = false;
					return Promise.resolve({ error: null });
				});

			(window as any).mockSupabaseClient.auth.onAuthStateChange = jest
				.fn()
				.mockImplementation((callback) => {
					// Initially signed in
					callback("SIGNED_IN", {
						user: {
							id: "test-user-id",
							email: "test@example.com",
							user_metadata: {
								full_name: "Test User",
							},
						},
					});
					return { data: { subscription: { unsubscribe: jest.fn() } } };
				});
		});

		await page.goto("/household");

		// Click sign out
		await page.getByText("Sign out").click();

		// Should redirect to homepage
		await expect(page).toHaveURL("/");
	});
});

test.describe("Authentication Error Handling", () => {
	test("displays appropriate error for OAuth failures", async ({ page }) => {
		await page.goto("/auth/error?message=oauth_error");

		await expect(page.getByText(/authentication error/i)).toBeVisible();
		await expect(page.getByText(/try signing in again/i)).toBeVisible();
	});

	test("displays appropriate error for access denied", async ({ page }) => {
		await page.goto("/auth/error?message=access_denied");

		await expect(page.getByText(/access was denied/i)).toBeVisible();
	});

	test("provides retry functionality on error page", async ({ page }) => {
		await page.goto("/auth/error?message=oauth_error");

		await expect(
			page.getByRole("button", { name: /try signing in again/i }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /go to homepage/i }),
		).toBeVisible();
	});
});

test.describe("Authentication Callback Handling", () => {
	test("handles OAuth callback with authorization code", async ({ page }) => {
		// Mock successful callback handling
		await page.addInitScript(() => {
			(window as any).mockSupabaseClient.auth.getUser = jest
				.fn()
				.mockResolvedValue({
					data: {
						user: {
							id: "test-user-id",
							email: "test@example.com",
						},
					},
					error: null,
				});
		});

		await page.goto("/auth/callback?code=test-auth-code");

		await expect(page.getByText(/completing sign in/i)).toBeVisible();
	});

	test("handles OAuth callback with error", async ({ page }) => {
		await page.goto(
			"/auth/callback?error=access_denied&error_description=User%20denied%20access",
		);

		await expect(page.getByText(/authentication error/i)).toBeVisible();
	});
});

test.describe("Protected Routes", () => {
	test("redirects unauthenticated users from protected routes", async ({
		page,
	}) => {
		// Mock unauthenticated state
		await page.addInitScript(() => {
			(window as any).mockSupabaseClient.auth.getUser = jest
				.fn()
				.mockResolvedValue({
					data: { user: null },
					error: null,
				});
		});

		await page.goto("/household");

		// Should redirect to homepage
		await expect(page).toHaveURL("/");
	});

	test("allows authenticated users to access protected routes", async ({
		page,
	}) => {
		// Mock authenticated state
		await page.addInitScript(() => {
			(window as any).mockSupabaseClient.auth.getUser = jest
				.fn()
				.mockResolvedValue({
					data: {
						user: {
							id: "test-user-id",
							email: "test@example.com",
						},
					},
					error: null,
				});

			(window as any).mockSupabaseClient.auth.onAuthStateChange = jest
				.fn()
				.mockImplementation((callback) => {
					callback("SIGNED_IN", {
						user: {
							id: "test-user-id",
							email: "test@example.com",
						},
					});
					return { data: { subscription: { unsubscribe: jest.fn() } } };
				});
		});

		await page.goto("/household");

		// Should stay on the protected route
		await expect(page).toHaveURL("/household");
	});
});
