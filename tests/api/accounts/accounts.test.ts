import { GET, POST } from "@/app/api/accounts/route";
import { supabaseAdmin } from "@/lib/supabase";
import { createMocks } from "node-mocks-http";

// Mock the auth middleware
jest.mock("@/lib/auth-middleware", () => ({
	withAuth: (handler: any) => handler,
	checkRateLimit: jest.fn(() => true),
	createAuthErrorResponse: jest.fn(
		(message, status) =>
			new Response(JSON.stringify({ error: message }), { status }),
	),
}));

// Mock supabase
jest.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: jest.fn(),
	},
}));

describe("/api/accounts", () => {
	const mockUser = {
		id: "user-123",
		email: "test@example.com",
	};

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe("GET /api/accounts", () => {
		it("should return user's financial accounts", async () => {
			const mockAccounts = [
				{
					id: "account-1",
					account_type: "checking",
					account_name: "Main Account",
					institution_name: "Test Bank",
					current_balance: 1500.5,
					is_shared: false,
					is_manual: false,
					connection_status: "active",
					last_synced: "2023-01-01T12:00:00Z",
					created_at: "2023-01-01T10:00:00Z",
					updated_at: "2023-01-01T12:00:00Z",
				},
			];

			const mockSelect = jest.fn().mockReturnThis();
			const mockEq = jest.fn().mockReturnThis();
			const mockOrder = jest.fn().mockResolvedValue({
				data: mockAccounts,
				error: null,
			});

			(supabaseAdmin.from as jest.Mock).mockReturnValue({
				select: mockSelect,
			});

			mockSelect.mockReturnValue({
				eq: mockEq,
			});

			mockEq.mockReturnValue({
				order: mockOrder,
			});

			const { req } = createMocks({ method: "GET" });
			const response = await GET(req as any, mockUser as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.accounts).toEqual(mockAccounts);
			expect(supabaseAdmin.from).toHaveBeenCalledWith("financial_accounts");
			expect(mockEq).toHaveBeenCalledWith("user_id", mockUser.id);
		});

		it("should handle database errors", async () => {
			const mockSelect = jest.fn().mockReturnThis();
			const mockEq = jest.fn().mockReturnThis();
			const mockOrder = jest.fn().mockResolvedValue({
				data: null,
				error: { message: "Database error" },
			});

			(supabaseAdmin.from as jest.Mock).mockReturnValue({
				select: mockSelect,
			});

			mockSelect.mockReturnValue({
				eq: mockEq,
			});

			mockEq.mockReturnValue({
				order: mockOrder,
			});

			const { req } = createMocks({ method: "GET" });
			const response = await GET(req as any, mockUser as any);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to fetch accounts");
		});
	});

	describe("POST /api/accounts", () => {
		const validAccountData = {
			account_type: "checking",
			account_name: "Test Account",
			institution_name: "Test Bank",
			current_balance: 1000.0,
			is_shared: false,
		};

		it("should create a new manual account", async () => {
			const mockCreatedAccount = {
				id: "account-123",
				user_id: mockUser.id,
				...validAccountData,
				is_manual: true,
				connection_status: "active",
				created_at: "2023-01-01T12:00:00Z",
			};

			// Mock count check
			const mockCount = jest.fn().mockResolvedValue({
				count: 5,
				error: null,
			});

			// Mock insert
			const mockInsert = jest.fn().mockReturnThis();
			const mockInsertSelect = jest.fn().mockReturnThis();
			const mockSingle = jest.fn().mockResolvedValue({
				data: mockCreatedAccount,
				error: null,
			});

			(supabaseAdmin.from as jest.Mock)
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue(mockCount),
					}),
				})
				.mockReturnValueOnce({
					insert: mockInsert,
				})
				.mockReturnValueOnce({
					insert: jest.fn().mockReturnThis(),
				});

			mockInsert.mockReturnValue({
				select: mockInsertSelect,
			});

			mockInsertSelect.mockReturnValue({
				single: mockSingle,
			});

			const { req } = createMocks({
				method: "POST",
				body: validAccountData,
			});

			const response = await POST(req as any, mockUser as any);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.account).toEqual(mockCreatedAccount);
		});

		it("should validate input data", async () => {
			const invalidData = {
				account_type: "invalid_type",
				account_name: "",
				institution_name: "Test Bank",
				current_balance: "not_a_number",
			};

			const { req } = createMocks({
				method: "POST",
				body: invalidData,
			});

			const response = await POST(req as any, mockUser as any);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("Invalid input data");
			expect(data.details).toBeDefined();
		});

		it("should enforce account limit", async () => {
			// Mock count check returning max accounts
			const mockCount = jest.fn().mockResolvedValue({
				count: 20,
				error: null,
			});

			(supabaseAdmin.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue(mockCount),
				}),
			});

			const { req } = createMocks({
				method: "POST",
				body: validAccountData,
			});

			const response = await POST(req as any, mockUser as any);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("Maximum number of accounts reached (20)");
		});

		it("should handle database errors during creation", async () => {
			// Mock count check
			const mockCount = jest.fn().mockResolvedValue({
				count: 5,
				error: null,
			});

			// Mock insert error
			const mockInsert = jest.fn().mockReturnThis();
			const mockInsertSelect = jest.fn().mockReturnThis();
			const mockSingle = jest.fn().mockResolvedValue({
				data: null,
				error: { message: "Database error" },
			});

			(supabaseAdmin.from as jest.Mock)
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue(mockCount),
					}),
				})
				.mockReturnValueOnce({
					insert: mockInsert,
				});

			mockInsert.mockReturnValue({
				select: mockInsertSelect,
			});

			mockInsertSelect.mockReturnValue({
				single: mockSingle,
			});

			const { req } = createMocks({
				method: "POST",
				body: validAccountData,
			});

			const response = await POST(req as any, mockUser as any);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to create account");
		});
	});
});
