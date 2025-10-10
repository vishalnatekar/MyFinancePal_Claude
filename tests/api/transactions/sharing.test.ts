/**
 * Unit tests for PUT /api/transactions/[id]/sharing endpoint
 * Tests transaction sharing functionality with household controls
 */

import { PUT } from "@/app/api/transactions/[id]/sharing/route";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

describe("PUT /api/transactions/[id]/sharing", () => {
	let mockSupabase: any;
	let mockCookieStore: any;

	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks();

		// Mock cookie store
		mockCookieStore = {
			getAll: jest.fn().mockReturnValue([]),
			set: jest.fn(),
		};
		(cookies as jest.Mock).mockResolvedValue(mockCookieStore);

		// Mock Supabase client
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

			const request = new Request("http://localhost:3000/api/transactions/123/sharing", {
				method: "PUT",
				body: JSON.stringify({ household_id: "household-1", is_shared: true }),
			});

			const response = await PUT(request, { params: { id: "123" } });
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

		it("should validate household_id is required when sharing", async () => {
			const request = new Request("http://localhost:3000/api/transactions/123/sharing", {
				method: "PUT",
				body: JSON.stringify({ household_id: null, is_shared: true }),
			});

			const response = await PUT(request, { params: { id: "transaction-1" } });
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toContain("household_id is required");
		});

		it("should reject invalid household_id format", async () => {
			const request = new Request("http://localhost:3000/api/transactions/123/sharing", {
				method: "PUT",
				body: JSON.stringify({ household_id: "invalid-uuid", is_shared: true }),
			});

			const response = await PUT(request, { params: { id: "transaction-1" } });
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("Invalid request data");
		});

		it("should accept valid unshare request without household_id", async () => {
			mockSupabase.from.mockReturnValue({
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
			});

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
					select: jest.fn().mockReturnThis(),
					insert: jest.fn().mockReturnThis(),
				};
			});

			const request = new Request("http://localhost:3000/api/transactions/123/sharing", {
				method: "PUT",
				body: JSON.stringify({ household_id: null, is_shared: false }),
			});

			// This should not throw validation error
			await PUT(request, { params: { id: "transaction-1" } });
		});
	});

	describe("Transaction Ownership", () => {
		beforeEach(() => {
			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: { id: "user-1" } },
				error: null,
			});
		});

		it("should return 404 if transaction does not exist", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				single: jest.fn().mockResolvedValue({
					data: null,
					error: new Error("Not found"),
				}),
			});

			const request = new Request("http://localhost:3000/api/transactions/123/sharing", {
				method: "PUT",
				body: JSON.stringify({
					household_id: "550e8400-e29b-41d4-a716-446655440000",
					is_shared: true,
				}),
			});

			const response = await PUT(request, { params: { id: "non-existent" } });
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe("Transaction not found");
		});

		it("should return 403 if user does not own the transaction", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				single: jest.fn().mockResolvedValue({
					data: {
						id: "transaction-1",
						account_id: "account-1",
						financial_accounts: { user_id: "other-user" },
					},
					error: null,
				}),
			});

			const request = new Request("http://localhost:3000/api/transactions/123/sharing", {
				method: "PUT",
				body: JSON.stringify({
					household_id: "550e8400-e29b-41d4-a716-446655440000",
					is_shared: true,
				}),
			});

			const response = await PUT(request, { params: { id: "transaction-1" } });
			const data = await response.json();

			expect(response.status).toBe(403);
			expect(data.error).toBe("You do not own this transaction");
		});
	});

	describe("Household Membership", () => {
		beforeEach(() => {
			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: { id: "user-1" } },
				error: null,
			});
		});

		it("should return 403 if user is not a member of the household", async () => {
			let callCount = 0;
			mockSupabase.from.mockImplementation((table: string) => {
				callCount++;
				if (callCount === 1) {
					// First call - transaction lookup
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
					};
				}
				// Second call - household membership check
				return {
					select: jest.fn().mockReturnThis(),
					eq: jest.fn().mockReturnThis(),
					single: jest.fn().mockResolvedValue({
						data: null, // User is not a member
						error: null,
					}),
				};
			});

			const request = new Request("http://localhost:3000/api/transactions/123/sharing", {
				method: "PUT",
				body: JSON.stringify({
					household_id: "550e8400-e29b-41d4-a716-446655440000",
					is_shared: true,
				}),
			});

			const response = await PUT(request, { params: { id: "transaction-1" } });
			const data = await response.json();

			expect(response.status).toBe(403);
			expect(data.error).toContain("not a member of the specified household");
		});
	});

	describe("Successful Sharing Operations", () => {
		beforeEach(() => {
			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: { id: "user-1" } },
				error: null,
			});
		});

		it("should successfully share a transaction with a household", async () => {
			const householdId = "550e8400-e29b-41d4-a716-446655440000";
			const transactionId = "660e8400-e29b-41d4-a716-446655440001";

			let callCount = 0;
			mockSupabase.from.mockImplementation((table: string) => {
				callCount++;
				if (callCount === 1) {
					// Transaction ownership check
					return {
						select: jest.fn().mockReturnThis(),
						eq: jest.fn().mockReturnThis(),
						single: jest.fn().mockResolvedValue({
							data: {
								id: transactionId,
								account_id: "account-1",
								financial_accounts: { user_id: "user-1" },
							},
							error: null,
						}),
					};
				}
				if (callCount === 2) {
					// Household membership check
					return {
						select: jest.fn().mockReturnThis(),
						eq: jest.fn().mockReturnThis(),
						single: jest.fn().mockResolvedValue({
							data: { id: "member-1" },
							error: null,
						}),
					};
				}
				if (callCount === 3) {
					// Update transaction
					return {
						update: jest.fn().mockReturnThis(),
						eq: jest.fn().mockResolvedValue({
							data: null,
							error: null,
						}),
					};
				}
				if (callCount === 4) {
					// Insert sharing history
					return {
						insert: jest.fn().mockResolvedValue({
							data: null,
							error: null,
						}),
					};
				}
				// Fetch updated transaction
				return {
					select: jest.fn().mockReturnThis(),
					eq: jest.fn().mockReturnThis(),
					single: jest.fn().mockResolvedValue({
						data: {
							id: transactionId,
							is_shared_expense: true,
							shared_with_household_id: householdId,
							shared_by: "user-1",
						},
						error: null,
					}),
				};
			});

			const request = new Request("http://localhost:3000/api/transactions/123/sharing", {
				method: "PUT",
				body: JSON.stringify({
					household_id: householdId,
					is_shared: true,
				}),
			});

			const response = await PUT(request, { params: { id: transactionId } });
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.transaction.is_shared_expense).toBe(true);
			expect(data.transaction.shared_with_household_id).toBe(householdId);
		});

		it("should successfully unshare a transaction", async () => {
			const transactionId = "660e8400-e29b-41d4-a716-446655440001";

			let callCount = 0;
			mockSupabase.from.mockImplementation((table: string) => {
				callCount++;
				if (callCount === 1) {
					// Transaction ownership check
					return {
						select: jest.fn().mockReturnThis(),
						eq: jest.fn().mockReturnThis(),
						single: jest.fn().mockResolvedValue({
							data: {
								id: transactionId,
								account_id: "account-1",
								financial_accounts: { user_id: "user-1" },
							},
							error: null,
						}),
					};
				}
				if (callCount === 2) {
					// Update transaction
					return {
						update: jest.fn().mockReturnThis(),
						eq: jest.fn().mockResolvedValue({
							data: null,
							error: null,
						}),
					};
				}
				// Fetch updated transaction
				return {
					select: jest.fn().mockReturnThis(),
					eq: jest.fn().mockReturnThis(),
					single: jest.fn().mockResolvedValue({
						data: {
							id: transactionId,
							is_shared_expense: false,
							shared_with_household_id: null,
							shared_by: null,
						},
						error: null,
					}),
				};
			});

			const request = new Request("http://localhost:3000/api/transactions/123/sharing", {
				method: "PUT",
				body: JSON.stringify({
					household_id: null,
					is_shared: false,
				}),
			});

			const response = await PUT(request, { params: { id: transactionId } });
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.transaction.is_shared_expense).toBe(false);
			expect(data.transaction.shared_with_household_id).toBeNull();
		});
	});
});
