import { expect, test } from "@playwright/test";

// Mock authenticated user
const mockUser = {
	id: "test-user-id",
	email: "creator@example.com",
	full_name: "Test Creator",
};

const mockInvitee = {
	id: "invitee-user-id",
	email: "invitee@example.com",
	full_name: "Test Invitee",
};

test.describe("Household Creation and Invitation Workflow", () => {
	test.beforeEach(async ({ page }) => {
		// Mock authentication state for creator
		await page.addInitScript(() => {
			localStorage.setItem(
				"supabase.auth.token",
				JSON.stringify({
					access_token: "mock-access-token",
					refresh_token: "mock-refresh-token",
					user: {
						id: "test-user-id",
						email: "creator@example.com",
						user_metadata: {
							full_name: "Test Creator",
						},
					},
				}),
			);
		});

		// Mock GET /api/households - initially empty
		await page.route("**/api/households", async (route) => {
			if (route.request().method() === "GET") {
				await route.fulfill({
					json: { households: [] },
				});
			}
		});
	});

	test("should complete full household creation and invitation flow", async ({
		page,
	}) => {
		// Step 1: Navigate to household page and see empty state
		await page.goto("/household");
		await expect(
			page.getByText("No household created", { exact: false }),
		).toBeVisible();

		// Step 2: Click create household button
		const createButton = page.getByRole("button", {
			name: /create household/i,
		});
		await expect(createButton).toBeVisible();
		await createButton.click();

		// Step 3: Fill out household creation form
		const householdName = "Family Budget";
		const householdDescription = "Managing our family expenses together";

		// Mock POST /api/households for household creation
		await page.route("**/api/households", async (route) => {
			if (route.request().method() === "POST") {
				const postData = route.request().postDataJSON();
				await route.fulfill({
					json: {
						household: {
							id: "household-123",
							name: postData.name,
							description: postData.description,
							created_by: "test-user-id",
							settlement_day: 1,
							created_at: new Date().toISOString(),
						},
					},
				});
			}
		});

		// Fill form fields
		await page.getByLabel(/household name/i).fill(householdName);
		await page.getByLabel(/description/i).fill(householdDescription);

		// Submit form
		const submitButton = page.getByRole("button", { name: /create/i });
		await submitButton.click();

		// Step 4: Verify household was created and displayed
		// Mock GET /api/households/[id] for household details
		await page.route("**/api/households/household-123", async (route) => {
			if (route.request().method() === "GET") {
				await route.fulfill({
					json: {
						household: {
							id: "household-123",
							name: householdName,
							description: householdDescription,
							created_by: "test-user-id",
							settlement_day: 1,
							created_at: new Date().toISOString(),
						},
						members: [
							{
								id: "member-1",
								household_id: "household-123",
								user_id: "test-user-id",
								role: "creator",
								joined_at: new Date().toISOString(),
								user: {
									id: "test-user-id",
									email: "creator@example.com",
									full_name: "Test Creator",
								},
							},
						],
					},
				});
			}
		});

		// Should navigate to household page
		await expect(page).toHaveURL(/\/household\/household-123/, {
			timeout: 5000,
		});
		await expect(page.getByText(householdName)).toBeVisible();
		await expect(page.getByText(householdDescription)).toBeVisible();

		// Step 5: Open invite member modal
		const inviteButton = page.getByRole("button", { name: /invite member/i });
		await expect(inviteButton).toBeVisible();
		await inviteButton.click();

		// Step 6: Fill out invitation form
		const inviteeEmail = "invitee@example.com";

		// Mock POST /api/households/[id]/invite for sending invitation
		await page.route(
			"**/api/households/household-123/invite",
			async (route) => {
				if (route.request().method() === "POST") {
					const postData = route.request().postDataJSON();
					await route.fulfill({
						json: {
							invitation: {
								id: "invitation-456",
								household_id: "household-123",
								invited_by: "test-user-id",
								email: postData.email,
								token: "test-invitation-token-789",
								status: "pending",
								resend_count: 0,
								expires_at: new Date(
									Date.now() + 7 * 24 * 60 * 60 * 1000,
								).toISOString(),
								created_at: new Date().toISOString(),
							},
						},
					});
				}
			},
		);

		// Fill email input
		await page.getByLabel(/email/i).fill(inviteeEmail);

		// Submit invitation
		const sendInviteButton = page.getByRole("button", {
			name: /send invitation/i,
		});
		await sendInviteButton.click();

		// Verify success message
		await expect(
			page.getByText(/invitation sent/i, { timeout: 5000 }),
		).toBeVisible();

		// Step 7: Verify invitation appears in pending invitations list
		// Mock updated household details with invitation
		await page.route("**/api/households/household-123", async (route) => {
			if (route.request().method() === "GET") {
				await route.fulfill({
					json: {
						household: {
							id: "household-123",
							name: householdName,
							description: householdDescription,
							created_by: "test-user-id",
							settlement_day: 1,
							created_at: new Date().toISOString(),
						},
						members: [
							{
								id: "member-1",
								household_id: "household-123",
								user_id: "test-user-id",
								role: "creator",
								joined_at: new Date().toISOString(),
								user: {
									id: "test-user-id",
									email: "creator@example.com",
									full_name: "Test Creator",
								},
							},
						],
						invitations: [
							{
								id: "invitation-456",
								email: inviteeEmail,
								status: "pending",
								expires_at: new Date(
									Date.now() + 7 * 24 * 60 * 60 * 1000,
								).toISOString(),
								resend_count: 0,
							},
						],
					},
				});
			}
		});

		// Reload to see updated member list with pending invitation
		await page.reload();
		await expect(page.getByText(inviteeEmail)).toBeVisible();
		await expect(page.getByText(/pending/i)).toBeVisible();
	});

	test("should allow invitee to accept invitation", async ({ page }) => {
		const invitationToken = "test-invitation-token-789";

		// Mock GET /api/households/invite/[token] for invitation details
		await page.route(
			`**/api/households/invite/${invitationToken}`,
			async (route) => {
				if (route.request().method() === "GET") {
					await route.fulfill({
						json: {
							invitation: {
								household_name: "Family Budget",
								household_description: "Managing our family expenses together",
								inviter_name: "Test Creator",
								invited_email: "invitee@example.com",
								expires_at: new Date(
									Date.now() + 7 * 24 * 60 * 60 * 1000,
								).toISOString(),
							},
						},
					});
				}
			},
		);

		// Navigate to invitation acceptance page
		await page.goto(`/household/invite/${invitationToken}`);

		// Should display invitation details
		await expect(page.getByText("You're Invited!")).toBeVisible();
		await expect(page.getByText("Family Budget")).toBeVisible();
		await expect(page.getByText("Test Creator")).toBeVisible();
		await expect(page.getByText("invitee@example.com")).toBeVisible();

		// Accept button should be visible
		const acceptButton = page.getByRole("button", {
			name: /accept invitation/i,
		});
		await expect(acceptButton).toBeVisible();

		// Mock POST /api/households/invite/[token]/accept
		await page.route(
			`**/api/households/invite/${invitationToken}/accept`,
			async (route) => {
				if (route.request().method() === "POST") {
					await route.fulfill({
						json: {
							household_id: "household-123",
							member: {
								id: "member-2",
								household_id: "household-123",
								user_id: "invitee-user-id",
								role: "member",
								joined_at: new Date().toISOString(),
							},
						},
					});
				}
			},
		);

		// Click accept button
		await acceptButton.click();

		// Should redirect to household page
		await expect(page).toHaveURL(/\/household\/household-123/, {
			timeout: 5000,
		});
	});

	test("should allow invitee to decline invitation", async ({ page }) => {
		const invitationToken = "test-invitation-token-decline";

		// Mock GET /api/households/invite/[token] for invitation details
		await page.route(
			`**/api/households/invite/${invitationToken}`,
			async (route) => {
				if (route.request().method() === "GET") {
					await route.fulfill({
						json: {
							invitation: {
								household_name: "Family Budget",
								household_description: "Managing our family expenses together",
								inviter_name: "Test Creator",
								invited_email: "invitee@example.com",
								expires_at: new Date(
									Date.now() + 7 * 24 * 60 * 60 * 1000,
								).toISOString(),
							},
						},
					});
				}
			},
		);

		// Navigate to invitation acceptance page
		await page.goto(`/household/invite/${invitationToken}`);

		// Should display invitation details
		await expect(page.getByText("You're Invited!")).toBeVisible();

		// Decline button should be visible
		const declineButton = page.getByRole("button", { name: /decline/i });
		await expect(declineButton).toBeVisible();

		// Mock POST /api/households/invite/[token]/decline
		await page.route(
			`**/api/households/invite/${invitationToken}/decline`,
			async (route) => {
				if (route.request().method() === "POST") {
					await route.fulfill({
						json: {
							success: true,
						},
					});
				}
			},
		);

		// Click decline button
		await declineButton.click();

		// Should redirect to households page
		await expect(page).toHaveURL(/\/household$/, { timeout: 5000 });
	});

	test("should handle expired invitation", async ({ page }) => {
		const expiredToken = "expired-token-123";

		// Mock GET /api/households/invite/[token] with expired status
		await page.route(
			`**/api/households/invite/${expiredToken}`,
			async (route) => {
				if (route.request().method() === "GET") {
					await route.fulfill({
						status: 410,
						json: {
							error: "This invitation has expired",
						},
					});
				}
			},
		);

		// Navigate to expired invitation page
		await page.goto(`/household/invite/${expiredToken}`);

		// Should display error message
		await expect(
			page.getByText(/invitation.*expired/i, { timeout: 5000 }),
		).toBeVisible();
	});

	test("should allow resending invitation with rate limiting", async ({
		page,
	}) => {
		// Step 1: Navigate to household page with pending invitation
		await page.route("**/api/households/household-123", async (route) => {
			if (route.request().method() === "GET") {
				await route.fulfill({
					json: {
						household: {
							id: "household-123",
							name: "Family Budget",
							description: "Test household",
							created_by: "test-user-id",
							settlement_day: 1,
							created_at: new Date().toISOString(),
						},
						members: [
							{
								id: "member-1",
								household_id: "household-123",
								user_id: "test-user-id",
								role: "creator",
								joined_at: new Date().toISOString(),
								user: {
									id: "test-user-id",
									email: "creator@example.com",
									full_name: "Test Creator",
								},
							},
						],
						invitations: [
							{
								id: "invitation-456",
								email: "invitee@example.com",
								status: "pending",
								expires_at: new Date(
									Date.now() + 7 * 24 * 60 * 60 * 1000,
								).toISOString(),
								resend_count: 2,
							},
						],
					},
				});
			}
		});

		await page.goto("/household/household-123");

		// Find resend button
		const resendButton = page.getByRole("button", { name: /resend/i });
		await expect(resendButton).toBeVisible();

		// Mock POST /api/households/[id]/invite/[invitationId]/resend
		await page.route(
			"**/api/households/household-123/invite/invitation-456/resend",
			async (route) => {
				if (route.request().method() === "POST") {
					await route.fulfill({
						json: {
							invitation: {
								id: "invitation-456",
								resend_count: 3,
								status: "pending",
							},
						},
					});
				}
			},
		);

		// Click resend button (should work, resend_count is 2, limit is 3)
		await resendButton.click();
		await expect(page.getByText(/invitation resent/i)).toBeVisible();

		// After 3 resends, button should be disabled
		// Update mock to show resend_count: 3
		await page.route("**/api/households/household-123", async (route) => {
			if (route.request().method() === "GET") {
				await route.fulfill({
					json: {
						household: {
							id: "household-123",
							name: "Family Budget",
							description: "Test household",
							created_by: "test-user-id",
							settlement_day: 1,
							created_at: new Date().toISOString(),
						},
						members: [
							{
								id: "member-1",
								household_id: "household-123",
								user_id: "test-user-id",
								role: "creator",
								joined_at: new Date().toISOString(),
								user: {
									id: "test-user-id",
									email: "creator@example.com",
									full_name: "Test Creator",
								},
							},
						],
						invitations: [
							{
								id: "invitation-456",
								email: "invitee@example.com",
								status: "pending",
								expires_at: new Date(
									Date.now() + 7 * 24 * 60 * 60 * 1000,
								).toISOString(),
								resend_count: 3,
							},
						],
					},
				});
			}
		});

		await page.reload();

		// Resend button should now be disabled
		const resendButtonAfter = page.getByRole("button", { name: /resend/i });
		await expect(resendButtonAfter).toBeDisabled();
	});
});
