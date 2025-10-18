import { config } from "@/lib/config";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Create server client same way as middleware
		const cookieStore = cookies();
		const supabase = createServerClient(
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

		// Get session and user
		const { data: sessionData, error: sessionError } =
			await supabase.auth.getSession();
		const { data: userData, error: userError } = await supabase.auth.getUser();

		// Get all auth-related cookies
		const authCookies = {};
		cookieStore.getAll().forEach((cookie) => {
			if (cookie.name.includes("supabase") || cookie.name.includes("auth")) {
				authCookies[cookie.name] = `${cookie.value.substring(0, 50)}...`; // Truncate for security
			}
		});

		return NextResponse.json({
			timestamp: new Date().toISOString(),
			session: {
				exists: !!sessionData.session,
				user_id: sessionData.session?.user?.id || null,
				expires_at: sessionData.session?.expires_at || null,
				error: sessionError?.message || null,
			},
			user: {
				exists: !!userData.user,
				user_id: userData.user?.id || null,
				email: userData.user?.email || null,
				error: userError?.message || null,
			},
			cookies: {
				count: Object.keys(authCookies).length,
				names: Object.keys(authCookies),
			},
			config: {
				supabase_url: config.supabase.url,
				has_anon_key: !!config.supabase.anonKey,
			},
		});
	} catch (err) {
		return NextResponse.json({
			error: err instanceof Error ? err.message : "Unknown error",
			timestamp: new Date().toISOString(),
		});
	}
}
