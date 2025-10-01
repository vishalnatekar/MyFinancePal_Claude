"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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
					console.log("Code:", code.substring(0, 10) + "...");

					// Exchange code for session
					const { data, error: sessionError } =
						await supabase.auth.exchangeCodeForSession(code);

					console.log("Exchange result:", {
						hasSession: !!data.session,
						hasUser: !!data.session?.user,
						error: sessionError,
					});

					if (sessionError) {
						console.error("❌ Error exchanging code for session:", sessionError);
						setError("Failed to complete authentication");
						setIsLoading(false);
						return;
					}

					if (!data.session?.user) {
						console.error("❌ No session created after code exchange");
						setError("Failed to create session");
						setIsLoading(false);
						return;
					}

					console.log(
						"✅ PKCE flow authentication successful for user:",
						data.session.user.id,
					);
					console.log("Session expires at:", data.session.expires_at);

					// Force a server-side session refresh by calling the API route
					// This ensures the middleware can read the session
					try {
						const response = await fetch("/api/auth/refresh", {
							method: "POST",
							credentials: "include",
						});

						if (!response.ok) {
							console.warn("Session refresh failed, but continuing anyway");
						}
					} catch (err) {
						console.warn("Error refreshing session:", err);
					}

					// Redirect to dashboard
					router.push("/dashboard");
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

						// Set the session using the tokens
						const { data, error: sessionError } =
							await supabase.auth.setSession({
								access_token: accessToken,
								refresh_token: refreshToken,
							});

						if (sessionError) {
							console.error(
								"Error setting session from implicit flow:",
								sessionError,
							);
							setError("Failed to complete authentication");
							setIsLoading(false);
							return;
						}

						if (data.session?.user) {
							console.log(
								"Implicit flow authentication successful for user:",
								data.session.user.id,
							);

							// Send tokens to server to set proper cookies
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
									const errorData = await response.json();
									console.error("Session setup failed:", errorData);
									setError("Failed to complete authentication");
									setIsLoading(false);
									return;
								}
							} catch (err) {
								console.error("Error setting up session:", err);
								setError("Failed to complete authentication");
								setIsLoading(false);
								return;
							}

							// Redirect to dashboard
							router.push("/dashboard");
							return;
						}
					}

					// Fallback: try getting existing session
					const { data, error: sessionError } =
						await supabase.auth.getSession();
					if (!sessionError && data.session?.user) {
						console.log(
							"Found existing session for user:",
							data.session.user.id,
						);
						router.push("/dashboard");
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
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
