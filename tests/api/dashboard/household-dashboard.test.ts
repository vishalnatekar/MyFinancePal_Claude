import { createMocks } from "node-mocks-http";
import { GET } from "@/app/api/dashboard/household/[id]/route";
import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: jest.fn(),
		auth: {
			admin: {
				getUserById: jest.fn(),
			},
		},
	},
}));

// Mock auth middleware
jest.mock("@/lib/auth-middleware", () => ({
	withHouseholdAuth: (handler: any) => handler,
}));

describe("GET /api/dashboard/household/[id]", () => {
	const mockUser: User = {
		id: "user-1",
		email: "john@example.com",
		aud: "authenticated",
		role: "authenticated",
		created_at: "2024-01-01T00:00:00Z",
		app_metadata: {},
		user_metadata: {},
	};

	const mockHousehold = {
		id: "household-1",
		name: "Test Household",
		description: "A test household",
		settlement_day: 1,
	};

	const mockMembers = [
		{
			id: "member-1",
			user_id: "user-1",
			role: "owner",
			joined_at: "2024-01-01T00:00:00Z",
		},
		{
			id: "member-2",
			user_id: "user-2",
			role: "member",
			joined_at: "2024-01-15T00:00:00Z",
		},
	];

	const mockProfiles = [
		{
			id: "user-1",
			email: "john@example.com",
			full_name: "John Doe",
			avatar_url: null,
		},
		{
			id: "user-2",
			email: "jane@example.com",
			full_name: "Jane Doe",
			avatar_url: null,
		},
	];

	const mockAccounts = [
		{
			id: "acc-1",
			user_id: "user-1",
			account_type: "checking",
			account_name: "Main Checking",
			institution_name: "Test Bank",
			current_balance: 5000,
			currency: "GBP",
			last_synced: "2024-01-15T10:00:00Z",
			is_manual: false,
		},
		{
			id: "acc-2",
			user_id: "user-2",
			account_type: "savings",
			account_name: "Savings",
			institution_name: "Test Bank",
			current_balance: 10000,
			currency: "GBP",
			last_synced: "2024-01-15T09:00:00Z",
			is_manual: false,
		},
	];

	const mockTransactions = [
		{
			id: "tx-1",
			account_id: "acc-1",
			amount: -50,
			merchant_name: "Tesco",
			description: "Grocery shopping",
			category: "groceries",
			date: "2024-01-15",
			shared_at: "2024-01-15T10:00:00Z",
			shared_by: "user-1",
			financial_accounts: { user_id: "user-1" },
		},
		{
			id: "tx-2",
			account_id: "acc-2",
			amount: -30,
			merchant_name: "Costa",
			description: "Coffee",
			category: "food",
			date: "2024-01-14",
			shared_at: "2024-01-14T14:00:00Z",
			shared_by: "user-2",
			financial_accounts: { user_id: "user-2" },
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should return 404 if household not found", async () => {
		const { req } = createMocks({
			method: "GET",
		});

		// Mock household query to return null
		(supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
		});

		const response = await GET(req as any, mockUser, "non-existent-id");
		const data = await response.json();

		expect(response.status).toBe(404);
		expect(data.error).toBe("Household not found");
	});

	it("should return 500 if members fetch fails", async () => {
		const { req } = createMocks({
			method: "GET",
		});

		// Mock household query success
		(supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: mockHousehold, error: null }),
		});

		// Mock members query failure
		(supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			mockResolvedValue: jest.fn().mockResolvedValue({ data: null, error: { message: "Database error" } }),
		});

		const response = await GET(req as any, mockUser, "household-1");
		const data = await response.json();

		expect(response.status).toBe(500);
	});

	it("should successfully return household dashboard data", async () => {
		const { req } = createMocks({
			method: "GET",
		});

		// Mock all database calls in sequence
		const fromMock = supabaseAdmin.from as jest.Mock;

		// 1. Household query
		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: mockHousehold, error: null }),
		});

		// 2. Members query
		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			mockResolvedValue: jest.fn().mockResolvedValue({ data: mockMembers, error: null }),
		});

		// 3. Profiles query
		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			in: jest.fn().mockResolvedValue({ data: mockProfiles, error: null }),
		});

		// 4. Accounts query
		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			in: jest.fn().mockResolvedValue({ data: mockAccounts, error: null }),
		});

		// 5. Transactions query
		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			in: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockResolvedValue({ data: mockTransactions, error: null }),
		});

		const response = await GET(req as any, mockUser, "household-1");
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.household).toBeDefined();
		expect(data.household.id).toBe("household-1");
		expect(data.household.name).toBe("Test Household");
	});

	it("should calculate shared net worth correctly", async () => {
		const { req } = createMocks({
			method: "GET",
		});

		// Setup mocks for successful query
		const fromMock = supabaseAdmin.from as jest.Mock;

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: mockHousehold, error: null }),
		});

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockResolvedValue({ data: mockMembers, error: null }),
		});

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			in: jest.fn().mockResolvedValue({ data: mockProfiles, error: null }),
		});

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			in: jest.fn().mockResolvedValue({ data: mockAccounts, error: null }),
		});

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			in: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockResolvedValue({ data: mockTransactions, error: null }),
		});

		const response = await GET(req as any, mockUser, "household-1");
		const data = await response.json();

		// 5000 + 10000 = 15000
		expect(data.shared_net_worth).toBe(15000);
	});

	it("should include member statistics", async () => {
		const { req } = createMocks({
			method: "GET",
		});

		const fromMock = supabaseAdmin.from as jest.Mock;

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: mockHousehold, error: null }),
		});

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockResolvedValue({ data: mockMembers, error: null }),
		});

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			in: jest.fn().mockResolvedValue({ data: mockProfiles, error: null }),
		});

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			in: jest.fn().mockResolvedValue({ data: mockAccounts, error: null }),
		});

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			in: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockResolvedValue({ data: mockTransactions, error: null }),
		});

		const response = await GET(req as any, mockUser, "household-1");
		const data = await response.json();

		expect(data.members).toBeDefined();
		expect(data.members.length).toBe(2);
		expect(data.members[0]).toHaveProperty("shared_accounts_count");
		expect(data.members[0]).toHaveProperty("shared_transactions_count");
		expect(data.members[0]).toHaveProperty("total_contribution");
	});

	it("should include activity feed", async () => {
		const { req } = createMocks({
			method: "GET",
		});

		const fromMock = supabaseAdmin.from as jest.Mock;

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: mockHousehold, error: null }),
		});

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockResolvedValue({ data: mockMembers, error: null }),
		});

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			in: jest.fn().mockResolvedValue({ data: mockProfiles, error: null }),
		});

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			in: jest.fn().mockResolvedValue({ data: mockAccounts, error: null }),
		});

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			in: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockResolvedValue({ data: mockTransactions, error: null }),
		});

		const response = await GET(req as any, mockUser, "household-1");
		const data = await response.json();

		expect(data.activity_feed).toBeDefined();
		expect(Array.isArray(data.activity_feed)).toBe(true);
	});

	it("should handle empty accounts and transactions", async () => {
		const { req } = createMocks({
			method: "GET",
		});

		const fromMock = supabaseAdmin.from as jest.Mock;

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: mockHousehold, error: null }),
		});

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockResolvedValue({ data: mockMembers, error: null }),
		});

		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			in: jest.fn().mockResolvedValue({ data: mockProfiles, error: null }),
		});

		// Empty accounts
		fromMock.mockReturnValueOnce({
			select: jest.fn().mockReturnThis(),
			in: jest.fn().mockResolvedValue({ data: [], error: null }),
		});

		const response = await GET(req as any, mockUser, "household-1");
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.shared_net_worth).toBe(0);
		expect(data.shared_accounts).toEqual([]);
		expect(data.recent_shared_transactions).toEqual([]);
	});
});
