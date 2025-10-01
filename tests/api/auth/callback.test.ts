import { GET } from "@/app/api/auth/callback/route";
import { AuthService } from "@/services/auth-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@supabase/auth-helpers-nextjs");
jest.mock("@/services/auth-service");
jest.mock("next/headers", () => ({
	cookies: jest.fn(),
}));

const mockCreateRouteHandlerClient =
	createRouteHandlerClient as jest.MockedFunction<
		typeof createRouteHandlerClient
	>;
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

const mockUser = {
	id: "test-user-id",
	email: "test@example.com",
	user_metadata: {
		full_name: "Test User",
		avatar_url: "https://example.com/avatar.jpg",
	},
};

const mockSupabaseClient = {
	auth: {
		exchangeCodeForSession: jest.fn(),
	},
};

describe("/api/auth/callback", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockCreateRouteHandlerClient.mockReturnValue(mockSupabaseClient as any);
	});

	it("redirects to dashboard on successful authentication", async () => {
		const request = new NextRequest(
			"http://localhost:3000/api/auth/callback?code=test-code",
		);

		mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
			data: {
				session: { user: mockUser },
			},
			error: null,
		});

		mockAuthService.handleOAuthCallback.mockResolvedValue({
			success: true,
			profile: {
				id: "test-user-id",
				email: "test@example.com",
				full_name: "Test User",
				avatar_url: "https://example.com/avatar.jpg",
				created_at: "2023-01-01T00:00:00.000Z",
				updated_at: "2023-01-01T00:00:00.000Z",
			},
		});

		const response = await GET(request);

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe(
			"http://localhost:3000/household",
		);
	});

	it("redirects to error page when authorization code is missing", async () => {
		const request = new NextRequest("http://localhost:3000/api/auth/callback");

		const response = await GET(request);

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toContain(
			"/auth/error?message=missing_code",
		);
	});

	it("redirects to error page when OAuth error is present", async () => {
		const request = new NextRequest(
			"http://localhost:3000/api/auth/callback?error=access_denied&error_description=User%20denied%20access",
		);

		const response = await GET(request);

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toContain(
			"/auth/error?message=access_denied",
		);
	});

	it("handles exchange code for session error", async () => {
		const request = new NextRequest(
			"http://localhost:3000/api/auth/callback?code=invalid-code",
		);

		mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
			data: null,
			error: { message: "Invalid authorization code" },
		});

		const response = await GET(request);

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toContain(
			"/auth/error?message=oauth_error",
		);
	});

	it("handles missing user in session", async () => {
		const request = new NextRequest(
			"http://localhost:3000/api/auth/callback?code=test-code",
		);

		mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
			data: {
				session: { user: null },
			},
			error: null,
		});

		const response = await GET(request);

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toContain(
			"/auth/error?message=oauth_error",
		);
	});

	it("continues to dashboard even if profile creation fails", async () => {
		const request = new NextRequest(
			"http://localhost:3000/api/auth/callback?code=test-code",
		);

		mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
			data: {
				session: { user: mockUser },
			},
			error: null,
		});

		mockAuthService.handleOAuthCallback.mockResolvedValue({
			success: false,
			error: "Profile creation failed",
		});

		const response = await GET(request);

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe(
			"http://localhost:3000/household",
		);
	});

	it("handles unexpected errors", async () => {
		const request = new NextRequest(
			"http://localhost:3000/api/auth/callback?code=test-code",
		);

		mockSupabaseClient.auth.exchangeCodeForSession.mockRejectedValue(
			new Error("Unexpected error"),
		);

		const response = await GET(request);

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toContain(
			"/auth/error?message=server_error",
		);
	});

	it("handles different OAuth error types", async () => {
		// Test access_denied specifically
		const accessDeniedRequest = new NextRequest(
			"http://localhost:3000/api/auth/callback?error=access_denied",
		);

		let response = await GET(accessDeniedRequest);
		expect(response.headers.get("location")).toContain("message=access_denied");

		// Test other OAuth errors
		const otherErrorRequest = new NextRequest(
			"http://localhost:3000/api/auth/callback?error=invalid_request",
		);

		response = await GET(otherErrorRequest);
		expect(response.headers.get("location")).toContain("message=oauth_error");
	});

	it("logs profile creation warnings but continues", async () => {
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();
		const request = new NextRequest(
			"http://localhost:3000/api/auth/callback?code=test-code",
		);

		mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
			data: {
				session: { user: mockUser },
			},
			error: null,
		});

		mockAuthService.handleOAuthCallback.mockResolvedValue({
			success: false,
			error: "Profile update warning",
		});

		const response = await GET(request);

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe(
			"http://localhost:3000/household",
		);

		consoleSpy.mockRestore();
	});
});
