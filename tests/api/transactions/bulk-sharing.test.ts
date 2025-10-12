/**
 * Unit tests for POST /api/transactions/bulk-sharing endpoint
 * Tests bulk transaction sharing operations
 */

import { POST } from "@/app/api/transactions/bulk-sharing/route";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Mock dependencies
jest.mock("@supabase/ssr");
jest.mock("next/headers");
jest.mock("@/lib/config", () => ({
	config: {
		supabase: {
			url: "http://localhost:54321",
			anonKey: "test-anon-key",
		},
	},
}));

describe("POST /api/transactions/bulk-sharing", () => {
	let mockSupabase: any;
	let mockCookieStore: any;

	beforeEach(() => {
		jest.clearAllMocks();

		mockCookieStore = {
			getAll: jest.fn().mockReturnValue([]),
			set: jest.fn(),
		};
		(cookies as jest.Mock).mockResolvedValue(mockCookieStore);

		mockSupabase = {
			auth: {
				getUser: jest.fn(),
			},
			from: jest.fn(),
		};
		(createServerClient as jest.Mock).mockReturnValue(mockSupabase);
	});

	describe("Authentication", () => {
		it("should return 401 if user is not authenticated", async () => {
			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: null },
				error: new Error("Not authenticated"),
			});

			const request = new Request(
				"http://localhost:3000/api/transactions/bulk-sharing",
				{
					method: "POST",
					body: JSON.stringify({
						transaction_ids: ["550e8400-e29b-41d4-a716-446655440000"],
						household_id: "660e8400-e29b-41d4-a716-446655440001",
						is_shared: true,
					}),
				},
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe("Unauthorized");
		});
	});

	describe("Request Validation", () => {
		beforeEach(() => {
			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: { id: "user-1" } },
				error: null,
			});
		});

		it("should validate transaction_ids is required", async () => {
			const request = new Request(
				"http://localhost:3000/api/transactions/bulk-sharing",
				{
					method: "POST",
					body: JSON.stringify({
						transaction_ids: [],
						household_id: "660e8400-e29b-41d4-a716-446655440001",
						is_shared: true,
					}),
				},
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("Invalid request data");
		});

		it("should validate household_id is required when sharing", async () => {
			const request = new Request(
				"http://localhost:3000/api/transactions/bulk-sharing",
				{
					method: "POST",
					body: JSON.stringify({
						transaction_ids: ["550e8400-e29b-41d4-a716-446655440000"],
						household_id: null,
						is_shared: true,
					}),
				},
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toContain("household_id is required");
		});

		it("should reject invalid UUID format for transaction_ids", async () => {
			const request = new Request(
				"http://localhost:3000/api/transactions/bulk-sharing",
				{
					method: "POST",
					body: JSON.stringify({
						transaction_ids: ["invalid-uuid"],
						household_id: "660e8400-e29b-41d4-a716-446655440001",
						is_shared: true,
					}),
				},
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("Invalid request data");
		});
	});

	describe("Bulk Sharing Operations", () => {
		beforeEach(() => {
			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: { id: "user-1" } },
				error: null,
			});
		});

		it("should successfully share multiple transactions", async () => {
			const householdId = "660e8400-e29b-41d4-a716-446655440001";
			const transactionIds = [
				"550e8400-e29b-41d4-a716-446655440000",
				"550e8400-e29b-41d4-a716-446655440001",
			];

			mockSupabase.from.mockImplementation((table: string) => {
				if (table === "transactions") {
					return {
						select: jest.fn().mockReturnThis(),
						eq: jest.fn().mockReturnThis(),
						single: jest.fn().mockResolvedValue({
							data: {
								id: "transaction-1",
								account_id: "account-1",
								financial_accounts: { user_id: "user-1" },
							},
							error: null,
						}),
						update: jest.fn().mockReturnThis(),
					};
				}
				if (table === "household_members") {
					return {
						select: jest.fn().mockReturnThis(),
						eq: jest.fn().mockReturnThis(),
						single: jest.fn().mockResolvedValue({
							data: { id: "member-1" },
							error: null,
						}),
					};
				}
				return {
					insert: jest.fn().mockResolvedValue({
						data: null,
						error: null,
					}),
				};
			});

			const request = new Request(
				"http://localhost:3000/api/transactions/bulk-sharing",
				{
					method: "POST",
					body: JSON.stringify({
						transaction_ids: transactionIds,
						household_id: householdId,
						is_shared: true,
					}),
				},
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success_count).toBe(2);
			expect(data.failed_count).toBe(0);
			expect(data.errors).toHaveLength(0);
		});

		it("should handle partial success with mixed results", async () => {
			const householdId = "660e8400-e29b-41d4-a716-446655440001";
			const transactionIds = [
				"550e8400-e29b-41d4-a716-446655440000", // Will succeed
				"550e8400-e29b-41d4-a716-446655440001", // Will fail (not owned)
			];

			let callIndex = 0;
			mockSupabase.from.mockImplementation((table: string) => {
				if (table === "transactions") {
					callIndex++;
					if (callIndex === 1) {
						// First transaction - user owns it
						return {
							select: jest.fn().mockReturnThis(),
							eq: jest.fn().mockReturnThis(),
							single: jest.fn().mockResolvedValue({
								data: {
									id: transactionIds[0],
									account_id: "account-1",
									financial_accounts: { user_id: "user-1" },
								},
								error: null,
							}),
							update: jest.fn().mockReturnThis(),
						};
					}
					// Second transaction - user doesn't own it
					return {
						select: jest.fn().mockReturnThis(),
						eq: jest.fn().mockReturnThis(),
						single: jest.fn().mockResolvedValue({
							data: {
								id: transactionIds[1],
								account_id: "account-2",
								financial_accounts: { user_id: "other-user" },
							},
							error: null,
						}),
					};
				}
				if (table === "household_members") {
					return {
						select: jest.fn().mockReturnThis(),
						eq: jest.fn().mockReturnThis(),
						single: jest.fn().mockResolvedValue({
							data: { id: "member-1" },
							error: null,
						}),
					};
				}
				return {
					insert: jest.fn().mockResolvedValue({
						data: null,
						error: null,
					}),
				};
			});

			const request = new Request(
				"http://localhost:3000/api/transactions/bulk-sharing",
				{
					method: "POST",
					body: JSON.stringify({
						transaction_ids: transactionIds,
						household_id: householdId,
						is_shared: true,
					}),
				},
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success_count).toBe(1);
			expect(data.failed_count).toBe(1);
			expect(data.errors).toHaveLength(1);
			expect(data.errors[0].transaction_id).toBe(transactionIds[1]);
			expect(data.errors[0].error).toContain("do not own");
		});

		it("should handle all failures gracefully", async () => {
			const householdId = "660e8400-e29b-41d4-a716-446655440001";
			const transactionIds = [
				"550e8400-e29b-41d4-a716-446655440000",
				"550e8400-e29b-41d4-a716-446655440001",
			];

			mockSupabase.from.mockImplementation((table: string) => {
				if (table === "transactions") {
					return {
						select: jest.fn().mockReturnThis(),
						eq: jest.fn().mockReturnThis(),
						single: jest.fn().mockResolvedValue({
							data: null,
							error: new Error("Not found"),
						}),
					};
				}
				return {};
			});

			const request = new Request(
				"http://localhost:3000/api/transactions/bulk-sharing",
				{
					method: "POST",
					body: JSON.stringify({
						transaction_ids: transactionIds,
						household_id: householdId,
						is_shared: true,
					}),
				},
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success_count).toBe(0);
			expect(data.failed_count).toBe(2);
			expect(data.errors).toHaveLength(2);
		});

		it("should fail if user is not a member of the household", async () => {
			const householdId = "660e8400-e29b-41d4-a716-446655440001";
			const transactionIds = ["550e8400-e29b-41d4-a716-446655440000"];

			mockSupabase.from.mockImplementation((table: string) => {
				if (table === "transactions") {
					return {
						select: jest.fn().mockReturnThis(),
						eq: jest.fn().mockReturnThis(),
						single: jest.fn().mockResolvedValue({
							data: {
								id: transactionIds[0],
								account_id: "account-1",
								financial_accounts: { user_id: "user-1" },
							},
							error: null,
						}),
					};
				}
				if (table === "household_members") {
					return {
						select: jest.fn().mockReturnThis(),
						eq: jest.fn().mockReturnThis(),
						single: jest.fn().mockResolvedValue({
							data: null, // Not a member
							error: null,
						}),
					};
				}
				return {};
			});

			const request = new Request(
				"http://localhost:3000/api/transactions/bulk-sharing",
				{
					method: "POST",
					body: JSON.stringify({
						transaction_ids: transactionIds,
						household_id: householdId,
						is_shared: true,
					}),
				},
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success_count).toBe(0);
			expect(data.failed_count).toBe(1);
			expect(data.errors[0].error).toContain("not a member");
		});
	});

	describe("Bulk Unsharing Operations", () => {
		beforeEach(() => {
			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: { id: "user-1" } },
				error: null,
			});
		});

		it("should successfully unshare multiple transactions", async () => {
			const transactionIds = [
				"550e8400-e29b-41d4-a716-446655440000",
				"550e8400-e29b-41d4-a716-446655440001",
			];

			mockSupabase.from.mockImplementation((table: string) => {
				if (table === "transactions") {
					return {
						select: jest.fn().mockReturnThis(),
						eq: jest.fn().mockReturnThis(),
						single: jest.fn().mockResolvedValue({
							data: {
								id: "transaction-1",
								account_id: "account-1",
								financial_accounts: { user_id: "user-1" },
							},
							error: null,
						}),
						update: jest.fn().mockReturnThis(),
					};
				}
				return {
					insert: jest.fn().mockResolvedValue({
						data: null,
						error: null,
					}),
				};
			});

			const request = new Request(
				"http://localhost:3000/api/transactions/bulk-sharing",
				{
					method: "POST",
					body: JSON.stringify({
						transaction_ids: transactionIds,
						household_id: null,
						is_shared: false,
					}),
				},
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success_count).toBe(2);
			expect(data.failed_count).toBe(0);
		});
	});
});
