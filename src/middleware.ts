import { config as appConfig } from "@/lib/config";
import { createServerClient } from "@supabase/ssr";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { type NextRequest, NextResponse } from "next/server";

// Define which paths require authentication
const protectedPaths = [
	"/profile",
	"/settings",
	"/reports",
	"/household",
	"/accounts",
];

// Define paths that should redirect authenticated users
const authOnlyPaths = ["/login", "/auth"];

// Define public paths that don't require authentication
const publicPaths = [
	"/",
	"/api/auth/callback",
	"/auth/callback",
	"/auth/error",
];

export async function middleware(request: NextRequest) {
	const response = NextResponse.next();

	// Create Supabase client for middleware
	const supabase = createServerClient(
		appConfig.supabase.url,
		appConfig.supabase.anonKey,
		{
			cookies: {
				get(name: string) {
					return request.cookies.get(name)?.value;
				},
				set(
					name: string,
					value: string,
					options: Partial<ResponseCookie> = {},
				) {
					response.cookies.set({ name, value, ...options });
				},
				remove(name: string, options: Partial<ResponseCookie> = {}) {
					response.cookies.set({ name, value: "", ...options });
				},
			},
		},
	);

	// Get the current session
	const {
		data: { session },
		error,
	} = await supabase.auth.getSession();

	const { pathname } = request.nextUrl;

	// Log authentication state for debugging (only in development)
	if (process.env.NODE_ENV === "development") {
		console.log(
			`[Auth Middleware] ${pathname} - Session: ${session ? "✓" : "✗"}`,
		);
	}

	// Handle authentication errors
	if (error) {
		console.error("Authentication error in middleware:", error);
		// Don't redirect on auth errors, let the client handle it
		return response;
	}

	// Check if the current path requires authentication
	const isProtectedPath = protectedPaths.some((path) =>
		pathname.startsWith(path),
	);
	const isAuthOnlyPath = authOnlyPaths.some((path) =>
		pathname.startsWith(path),
	);
	const isPublicPath = publicPaths.includes(pathname);

	// Redirect authenticated users away from auth-only pages
	if (session && isAuthOnlyPath) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	// Redirect unauthenticated users away from protected pages
	if (!session && isProtectedPath) {
		console.log(
			`[Auth Middleware] No session found for protected path: ${pathname}`,
		);
		const redirectUrl = new URL("/login", request.url);
		redirectUrl.searchParams.set("redirectTo", pathname);
		return NextResponse.redirect(redirectUrl);
	}

	// For the root path, just check authentication - don't redirect
	// The (dashboard) route group handles rendering at /
	if (pathname === "/" && !session) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	return response;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public (public files)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico|public).*)",
	],
};
