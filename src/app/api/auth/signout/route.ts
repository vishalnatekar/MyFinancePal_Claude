import { config } from "@/lib/config";
import type { Database } from "@/types/database";
import { createServerClient } from "@supabase/ssr";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
	const cookieStore = cookies();
	const response = NextResponse.json({ success: true });

	try {
		const supabase = createServerClient<Database>(
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
						response.cookies.set({ name, value, ...options });
					},
					remove(name: string, options: Partial<ResponseCookie> = {}) {
						cookieStore.set({ name, value: "", ...options });
						response.cookies.set({ name, value: "", ...options });
					},
				},
			},
		);

		const { error } = await supabase.auth.signOut();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		for (const cookie of cookieStore.getAll()) {
			if (cookie.name.startsWith("sb-")) {
				response.cookies.set({
					name: cookie.name,
					value: "",
					path: "/",
					maxAge: 0,
				});
			}
		}

		return response;
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to sign out";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
