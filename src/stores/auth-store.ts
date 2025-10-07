import type { Profile } from "@/lib/auth";
import { AuthService } from "@/services/auth-service";
import type { User } from "@supabase/supabase-js";
import { create } from "zustand";

interface AuthState {
	user: User | null;
	profile: Profile | null;
	loading: boolean;
	error: string | null;
	isAuthenticated: boolean;
}

interface AuthActions {
	// Actions
	setUser: (user: User | null) => void;
	setProfile: (profile: Profile | null) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	clearError: () => void;

	// Async actions
	signInWithGoogle: (redirectTo?: string) => Promise<void>;
	signOut: () => Promise<void>;
	loadUserProfile: (userId?: string) => Promise<void>;
	refreshSession: () => Promise<void>;
	initializeAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
	// Initial state
	user: null,
	profile: null,
	loading: true,
	error: null,
	isAuthenticated: false,

	// Synchronous actions
	setUser: (user) =>
		set(() => ({
			user,
			isAuthenticated: !!user,
		})),

	setProfile: (profile) => set(() => ({ profile })),

	setLoading: (loading) => set(() => ({ loading })),

	setError: (error) => set(() => ({ error })),

	clearError: () => set(() => ({ error: null })),

	// Async actions
	signInWithGoogle: async (redirectTo) => {
		const { setError, clearError } = get();

		try {
			clearError();
			const response = await AuthService.signInWithGoogle(redirectTo);

			if (!response.success && response.error) {
				setError(response.error);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to sign in";
			setError(errorMessage);
			console.error("Sign in error:", error);
		}
	},

	signOut: async () => {
		const { setUser, setProfile, setError, clearError } = get();

		try {
			clearError();
			const response = await AuthService.signOut();

			if (response.success) {
				setUser(null);
				setProfile(null);
			} else if (response.error) {
				setError(response.error);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to sign out";
			setError(errorMessage);
			console.error("Sign out error:", error);
		}
	},

	loadUserProfile: async (userId) => {
		const { setProfile, setError, clearError } = get();

		try {
			clearError();
			const response = await AuthService.getUserProfile(userId);

			if (response.success && response.profile) {
				setProfile(response.profile);
			} else if (response.error) {
				setError(response.error);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to load user profile";
			setError(errorMessage);
			console.error("Load profile error:", error);
		}
	},

	refreshSession: async () => {
		const { setUser, setError, clearError } = get();

		try {
			clearError();
			const response = await AuthService.refreshSession();

			if (response.success && response.user) {
				setUser(response.user);
			} else if (response.error) {
				setError(response.error);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to refresh session";
			setError(errorMessage);
			console.error("Refresh session error:", error);
		}
	},

	initializeAuth: async () => {
		const { setUser, setProfile, setLoading, setError, clearError } = get();

		try {
			setLoading(true);
			clearError();

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
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to initialize authentication";
			setError(errorMessage);
			console.error("Auth initialization error:", error);
		} finally {
			setLoading(false);
		}
	},
}));

// Initialize auth and subscribe to auth state changes only on client side
if (typeof window !== "undefined") {
	// Delay initialization to avoid SSR issues
	Promise.resolve().then(() => {
		// Initialize auth on store creation
		useAuthStore.getState().initializeAuth();

		// Subscribe to auth state changes
		AuthService.onAuthStateChange(async (user) => {
			const store = useAuthStore.getState();
			store.setUser(user);

			if (user) {
				// Load user profile when user signs in
				await store.loadUserProfile(user.id);
			} else {
				// Clear profile when user signs out
				store.setProfile(null);
			}
		});
	});
}
