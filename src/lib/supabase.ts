import { config } from "@/lib/config";
import type { Database } from "@/types/database";
import { createBrowserClient as createBrowserClientSSR } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client for browser use
 * Uses @supabase/ssr for proper cookie handling
 *
 * IMPORTANT: This is for CLIENT-SIDE use only
 * For server-side (API routes), use createClient from @/lib/supabase-server
 */
export function createClient() {
	if (typeof window === "undefined") {
		throw new Error("createClient should only be called on the client side. Use createClient from @/lib/supabase-server for server-side code.");
	}

	return createBrowserClientSSR<Database>(
		config.supabase.url,
		config.supabase.anonKey
	);
}

/**
 * Legacy export for backwards compatibility
 * DEPRECATED: Use createClient() function instead
 */
export const supabase = createBrowserClientSSR<Database>(
	config.supabase.url,
	config.supabase.anonKey
);

/**
 * Server-side admin client with service role key
 * Only use this for admin operations that bypass RLS
 */
export const supabaseAdmin = createSupabaseClient<Database>(
	config.supabase.url,
	config.supabase.serviceRoleKey,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	},
);
