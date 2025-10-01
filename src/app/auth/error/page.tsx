"use client";

import { AuthError } from "@/components/auth/AuthErrorBoundary";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const ERROR_MESSAGES = {
	missing_code: "Authorization code is missing. Please try signing in again.",
	oauth_error:
		"There was an error with Google authentication. Please try again.",
	server_error: "A server error occurred. Please try again later.",
	access_denied: "Access was denied. Please grant permission to continue.",
	invalid_request: "Invalid authentication request. Please try again.",
	unauthorized_client: "Authentication service is not properly configured.",
	unsupported_response_type: "Authentication response type is not supported.",
	invalid_scope: "Invalid authentication scope requested.",
	server_error_500: "Internal server error. Please try again later.",
	temporarily_unavailable: "Authentication service is temporarily unavailable.",
} as const;

type ErrorCode = keyof typeof ERROR_MESSAGES;

function AuthErrorContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [errorMessage, setErrorMessage] = useState<string>("");

	useEffect(() => {
		const errorCode = searchParams.get("message") || searchParams.get("error");
		const errorDescription = searchParams.get("error_description");

		if (errorDescription) {
			setErrorMessage(errorDescription);
		} else if (errorCode && errorCode in ERROR_MESSAGES) {
			setErrorMessage(ERROR_MESSAGES[errorCode as ErrorCode]);
		} else {
			setErrorMessage(
				"An unexpected authentication error occurred. Please try again.",
			);
		}
	}, [searchParams]);

	const handleRetry = () => {
		router.push("/login");
	};

	const handleGoHome = () => {
		router.push("/");
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="w-full max-w-md space-y-8 p-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight">MyFinancePal</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Authentication Error
					</p>
				</div>

				<div className="space-y-6">
					<AuthError error={errorMessage} onRetry={handleRetry} />

					<div className="flex flex-col space-y-3">
						<button
							type="button"
							onClick={handleRetry}
							className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 font-medium transition-colors"
						>
							Try Signing In Again
						</button>

						<button
							type="button"
							onClick={handleGoHome}
							className="w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md font-medium transition-colors"
						>
							Go to Homepage
						</button>
					</div>

					<div className="text-center text-sm text-muted-foreground">
						<p>
							If you continue to experience issues, please{" "}
							<a
								href="mailto:support@myfinancepal.com"
								className="font-medium text-primary hover:underline"
							>
								contact support
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function AuthErrorPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-background">
					<div className="text-center">
						<h1 className="text-3xl font-bold tracking-tight mb-4">
							MyFinancePal
						</h1>
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
					</div>
				</div>
			}
		>
			<AuthErrorContent />
		</Suspense>
	);
}
