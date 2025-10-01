import { config } from "@/lib/config";
import type { Database } from "@/types/database";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export interface AuthenticatedRequest extends NextRequest {
	user: User;
}

// Authentication result type
export interface AuthResult {
	success: boolean;
	user?: User;
	error?: string;
	status?: number;
}

// Enhanced authentication function for API routes
export async function authenticateRequest(
	request: NextRequest,
): Promise<AuthResult> {
	try {
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

		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();

		if (error) {
			console.error("Authentication error:", error);
			return {
				success: false,
				error: "Authentication failed",
				status: 401,
			};
		}

		if (!user) {
			return {
				success: false,
				error: "User not authenticated",
				status: 401,
			};
		}

		// Verify user still exists and is active
		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("id")
			.eq("id", user.id)
			.single();

		if (profileError || !profile) {
			console.error("User profile not found:", profileError);
			return {
				success: false,
				error: "User profile not found",
				status: 401,
			};
		}

		return {
			success: true,
			user,
		};
	} catch (error) {
		console.error("Unexpected authentication error:", error);
		return {
			success: false,
			error: "Internal server error",
			status: 500,
		};
	}
}

// Middleware wrapper for API routes
export function withAuth(
	handler: (
		request: NextRequest,
		user: User,
	) => Promise<NextResponse> | NextResponse,
) {
	return async (request: NextRequest): Promise<NextResponse> => {
		const authResult = await authenticateRequest(request);

		if (!authResult.success || !authResult.user) {
			return NextResponse.json(
				{ error: authResult.error || "Authentication required" },
				{ status: authResult.status || 401 },
			);
		}

		return handler(request, authResult.user);
	};
}

// Check if user has permission for a specific household
export async function verifyHouseholdAccess(
	userId: string,
	householdId: string,
): Promise<boolean> {
	try {
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

		const { data, error } = await supabase
			.from("household_members")
			.select("id")
			.eq("household_id", householdId)
			.eq("user_id", userId)
			.single();

		if (error || !data) {
			console.error("Household access verification failed:", error);
			return false;
		}

		return true;
	} catch (error) {
		console.error("Unexpected error verifying household access:", error);
		return false;
	}
}

// Middleware wrapper for household-specific API routes
export function withHouseholdAuth(
	handler: (
		request: NextRequest,
		user: User,
		householdId: string,
	) => Promise<NextResponse> | NextResponse,
) {
	return async (
		request: NextRequest,
		{ params }: { params: { id: string } },
	): Promise<NextResponse> => {
		const authResult = await authenticateRequest(request);

		if (!authResult.success || !authResult.user) {
			return NextResponse.json(
				{ error: authResult.error || "Authentication required" },
				{ status: authResult.status || 401 },
			);
		}

		const householdId = params.id;

		// Verify user has access to this household
		const hasAccess = await verifyHouseholdAccess(
			authResult.user.id,
			householdId,
		);

		if (!hasAccess) {
			return NextResponse.json(
				{ error: "Access denied to this household" },
				{ status: 403 },
			);
		}

		return handler(request, authResult.user, householdId);
	};
}

// Create standardized error responses
export function createAuthErrorResponse(
	message: string,
	status = 401,
): NextResponse {
	return NextResponse.json(
		{
			error: message,
			timestamp: new Date().toISOString(),
		},
		{ status },
	);
}

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
	identifier: string,
	limit = 10,
	windowMs: number = 15 * 60 * 1000, // 15 minutes
): boolean {
	const now = Date.now();
	const userLimit = rateLimitMap.get(identifier);

	if (!userLimit || now > userLimit.resetTime) {
		// Reset or create new limit window
		rateLimitMap.set(identifier, {
			count: 1,
			resetTime: now + windowMs,
		});
		return true;
	}

	if (userLimit.count >= limit) {
		return false;
	}

	userLimit.count++;
	return true;
}
