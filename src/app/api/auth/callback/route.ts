import { config } from "@/lib/config";
import { AuthService } from "@/services/auth-service";
import type { Database } from "@/types/database";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	try {
		const requestUrl = new URL(request.url);
		const { searchParams } = requestUrl;

		// Check both query params and hash fragment
		const code = searchParams.get("code");
		const error = searchParams.get("error");
		const errorDescription = searchParams.get("error_description");

		// Also check for token-based flow
		const accessToken = searchParams.get("access_token");
		const refreshToken = searchParams.get("refresh_token");

		// Debug: Log all received parameters
		console.log("Auth callback received parameters:", {
			url: request.url,
			pathname: requestUrl.pathname,
			search: requestUrl.search,
			hash: requestUrl.hash,
			code: code || "missing",
			accessToken: accessToken ? "present" : "missing",
			error,
			errorDescription,
			allParams: Object.fromEntries(searchParams.entries()),
			allHeaders: Object.fromEntries(request.headers.entries()),
		});

		// Handle OAuth errors
		if (error) {
			console.error("OAuth error:", error, errorDescription);
			const errorMessage =
				error === "access_denied" ? "access_denied" : "oauth_error";
			return NextResponse.redirect(
				new URL(`/auth/error?message=${errorMessage}`, request.url),
			);
		}

		// Check for authorization code
		if (!code) {
			console.error("Missing authorization code");
			return NextResponse.redirect(
				new URL("/auth/error?message=missing_code", request.url),
			);
		}

		// Create Supabase client
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
						cookieStore.set({ name, value, ...options });
					},
					remove(name: string, options: Record<string, unknown>) {
						cookieStore.set({ name, value: "", ...options });
					},
				},
			},
		);

		// Exchange code for session
		const { data, error: exchangeError } =
			await supabase.auth.exchangeCodeForSession(code);

		if (exchangeError) {
			console.error("Error exchanging code for session:", exchangeError);
			return NextResponse.redirect(
				new URL("/auth/error?message=oauth_error", request.url),
			);
		}

		if (!data.session?.user) {
			console.error("No user in session after code exchange");
			return NextResponse.redirect(
				new URL("/auth/error?message=oauth_error", request.url),
			);
		}

		// Create or update user profile
		const profileResult = await AuthService.handleOAuthCallback(
			data.session.user,
		);

		if (!profileResult.success) {
			console.error("Error handling OAuth callback:", profileResult.error);
			// Continue to redirect even if profile creation fails
			// The user can still access the app, but profile might be incomplete
		}

		// Successful authentication - redirect to dashboard
		return NextResponse.redirect(new URL("/household", request.url));
	} catch (error) {
		console.error("Unexpected error in OAuth callback:", error);
		return NextResponse.redirect(
			new URL("/auth/error?message=server_error", request.url),
		);
	}
}
