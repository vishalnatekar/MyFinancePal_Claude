import { config } from "@/lib/config";
import type { Database } from "@/types/database";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
	try {
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
						// Set cookies on both the cookie store and the response
						cookieStore.set({ name, value, ...options });
						response.cookies.set({
							name,
							value,
							...options,
							httpOnly: true,
							sameSite: "lax",
							secure: process.env.NODE_ENV === "production",
						});
					},
					remove(name: string, options: Record<string, unknown>) {
						cookieStore.set({ name, value: "", ...options });
						response.cookies.set({ name, value: "", ...options });
					},
				},
			},
		);

		// Get the current session to ensure cookies are set properly
		const {
			data: { session },
			error,
		} = await supabase.auth.getSession();

		console.log("Session refresh attempt:", {
			hasSession: !!session,
			userId: session?.user?.id,
			error: error?.message,
		});

		if (error) {
			console.error("Error refreshing session:", error);
			// Try to refresh the session
			const { data: refreshData, error: refreshError } =
				await supabase.auth.refreshSession();

			if (refreshError || !refreshData.session) {
				console.error("Session refresh failed:", refreshError);
				return NextResponse.json(
					{ error: "Failed to refresh session" },
					{ status: 401 },
				);
			}

			console.log(
				"Session refreshed successfully for user:",
				refreshData.session.user.id,
			);
			return NextResponse.json({
				success: true,
				user: refreshData.session.user,
			});
		}

		if (!session) {
			console.warn("No active session found during refresh");
			return NextResponse.json({ error: "No active session" }, { status: 401 });
		}

		console.log("Session validated for user:", session.user.id);

		return NextResponse.json({
			success: true,
			user: session.user,
		});
	} catch (error) {
		console.error("Unexpected error in session refresh:", error);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
