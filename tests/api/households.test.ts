import { GET, POST } from "@/app/api/households/route";
import { NextRequest } from "next/server";

// Mock the auth function
jest.mock("@/lib/auth", () => ({
	authenticateRequest: jest.fn().mockResolvedValue({
		id: "user-123",
		email: "test@example.com",
	}),
}));

// Mock Supabase admin
const mockSupabaseAdmin = {
	from: jest.fn(() => ({
		select: jest.fn(() => ({
			eq: jest.fn(() => ({
				data: [],
				error: null,
			})),
		})),
		insert: jest.fn(() => ({
			select: jest.fn(() => ({
				single: jest.fn(() => ({
					data: {
						id: "household-123",
						name: "Test Household",
						created_by: "user-123",
					},
					error: null,
				})),
			})),
		})),
	})),
};

jest.mock("@/lib/supabase", () => ({
	supabaseAdmin: mockSupabaseAdmin,
}));

describe("/api/households", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("GET", () => {
		it("should return households for authenticated user", async () => {
			const request = new NextRequest("http://localhost:3000/api/households");

			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveProperty("households");
		});
	});

	describe("POST", () => {
		it("should create a new household", async () => {
			const requestBody = {
				name: "Test Household",
				description: "A test household",
			};

			const request = new NextRequest("http://localhost:3000/api/households", {
				method: "POST",
				body: JSON.stringify(requestBody),
				headers: {
					"Content-Type": "application/json",
				},
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data).toHaveProperty("household");
		});

		it("should validate required fields", async () => {
			const requestBody = {
				description: "Missing name field",
			};

			const request = new NextRequest("http://localhost:3000/api/households", {
				method: "POST",
				body: JSON.stringify(requestBody),
				headers: {
					"Content-Type": "application/json",
				},
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toHaveProperty("error");
		});
	});
});
