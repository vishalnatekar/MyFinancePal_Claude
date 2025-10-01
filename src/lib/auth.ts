import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface AuthUser extends User {
	email: string;
}

export interface Profile {
	id: string;
	email: string;
	full_name: string | null;
	avatar_url: string | null;
	created_at: string;
	updated_at: string;
}

// Get current user session
export async function getCurrentUser(): Promise<AuthUser | null> {
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return user as AuthUser | null;
}

// Get user profile
export async function getUserProfile(userId: string): Promise<Profile | null> {
	const { data, error } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", userId)
		.single();

	if (error) {
		console.error("Error fetching user profile:", error);
		return null;
	}

	return data;
}

// Create or update user profile
export async function upsertUserProfile(
	userId: string,
	profileData: Partial<Profile>,
): Promise<Profile | null> {
	const { data, error } = await (supabase as any)
		.from("profiles")
		.upsert({
			id: userId,
			...profileData,
			updated_at: new Date().toISOString(),
		})
		.select()
		.single();

	if (error) {
		console.error("Error upserting user profile:", error);
		return null;
	}

	return data;
}

// Sign in with Google
export async function signInWithGoogle() {
	const redirectTo = `${window.location.origin}/auth/callback`;
	console.log("🔐 Starting Google OAuth flow with redirect:", redirectTo);

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo,
			queryParams: {
				access_type: "offline",
				prompt: "consent",
			},
		},
	});

	if (error) {
		console.error("❌ Error signing in with Google:", error);
		throw error;
	}

	console.log("✅ OAuth initiated successfully. URL:", data.url);
	return data;
}

// Sign out
export async function signOut() {
	const { error } = await supabase.auth.signOut();
	if (error) {
		console.error("Error signing out:", error);
		throw error;
	}
}

// Authentication guard for API routes
export async function authenticateRequest(): Promise<AuthUser> {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("Unauthorized");
	}

	return user as AuthUser;
}
