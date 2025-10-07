import {
	getCurrentUser,
	signInWithGoogle,
	signOut,
	upsertUserProfile,
} from "@/lib/auth";
import type { Profile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface AuthResponse {
	success: boolean;
	user?: User;
	error?: string;
}

export interface ProfileResponse {
	success: boolean;
	profile?: Profile;
	error?: string;
}

export class AuthService {
	// Sign in with Google OAuth
	static async signInWithGoogle(redirectTo?: string): Promise<AuthResponse> {
		try {
			await signInWithGoogle(redirectTo);
			return { success: true };
		} catch (error) {
			console.error("Google sign-in error:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to sign in with Google",
			};
		}
	}

	// Sign out user
	static async signOut(): Promise<AuthResponse> {
		try {
			await signOut();
			return { success: true };
		} catch (error) {
			console.error("Sign out error:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to sign out",
			};
		}
	}

	// Get current authenticated user
	static async getCurrentUser(): Promise<User | null> {
		try {
			return await getCurrentUser();
		} catch (error) {
			console.error("Get current user error:", error);
			return null;
		}
	}

	// Get user profile
	static async getUserProfile(userId?: string): Promise<ProfileResponse> {
		try {
			let targetUserId = userId;

			if (!targetUserId) {
				const currentUser = await getCurrentUser();
				if (!currentUser) {
					return { success: false, error: "User not authenticated" };
				}
				targetUserId = currentUser.id;
			}

			const { data, error } = await supabase
				.from("profiles")
				.select("*")
				.eq("id", targetUserId)
				.single();

			if (error) {
				return { success: false, error: error.message };
			}

			return { success: true, profile: data };
		} catch (error) {
			console.error("Get user profile error:", error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to get user profile",
			};
		}
	}

	// Create or update user profile
	static async upsertUserProfile(
		userId: string,
		profileData: Partial<Profile>,
	): Promise<ProfileResponse> {
		try {
			const profile = await upsertUserProfile(userId, profileData);

			if (!profile) {
				return {
					success: false,
					error: "Failed to create/update user profile",
				};
			}

			return { success: true, profile };
		} catch (error) {
			console.error("Upsert user profile error:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to create/update user profile",
			};
		}
	}

	// Handle OAuth callback and create user profile
	static async handleOAuthCallback(user: User): Promise<ProfileResponse> {
		try {
			// Extract user data from OAuth response
			const profileData: Partial<Profile> = {
				email: user.email!,
				full_name:
					user.user_metadata?.full_name || user.user_metadata?.name || null,
				avatar_url:
					user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
			};

			// Create or update user profile
			return await this.upsertUserProfile(user.id, profileData);
		} catch (error) {
			console.error("OAuth callback handling error:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to handle OAuth callback",
			};
		}
	}

	// Check authentication status
	static async isAuthenticated(): Promise<boolean> {
		try {
			const user = await getCurrentUser();
			return !!user;
		} catch (error) {
			return false;
		}
	}

	// Listen to authentication state changes
	static onAuthStateChange(callback: (user: User | null) => void) {
		return supabase.auth.onAuthStateChange((_event, session) => {
			callback(session?.user ?? null);
		});
	}

	// Refresh user session
	static async refreshSession(): Promise<AuthResponse> {
		try {
			const { data, error } = await supabase.auth.refreshSession();

			if (error) {
				return { success: false, error: error.message };
			}

			return { success: true, user: data.user ?? undefined };
		} catch (error) {
			console.error("Refresh session error:", error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to refresh session",
			};
		}
	}
}
