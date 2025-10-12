import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

describe("Household Invitation API Endpoints", () => {
	let testUser: User;
	let authToken: string;
	let householdId: string;
	let invitationToken: string;

	beforeAll(async () => {
		// Create test user
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email: `test-invite-${Date.now()}@example.com`,
			password: "testpassword123",
			email_confirm: true,
		});

		if (error || !data.user) {
			throw new Error("Failed to create test user");
		}

		testUser = data.user;

		// Create profile
		await supabaseAdmin.from("profiles").insert({
			id: testUser.id,
			email: testUser.email!,
			full_name: "Test User",
		});

		// Generate auth token
		const { data: sessionData } = await supabaseAdmin.auth.admin.generateLink({
			type: "magiclink",
			email: testUser.email!,
		});

		if (!sessionData) {
			throw new Error("Failed to generate auth token");
		}

		authToken = sessionData.properties.access_token || "";

		// Create test household
		const { data: household } = await supabaseAdmin
			.from("households")
			.insert({
				name: "Test Household",
				created_by: testUser.id,
			})
			.select()
			.single();

		householdId = household!.id;

		// Add user as creator
		await supabaseAdmin.from("household_members").insert({
			household_id: householdId,
			user_id: testUser.id,
			role: "creator",
		});
	});

	afterAll(async () => {
		// Cleanup
		if (testUser?.id) {
			await supabaseAdmin.auth.admin.deleteUser(testUser.id);
		}
	});

	describe("POST /api/households/[id]/invite", () => {
		it("should send household invitation", async () => {
			const response = await fetch(
				`http://localhost:3000/api/households/${householdId}/invite`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${authToken}`,
					},
					body: JSON.stringify({
						email: "invited@example.com",
					}),
				},
			);

			expect(response.status).toBe(201);
			const data = await response.json();

			expect(data.invitation).toBeDefined();
			expect(data.invitation.email).toBe("invited@example.com");
			expect(data.invitation.token).toBeDefined();
			expect(data.invitation.status).toBe("pending");

			invitationToken = data.invitation.token;
		});

		it("should fail with invalid email", async () => {
			const response = await fetch(
				`http://localhost:3000/api/households/${householdId}/invite`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${authToken}`,
					},
					body: JSON.stringify({
						email: "invalid-email",
					}),
				},
			);

			expect(response.status).toBe(400);
		});

		it("should fail without authentication", async () => {
			const response = await fetch(
				`http://localhost:3000/api/households/${householdId}/invite`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email: "test@example.com",
					}),
				},
			);

			expect(response.status).toBe(401);
		});
	});

	describe("GET /api/households/invite/[token]", () => {
		it("should get invitation details", async () => {
			const response = await fetch(
				`http://localhost:3000/api/households/invite/${invitationToken}`,
			);

			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data.invitation).toBeDefined();
			expect(data.invitation.token).toBe(invitationToken);
			expect(data.invitation.households).toBeDefined();
		});

		it("should fail for invalid token", async () => {
			const response = await fetch(
				"http://localhost:3000/api/households/invite/invalid-token",
			);

			expect(response.status).toBe(404);
		});
	});

	describe("POST /api/households/invite/[token]/accept", () => {
		it("should accept invitation", async () => {
			// Create a new user to accept the invitation
			const { data: invitedUser } = await supabaseAdmin.auth.admin.createUser({
				email: "invited@example.com",
				password: "testpassword123",
				email_confirm: true,
			});

			if (!invitedUser?.user) {
				throw new Error("Failed to create invited user");
			}

			// Create profile for invited user
			await supabaseAdmin.from("profiles").insert({
				id: invitedUser.user.id,
				email: invitedUser.user.email!,
			});

			// Generate token for invited user
			const { data: sessionData } = await supabaseAdmin.auth.admin.generateLink(
				{
					type: "magiclink",
					email: invitedUser.user.email!,
				},
			);

			const invitedAuthToken = sessionData?.properties.access_token || "";

			const response = await fetch(
				`http://localhost:3000/api/households/invite/${invitationToken}/accept`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${invitedAuthToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data.household_id).toBe(householdId);

			// Cleanup
			await supabaseAdmin.auth.admin.deleteUser(invitedUser.user.id);
		});
	});

	describe("POST /api/households/invite/[token]/decline", () => {
		it("should decline invitation", async () => {
			// Create new invitation
			const { data: newInvitation } = await supabaseAdmin
				.from("household_invitations")
				.insert({
					household_id: householdId,
					invited_by: testUser.id,
					email: "decline@example.com",
					token: `test-decline-${Date.now()}`,
					expires_at: new Date(
						Date.now() + 7 * 24 * 60 * 60 * 1000,
					).toISOString(),
					status: "pending",
				})
				.select()
				.single();

			// Create user to decline
			const { data: decliningUser } = await supabaseAdmin.auth.admin.createUser(
				{
					email: "decline@example.com",
					password: "testpassword123",
					email_confirm: true,
				},
			);

			if (!decliningUser?.user) {
				throw new Error("Failed to create declining user");
			}

			// Create profile
			await supabaseAdmin.from("profiles").insert({
				id: decliningUser.user.id,
				email: decliningUser.user.email!,
			});

			// Generate token
			const { data: sessionData } = await supabaseAdmin.auth.admin.generateLink(
				{
					type: "magiclink",
					email: decliningUser.user.email!,
				},
			);

			const decliningAuthToken = sessionData?.properties.access_token || "";

			const response = await fetch(
				`http://localhost:3000/api/households/invite/${newInvitation!.token}/decline`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${decliningAuthToken}`,
					},
				},
			);

			expect(response.status).toBe(200);

			// Verify status updated
			const { data: updatedInvitation } = await supabaseAdmin
				.from("household_invitations")
				.select("status")
				.eq("id", newInvitation!.id)
				.single();

			expect(updatedInvitation?.status).toBe("declined");

			// Cleanup
			await supabaseAdmin.auth.admin.deleteUser(decliningUser.user.id);
		});
	});
});
