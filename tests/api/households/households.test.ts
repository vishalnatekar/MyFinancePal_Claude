import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

describe("Household API Endpoints", () => {
	let testUser: User;
	let authToken: string;
	let householdId: string;

	beforeAll(async () => {
		// Create test user
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email: `test-${Date.now()}@example.com`,
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
	});

	afterAll(async () => {
		// Cleanup: Delete test user and related data
		if (testUser?.id) {
			await supabaseAdmin.auth.admin.deleteUser(testUser.id);
		}
	});

	describe("POST /api/households", () => {
		it("should create a new household", async () => {
			const response = await fetch("http://localhost:3000/api/households", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authToken}`,
				},
				body: JSON.stringify({
					name: "Test Household",
					description: "A test household",
					settlement_day: 15,
				}),
			});

			expect(response.status).toBe(201);
			const data = await response.json();

			expect(data.household).toBeDefined();
			expect(data.household.name).toBe("Test Household");
			expect(data.household.description).toBe("A test household");
			expect(data.household.settlement_day).toBe(15);

			householdId = data.household.id;
		});

		it("should fail without authentication", async () => {
			const response = await fetch("http://localhost:3000/api/households", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: "Test Household",
				}),
			});

			expect(response.status).toBe(401);
		});

		it("should fail with invalid data", async () => {
			const response = await fetch("http://localhost:3000/api/households", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authToken}`,
				},
				body: JSON.stringify({
					name: "", // Empty name should fail
				}),
			});

			expect(response.status).toBe(400);
		});
	});

	describe("GET /api/households", () => {
		it("should list user's households", async () => {
			const response = await fetch("http://localhost:3000/api/households", {
				headers: {
					Authorization: `Bearer ${authToken}`,
				},
			});

			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data.households).toBeDefined();
			expect(Array.isArray(data.households)).toBe(true);
			expect(data.households.length).toBeGreaterThan(0);
		});

		it("should fail without authentication", async () => {
			const response = await fetch("http://localhost:3000/api/households");

			expect(response.status).toBe(401);
		});
	});

	describe("GET /api/households/[id]", () => {
		it("should get household details", async () => {
			const response = await fetch(
				`http://localhost:3000/api/households/${householdId}`,
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data.household).toBeDefined();
			expect(data.household.id).toBe(householdId);
			expect(data.household.household_members).toBeDefined();
		});

		it("should fail for non-existent household", async () => {
			const response = await fetch(
				"http://localhost:3000/api/households/00000000-0000-0000-0000-000000000000",
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				},
			);

			expect(response.status).toBe(404);
		});
	});

	describe("PUT /api/households/[id]", () => {
		it("should update household settings as creator", async () => {
			const response = await fetch(
				`http://localhost:3000/api/households/${householdId}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${authToken}`,
					},
					body: JSON.stringify({
						name: "Updated Household",
						description: "Updated description",
						settlement_day: 20,
					}),
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data.household.name).toBe("Updated Household");
			expect(data.household.description).toBe("Updated description");
			expect(data.household.settlement_day).toBe(20);
		});
	});

	describe("DELETE /api/households/[id]/members/[userId]", () => {
		it("should allow user to leave household", async () => {
			// First, create another user to ensure creator is not sole member
			const { data: otherUser } = await supabaseAdmin.auth.admin.createUser({
				email: `test-other-${Date.now()}@example.com`,
				password: "testpassword123",
				email_confirm: true,
			});

			if (otherUser?.user) {
				// Add other user as member
				await supabaseAdmin.from("household_members").insert({
					household_id: householdId,
					user_id: otherUser.user.id,
					role: "member",
				});

				const response = await fetch(
					`http://localhost:3000/api/households/${householdId}/members/${testUser.id}`,
					{
						method: "DELETE",
						headers: {
							Authorization: `Bearer ${authToken}`,
						},
					},
				);

				expect(response.status).toBe(200);

				// Cleanup
				await supabaseAdmin.auth.admin.deleteUser(otherUser.user.id);
			}
		});
	});
});
