"use client";

import type { Profile } from "@/lib/auth";
import { AuthService } from "@/services/auth-service";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export interface UseAuthReturn {
	user: User | null;
	profile: Profile | null;
	loading: boolean;
	error: string | null;
	signInWithGoogle: (redirectTo?: string) => Promise<void>;
	signOut: () => Promise<void>;
	refreshProfile: () => Promise<void>;
	isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
	const [user, setUser] = useState<User | null>(null);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	// Load initial user and profile
	useEffect(() => {
		const initializeAuth = async () => {
			try {
				setLoading(true);
				setError(null);

				const currentUser = await AuthService.getCurrentUser();
				setUser(currentUser);

				if (currentUser) {
					const profileResponse = await AuthService.getUserProfile(
						currentUser.id,
					);
					if (profileResponse.success && profileResponse.profile) {
						setProfile(profileResponse.profile);
					}
				}
			} catch (err) {
				console.error("Auth initialization error:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to initialize authentication",
				);
			} finally {
				setLoading(false);
			}
		};

		initializeAuth();
	}, []);

	// Listen for auth state changes
	useEffect(() => {
		const {
			data: { subscription },
		} = AuthService.onAuthStateChange(async (newUser) => {
			setUser(newUser);

			if (newUser) {
				// Load user profile when user signs in
				const profileResponse = await AuthService.getUserProfile(newUser.id);
				if (profileResponse.success && profileResponse.profile) {
					setProfile(profileResponse.profile);
				}
			} else {
				// Clear profile when user signs out
				setProfile(null);
			}

			setLoading(false);
		});

		return () => subscription.unsubscribe();
	}, []);

	const signInWithGoogle = async (redirectTo?: string) => {
		try {
			setError(null);
			const response = await AuthService.signInWithGoogle(redirectTo);

			if (!response.success && response.error) {
				setError(response.error);
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to sign in";
			setError(errorMessage);
			console.error("Sign in error:", err);
		}
	};

	const signOut = async () => {
		try {
			setError(null);
			const response = await AuthService.signOut();

			if (response.success) {
				setUser(null);
				setProfile(null);
				router.push("/");
			} else if (response.error) {
				setError(response.error);
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to sign out";
			setError(errorMessage);
			console.error("Sign out error:", err);
		}
	};

	const refreshProfile = async () => {
		if (!user) return;

		try {
			setError(null);
			const profileResponse = await AuthService.getUserProfile(user.id);

			if (profileResponse.success && profileResponse.profile) {
				setProfile(profileResponse.profile);
			} else if (profileResponse.error) {
				setError(profileResponse.error);
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to refresh profile";
			setError(errorMessage);
			console.error("Refresh profile error:", err);
		}
	};

	return {
		user,
		profile,
		loading,
		error,
		signInWithGoogle,
		signOut,
		refreshProfile,
		isAuthenticated: !!user,
	};
}

// Hook for requiring authentication (redirects if not authenticated)
export function useRequireAuth(): UseAuthReturn {
	const auth = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!auth.loading && !auth.isAuthenticated) {
			router.push("/");
		}
	}, [auth.loading, auth.isAuthenticated, router]);

	return auth;
}
