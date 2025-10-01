import { config } from "@/lib/config";
import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient<Database>(
	config.supabase.url,
	config.supabase.anonKey,
	{
		auth: {
			autoRefreshToken: true,
			persistSession: true,
			detectSessionInUrl: true,
		},
	},
);

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
