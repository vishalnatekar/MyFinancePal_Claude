import { config } from "@/lib/config";
import { createServerClient } from "@supabase/ssr";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const cookieStore = cookies();
		const supabase = createServerClient(
			config.supabase.url,
			config.supabase.anonKey,
			{
				cookies: {
					get(name: string) {
						return cookieStore.get(name)?.value;
					},
					set(
						name: string,
						value: string,
						options: Partial<ResponseCookie> = {},
					) {
						cookieStore.set({ name, value, ...options });
					},
					remove(name: string, options: Partial<ResponseCookie> = {}) {
						cookieStore.set({ name, value: "", ...options });
					},
				},
			},
		);

		// Sign out to clear server-side session
		await supabase.auth.signOut();

		// Clear all auth-related cookies
		const allCookies = cookieStore.getAll();
		for (const cookie of allCookies) {
			if (cookie.name.includes("supabase") || cookie.name.includes("auth")) {
				cookieStore.delete(cookie.name);
			}
		}

		return NextResponse.json({
			success: true,
			message: "Auth state cleared",
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		return NextResponse.json({
			success: false,
			error: err instanceof Error ? err.message : "Unknown error",
			timestamp: new Date().toISOString(),
		});
	}
}
