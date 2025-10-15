/**
 * Server-side Supabase client utilities
 * ONLY for use in API routes and Server Components
 * DO NOT import this in client components
 */

import { config } from "@/lib/config";
import type { Database } from "@/types/database";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Create a Supabase client for use in API routes and Server Components
 * Uses @supabase/ssr for proper cookie handling
 *
 * IMPORTANT: This is for SERVER-SIDE use only (API routes, Server Components)
 * For client-side, use createClient from @/lib/supabase
 */
export async function createClient() {
	const cookieStore = await cookies();

	return createServerClient<Database>(
		config.supabase.url,
		config.supabase.anonKey,
		{
			cookies: {
				get(name: string) {
					return cookieStore.get(name)?.value;
				},
				set(name: string, value: string, options: any) {
					cookieStore.set({ name, value, ...options });
				},
				remove(name: string, options: any) {
					cookieStore.set({ name, value: "", ...options });
				},
			},
		},
	);
}
