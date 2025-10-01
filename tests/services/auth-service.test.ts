import { supabase } from "@/lib/supabase";
import { AuthService } from "@/services/auth-service";
import type { User } from "@supabase/supabase-js";

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
	supabase: {
		auth: {
			signInWithOAuth: jest.fn(),
			signOut: jest.fn(),
			getUser: jest.fn(),
			onAuthStateChange: jest.fn(),
			refreshSession: jest.fn(),
		},
		from: jest.fn(() => ({
			select: jest.fn(() => ({
				eq: jest.fn(() => ({
					single: jest.fn(),
				})),
			})),
			upsert: jest.fn(() => ({
				select: jest.fn(() => ({
					single: jest.fn(),
				})),
			})),
		})),
	},
}));

// Mock auth helper functions
jest.mock("@/lib/auth", () => ({
	signInWithGoogle: jest.fn(),
	signOut: jest.fn(),
	getCurrentUser: jest.fn(),
	upsertUserProfile: jest.fn(),
}));

const mockUser: User = {
	id: "test-user-id",
	email: "test@example.com",
	user_metadata: {
		full_name: "Test User",
		avatar_url: "https://example.com/avatar.jpg",
	},
	app_metadata: {},
	aud: "authenticated",
	created_at: "2023-01-01T00:00:00.000Z",
} as User;

describe("AuthService", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("signInWithGoogle", () => {
		it("should sign in with Google successfully", async () => {
			const { signInWithGoogle: mockSignInWithGoogle } = require("@/lib/auth");
			mockSignInWithGoogle.mockResolvedValue(true);

			const result = await AuthService.signInWithGoogle();

			expect(result.success).toBe(true);
			expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
		});

		it("should handle sign in errors", async () => {
			const { signInWithGoogle: mockSignInWithGoogle } = require("@/lib/auth");
			const errorMessage = "OAuth error occurred";
			mockSignInWithGoogle.mockRejectedValue(new Error(errorMessage));

			const result = await AuthService.signInWithGoogle();

			expect(result.success).toBe(false);
			expect(result.error).toBe(errorMessage);
		});
	});

	describe("signOut", () => {
		it("should sign out successfully", async () => {
			const { signOut: mockSignOut } = require("@/lib/auth");
			mockSignOut.mockResolvedValue(true);

			const result = await AuthService.signOut();

			expect(result.success).toBe(true);
			expect(mockSignOut).toHaveBeenCalledTimes(1);
		});

		it("should handle sign out errors", async () => {
			const { signOut: mockSignOut } = require("@/lib/auth");
			const errorMessage = "Sign out failed";
			mockSignOut.mockRejectedValue(new Error(errorMessage));

			const result = await AuthService.signOut();

			expect(result.success).toBe(false);
			expect(result.error).toBe(errorMessage);
		});
	});

	describe("getCurrentUser", () => {
		it("should get current user successfully", async () => {
			const { getCurrentUser: mockGetCurrentUser } = require("@/lib/auth");
			mockGetCurrentUser.mockResolvedValue(mockUser);

			const result = await AuthService.getCurrentUser();

			expect(result).toBe(mockUser);
			expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
		});

		it("should handle get current user errors", async () => {
			const { getCurrentUser: mockGetCurrentUser } = require("@/lib/auth");
			mockGetCurrentUser.mockRejectedValue(new Error("Get user failed"));

			const result = await AuthService.getCurrentUser();

			expect(result).toBeNull();
		});
	});

	describe("getUserProfile", () => {
		it("should get user profile successfully", async () => {
			const mockProfile = {
				id: "test-user-id",
				email: "test@example.com",
				full_name: "Test User",
				avatar_url: "https://example.com/avatar.jpg",
				created_at: "2023-01-01T00:00:00.000Z",
				updated_at: "2023-01-01T00:00:00.000Z",
			};

			const mockSupabase = supabase as any;
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: mockProfile,
							error: null,
						}),
					}),
				}),
			});

			const result = await AuthService.getUserProfile("test-user-id");

			expect(result.success).toBe(true);
			expect(result.profile).toEqual(mockProfile);
		});

		it("should require authentication when no userId provided", async () => {
			const { getCurrentUser: mockGetCurrentUser } = require("@/lib/auth");
			mockGetCurrentUser.mockResolvedValue(null);

			const result = await AuthService.getUserProfile();

			expect(result.success).toBe(false);
			expect(result.error).toBe("User not authenticated");
		});
	});

	describe("handleOAuthCallback", () => {
		it("should handle OAuth callback successfully", async () => {
			const {
				upsertUserProfile: mockUpsertUserProfile,
			} = require("@/lib/auth");
			const mockProfile = {
				id: "test-user-id",
				email: "test@example.com",
				full_name: "Test User",
				avatar_url: "https://example.com/avatar.jpg",
				created_at: "2023-01-01T00:00:00.000Z",
				updated_at: "2023-01-01T00:00:00.000Z",
			};

			mockUpsertUserProfile.mockResolvedValue(mockProfile);

			const result = await AuthService.handleOAuthCallback(mockUser);

			expect(result.success).toBe(true);
			expect(result.profile).toEqual(mockProfile);
			expect(mockUpsertUserProfile).toHaveBeenCalledWith(mockUser.id, {
				email: mockUser.email,
				full_name: mockUser.user_metadata.full_name,
				avatar_url: mockUser.user_metadata.avatar_url,
			});
		});

		it("should handle callback errors", async () => {
			const {
				upsertUserProfile: mockUpsertUserProfile,
			} = require("@/lib/auth");
			mockUpsertUserProfile.mockRejectedValue(
				new Error("Profile creation failed"),
			);

			const result = await AuthService.handleOAuthCallback(mockUser);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Profile creation failed");
		});
	});

	describe("isAuthenticated", () => {
		it("should return true when user is authenticated", async () => {
			const { getCurrentUser: mockGetCurrentUser } = require("@/lib/auth");
			mockGetCurrentUser.mockResolvedValue(mockUser);

			const result = await AuthService.isAuthenticated();

			expect(result).toBe(true);
		});

		it("should return false when user is not authenticated", async () => {
			const { getCurrentUser: mockGetCurrentUser } = require("@/lib/auth");
			mockGetCurrentUser.mockResolvedValue(null);

			const result = await AuthService.isAuthenticated();

			expect(result).toBe(false);
		});

		it("should return false on error", async () => {
			const { getCurrentUser: mockGetCurrentUser } = require("@/lib/auth");
			mockGetCurrentUser.mockRejectedValue(new Error("Auth check failed"));

			const result = await AuthService.isAuthenticated();

			expect(result).toBe(false);
		});
	});

	describe("refreshSession", () => {
		it("should refresh session successfully", async () => {
			const mockSupabase = supabase as any;
			mockSupabase.auth.refreshSession.mockResolvedValue({
				data: { user: mockUser },
				error: null,
			});

			const result = await AuthService.refreshSession();

			expect(result.success).toBe(true);
			expect(result.user).toBe(mockUser);
		});

		it("should handle refresh session errors", async () => {
			const mockSupabase = supabase as any;
			const errorMessage = "Refresh failed";
			mockSupabase.auth.refreshSession.mockResolvedValue({
				data: null,
				error: { message: errorMessage },
			});

			const result = await AuthService.refreshSession();

			expect(result.success).toBe(false);
			expect(result.error).toBe(errorMessage);
		});
	});
});
