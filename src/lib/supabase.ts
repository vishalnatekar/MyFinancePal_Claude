import { config } from "@/lib/config";
import type { Database } from "@/types/database";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";

// Singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null;

// Client-side Supabase client for browser
// Use singleton pattern to ensure only ONE instance exists
const createBrowserClient = () => {
	// Return existing instance if available
	if (supabaseInstance) {
		return supabaseInstance;
	}

	if (typeof window === "undefined") {
		// Return a minimal client for SSR (not cached)
		return createClient<Database>(
			config.supabase.url,
			config.supabase.anonKey,
			{
				auth: {
					autoRefreshToken: false,
					persistSession: false,
					detectSessionInUrl: false,
				},
			},
		);
	}

	// Create and cache the client instance
	supabaseInstance = createClient<Database>(
		config.supabase.url,
		config.supabase.anonKey,
		{
			auth: {
				autoRefreshToken: true,
				persistSession: true,
				detectSessionInUrl: true,
				flowType: "pkce",
			},
		},
	);

	return supabaseInstance;
};

export const supabase = createBrowserClient();

// Server-side client with service role key
export const supabaseAdmin = createClient<Database>(
	config.supabase.url,
	config.supabase.serviceRoleKey,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	},
);
