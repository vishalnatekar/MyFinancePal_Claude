import { GET, PUT } from "@/app/api/user/preferences/route";
import { authenticateRequest } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { createMocks } from "node-mocks-http";

// Mock external dependencies
jest.mock("@/lib/auth");
jest.mock("@/lib/supabase");

const mockAuthenticateRequest = authenticateRequest as jest.MockedFunction<
	typeof authenticateRequest
>;
const mockSupabase = supabase as jest.MockedObject<typeof supabase>;

describe("/api/user/preferences", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("GET", () => {
		it("returns default preferences when user has none", async () => {
			const { req } = createMocks({
				method: "GET",
			});

			const mockUser = { id: "test-user-id", email: "test@example.com" };
			mockAuthenticateRequest.mockResolvedValue(mockUser as any);

			(mockSupabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: { notification_preferences: null },
							error: null,
						}),
					}),
				}),
			});

			const response = await GET(req as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual({
				email_notifications: true,
				shared_expense_alerts: true,
				settlement_reminders: true,
				timezone: "America/New_York",
			});
		});

		it("returns user preferences when they exist", async () => {
			const { req } = createMocks({
				method: "GET",
			});

			const mockUser = { id: "test-user-id", email: "test@example.com" };
			mockAuthenticateRequest.mockResolvedValue(mockUser as any);

			const mockPreferences = {
				email_notifications: false,
				shared_expense_alerts: false,
				settlement_reminders: true,
				timezone: "America/Los_Angeles",
			};

			(mockSupabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: { notification_preferences: mockPreferences },
							error: null,
						}),
					}),
				}),
			});

			const response = await GET(req as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual(mockPreferences);
		});

		it("returns 401 when user is not authenticated", async () => {
			const { req } = createMocks({
				method: "GET",
			});

			mockAuthenticateRequest.mockRejectedValue(new Error("Unauthorized"));

			const response = await GET(req as any);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe("Unauthorized");
		});

		it("returns 500 when database error occurs", async () => {
			const { req } = createMocks({
				method: "GET",
			});

			const mockUser = { id: "test-user-id", email: "test@example.com" };
			mockAuthenticateRequest.mockResolvedValue(mockUser as any);

			(mockSupabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: null,
							error: { message: "Database error" },
						}),
					}),
				}),
			});

			const response = await GET(req as any);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to fetch preferences");
		});
	});

	describe("PUT", () => {
		it("updates user preferences successfully", async () => {
			const { req } = createMocks({
				method: "PUT",
				body: {
					email_notifications: false,
					timezone: "America/Los_Angeles",
				},
			});

			const mockUser = { id: "test-user-id", email: "test@example.com" };
			mockAuthenticateRequest.mockResolvedValue(mockUser as any);

			const existingPreferences = {
				email_notifications: true,
				shared_expense_alerts: true,
				settlement_reminders: true,
				timezone: "America/New_York",
			};

			// Mock the select query for existing preferences
			(mockSupabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: { notification_preferences: existingPreferences },
							error: null,
						}),
					}),
				}),
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						error: null,
					}),
				}),
			});

			const response = await PUT(req as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual({
				email_notifications: false,
				shared_expense_alerts: true,
				settlement_reminders: true,
				timezone: "America/Los_Angeles",
			});
		});

		it("returns 400 for invalid request data", async () => {
			const { req } = createMocks({
				method: "PUT",
				body: {
					email_notifications: "not-a-boolean",
					timezone: 123,
				},
			});

			const mockUser = { id: "test-user-id", email: "test@example.com" };
			mockAuthenticateRequest.mockResolvedValue(mockUser as any);

			const response = await PUT(req as any);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("Invalid request data");
		});

		it("returns 401 when user is not authenticated", async () => {
			const { req } = createMocks({
				method: "PUT",
				body: {
					email_notifications: false,
				},
			});

			mockAuthenticateRequest.mockRejectedValue(new Error("Unauthorized"));

			const response = await PUT(req as any);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe("Unauthorized");
		});

		it("returns 500 when update fails", async () => {
			const { req } = createMocks({
				method: "PUT",
				body: {
					email_notifications: false,
				},
			});

			const mockUser = { id: "test-user-id", email: "test@example.com" };
			mockAuthenticateRequest.mockResolvedValue(mockUser as any);

			// Mock successful fetch but failed update
			const selectMock = {
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: { notification_preferences: {} },
							error: null,
						}),
					}),
				}),
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						error: { message: "Update failed" },
					}),
				}),
			};

			(mockSupabase.from as jest.Mock).mockReturnValue(selectMock);

			const response = await PUT(req as any);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to update preferences");
		});
	});
});
