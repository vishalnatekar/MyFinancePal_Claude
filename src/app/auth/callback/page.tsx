"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const REDIRECT_STORAGE_KEY = "auth:redirectTo";

function consumeStoredRedirect(): string {
	try {
		const stored = window.localStorage.getItem(REDIRECT_STORAGE_KEY);
		if (stored) {
			window.localStorage.removeItem(REDIRECT_STORAGE_KEY);
			return stored;
		}
	} catch (error) {
		console.warn("Failed to read stored redirect target:", error);
	}
	return "/";
}

export default function AuthCallbackPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const handleAuthCallback = async () => {
			try {
				// Log all URL parameters for debugging
				const allParams = Object.fromEntries(searchParams.entries());
				console.log("Auth callback URL:", window.location.href);
				console.log("Auth callback params:", allParams);

				// Check for errors first
				const error = searchParams.get("error");
				const errorDescription = searchParams.get("error_description");

				if (error) {
					console.error("OAuth error:", error, errorDescription);
					setError(errorDescription || "Authentication failed");
					setIsLoading(false);
					return;
				}

				// Priority 1: Handle PKCE flow with authorization code (preferred)
				const code = searchParams.get("code");
				if (code) {
					console.log("✅ Found authorization code, handling PKCE flow");
					console.log("Code:", `${code.substring(0, 10)}...`);

					// Exchange code for session
					const { data, error: exchangeError } =
						await supabase.auth.exchangeCodeForSession(code);

					console.log("Exchange result:", {
						hasSession: !!data.session,
						hasUser: !!data.session?.user,
						error: exchangeError,
					});

					let session: Session | null = data.session;

					if (exchangeError || !session?.user) {
						console.warn(
							"⚠️ Issue exchanging code for session, checking existing session",
							exchangeError,
						);

						const { data: existing, error: existingError } =
							await supabase.auth.getSession();

						if (existingError) {
							console.error(
								"❌ Failed to get existing session:",
								existingError,
							);
							setError("Failed to complete authentication");
							setIsLoading(false);
							return;
						}

						session = existing.session ?? null;

						if (!session?.user) {
							console.error("❌ No session available after code exchange");
							setError("Failed to create session");
							setIsLoading(false);
							return;
						}
					}

					console.log(
						"✅ PKCE flow authentication successful for user:",
						session.user.id,
					);
					console.log("Session expires at:", session.expires_at);

					// CRITICAL: Set server-side cookies by sending tokens to the API
					if (session.access_token && session.refresh_token) {
						try {
							const response = await fetch("/api/auth/set-session", {
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								credentials: "include",
								body: JSON.stringify({
									access_token: session.access_token,
									refresh_token: session.refresh_token,
								}),
							});

							console.log("Server-side session setup:", {
								ok: response.ok,
								status: response.status,
							});

							if (!response.ok) {
								console.warn(
									"Server session setup failed, but client session is set",
								);
							}
						} catch (err) {
							console.warn("Error setting up server session:", err);
						}
					}

					const redirectTarget = consumeStoredRedirect();
					console.log("✅ Sessions created, redirecting to:", redirectTarget);
					window.location.href = redirectTarget;
					return;
				}

				// Priority 2: Handle implicit flow (fallback)
				const hash = window.location.hash;
				if (hash) {
					console.log("Found URL fragment, handling implicit flow");

					// Parse the hash fragment to get tokens
					const hashParams = new URLSearchParams(hash.substring(1));
					const accessToken = hashParams.get("access_token");
					const refreshToken = hashParams.get("refresh_token");

					if (accessToken && refreshToken) {
						console.log("Setting session from implicit flow tokens");

						// FIRST: Set the session on the client-side Supabase instance
						const { data, error: sessionError } =
							await supabase.auth.setSession({
								access_token: accessToken,
								refresh_token: refreshToken,
							});

						if (sessionError) {
							console.error(
								"Error setting client session from implicit flow:",
								sessionError,
							);
							setError("Failed to complete authentication");
							setIsLoading(false);
							return;
						}

						if (!data.session?.user) {
							console.error("No session created after setting tokens");
							setError("Failed to create session");
							setIsLoading(false);
							return;
						}

						console.log(
							"Implicit flow authentication successful for user:",
							data.session.user.id,
						);

						// SECOND: Also set server-side cookies for SSR/middleware
						try {
							const response = await fetch("/api/auth/set-session", {
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									access_token: accessToken,
									refresh_token: refreshToken,
								}),
								credentials: "include",
							});

							console.log("Server-side session setup:", {
								ok: response.ok,
								status: response.status,
							});

							if (!response.ok) {
								console.warn(
									"Server session setup failed, but client session is set",
								);
							}
						} catch (err) {
							console.warn("Error setting up server session:", err);
						}

						const redirectTarget = consumeStoredRedirect();
						console.log("✅ Sessions created, redirecting to:", redirectTarget);
						window.location.href = redirectTarget;
						return;
					}

					// Fallback: try getting existing session
					const { data, error: sessionError } =
						await supabase.auth.getSession();
					if (!sessionError && data.session?.user) {
						console.log(
							"Found existing session for user:",
							data.session.user.id,
						);
						router.push("/");
						return;
					}
				}

				// If we get here, no valid session was found
				console.error("No valid authentication method found");
				setError("Authentication failed - please try again");
				setIsLoading(false);
			} catch (err) {
				console.error("Unexpected error in auth callback:", err);
				setError("An unexpected error occurred");
				setIsLoading(false);
			}
		};

		handleAuthCallback();
	}, [searchParams, router]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
					<p className="text-sm text-muted-foreground">
						Completing authentication...
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="max-w-md w-full mx-auto">
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
					<div className="mt-4 text-center">
						<button
							onClick={() => router.push("/login")}
							className="text-sm text-primary hover:underline"
						>
							Try signing in again
						</button>
					</div>
				</div>
			</div>
		);
	}

	return null;
}
