import { config } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/types/database";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
	try {
		const { access_token, refresh_token } = await request.json();

		if (!access_token || !refresh_token) {
			return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
		}

		// Create response to set cookies on
		const response = NextResponse.json({ success: true });

		// Create Supabase client with server-side cookie handling
		const cookieStore = cookies();
		const supabase = createServerClient<Database>(
			config.supabase.url,
			config.supabase.anonKey,
			{
				cookies: {
					get(name: string) {
						return cookieStore.get(name)?.value;
					},
					set(name: string, value: string, options: Record<string, unknown>) {
						// Set cookies on the response with proper attributes
						cookieStore.set({ name, value, ...options });
						response.cookies.set({
							name,
							value,
							...(options as any),
						});
					},
					remove(name: string, options: Record<string, unknown>) {
						cookieStore.set({ name, value: "", ...options });
						response.cookies.set({ name, value: "", ...(options as any) });
					},
				},
			},
		);

		// Set the session with the tokens
		const { data, error } = await supabase.auth.setSession({
			access_token,
			refresh_token,
		});

		if (error) {
			console.error("Error setting session on server:", error);
			return NextResponse.json(
				{ error: "Failed to set session" },
				{ status: 500 },
			);
		}

		if (!data.session?.user) {
			console.error("No session created after setting tokens");
			return NextResponse.json(
				{ error: "Failed to create session" },
				{ status: 500 },
			);
		}

		console.log(
			"✅ Server-side session created for user:",
			data.session.user.id,
		);

		// Create or update user profile using the service role client to bypass RLS
		const user = data.session.user;
		const { error: profileError } = await supabaseAdmin
			.from("profiles")
			.upsert({
				id: user.id,
				email: user.email!,
				full_name:
					user.user_metadata?.full_name || user.user_metadata?.name || null,
				avatar_url:
					user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
				updated_at: new Date().toISOString(),
			})
			.select()
			.single();

		if (profileError) {
			console.error("Error upserting user profile:", profileError);
			// Continue anyway - user can still access the app
		}

		// Return the response with cookies set
		return response;
	} catch (error) {
		console.error("Unexpected error in set-session:", error);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
