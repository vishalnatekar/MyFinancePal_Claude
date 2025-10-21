/**
 * Authentication Helper Functions
 * Provides utilities for request authentication and authorization
 */

import { config } from "@/lib/config";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import type { NextRequest } from "next/server";

export interface AuthResult {
	authenticated: boolean;
	success: boolean;
	userId?: string;
	user?: User;
	error?: string;
}

/**
 * Authenticate a request using Supabase session
 * Extracts and validates the JWT token from request headers or cookies
 */
export async function authenticateRequest(
	request: NextRequest,
): Promise<AuthResult> {
	try {
		// Create Supabase client for server-side authentication
		const supabase = createServerClient(
			config.supabase.url,
			config.supabase.anonKey,
			{
				cookies: {
					get(name: string) {
						const cookie = request.cookies.get(name);
						return cookie?.value;
					},
					set(
						name: string,
						value: string,
						options: Partial<ResponseCookie> = {},
					) {
						// We don't modify cookies in this read-only context
					},
					remove(name: string, options: Partial<ResponseCookie> = {}) {
						// We don't modify cookies in this read-only context
					},
				},
			},
		);

		// Get the current user session
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();

		// Log authentication attempt for debugging (only on failure)
		if (error || !user) {
			console.log("Auth attempt failed:", {
				hasUser: !!user,
				userId: user?.id,
				error: error?.message,
				cookieCount: request.cookies.getAll().length,
			});
		}

		if (error || !user) {
			console.error("Authentication failed:", error);
			return {
				authenticated: false,
				success: false,
				error: "Invalid or missing authentication token",
			};
		}

		return {
			authenticated: true,
			success: true,
			userId: user.id,
			user,
		};
	} catch (error) {
		console.error("Authentication error:", error);
		return {
			authenticated: false,
			success: false,
			error: "Authentication system error",
		};
	}
}

/**
 * Middleware function to check if user has required permissions
 * Can be extended for role-based access control
 */
export async function authorizeUser(
	request: NextRequest,
	requiredPermissions: string[] = [],
): Promise<AuthResult> {
	const authResult = await authenticateRequest(request);

	if (!authResult.success) {
		return authResult;
	}

	// For now, all authenticated users have all permissions
	// This can be extended to check user roles and permissions
	if (requiredPermissions.length > 0) {
		// TODO: Implement permission checking against user profile/roles
		console.log("Permission check required:", requiredPermissions);
	}

	return authResult;
}

/**
 * Extract bearer token from Authorization header
 * Used for API key authentication if needed
 */
export function extractBearerToken(request: NextRequest): string | null {
	const authHeader = request.headers.get("Authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return null;
	}

	return authHeader.substring(7); // Remove "Bearer " prefix
}

/**
 * Rate limiting helper - tracks requests by user ID
 * Returns true if request should be allowed, false if rate limited
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
	userId: string,
	maxRequests = 60, // requests per window
	windowMinutes = 1, // time window in minutes
): { allowed: boolean; remaining: number; resetTime: number } {
	const now = Date.now();
	const windowMs = windowMinutes * 60 * 1000;

	const userLimits = requestCounts.get(userId);

	// If no previous requests or window expired, reset counter
	if (!userLimits || now > userLimits.resetTime) {
		const resetTime = now + windowMs;
		requestCounts.set(userId, { count: 1, resetTime });
		return {
			allowed: true,
			remaining: maxRequests - 1,
			resetTime,
		};
	}

	// Check if within limits
	if (userLimits.count < maxRequests) {
		userLimits.count++;
		return {
			allowed: true,
			remaining: maxRequests - userLimits.count,
			resetTime: userLimits.resetTime,
		};
	}

	// Rate limited
	return {
		allowed: false,
		remaining: 0,
		resetTime: userLimits.resetTime,
	};
}
