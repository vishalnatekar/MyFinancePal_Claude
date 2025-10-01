"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function TrueLayerCallbackPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const handleCallback = async () => {
			try {
				// Log all URL parameters for debugging
				const allParams = Object.fromEntries(searchParams.entries());
				console.log("TrueLayer callback URL:", window.location.href);
				console.log("TrueLayer callback params:", allParams);

				// Check for errors first
				const error = searchParams.get("error");
				const errorDescription = searchParams.get("error_description");

				if (error) {
					console.error("TrueLayer OAuth error:", error, errorDescription);
					setError(errorDescription || "TrueLayer connection failed");
					setIsLoading(false);
					return;
				}

				// Get authorization code
				const code = searchParams.get("code");
				const state = searchParams.get("state");

				if (!code) {
					console.error("No authorization code received from TrueLayer");
					setError("No authorization code received");
					setIsLoading(false);
					return;
				}

				console.log("✅ TrueLayer authorization successful!");
				console.log("- Code:", code.substring(0, 10) + "...");
				console.log("- State:", state?.substring(0, 10) + "...");

				// Here you would normally:
				// 1. Send the code to your backend to exchange for tokens
				// 2. Store the connection details
				// 3. Redirect to accounts page

				// For now, just redirect to accounts page
				setTimeout(() => {
					router.push("/accounts");
				}, 2000);
			} catch (err) {
				console.error("Unexpected error in TrueLayer callback:", err);
				setError("An unexpected error occurred");
				setIsLoading(false);
			}
		};

		handleCallback();
	}, [searchParams, router]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-sm text-muted-foreground">
						Processing TrueLayer connection...
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
							onClick={() => router.push("/accounts")}
							className="text-sm text-primary hover:underline"
						>
							Back to accounts
						</button>
					</div>
				</div>
			</div>
		);
	}

	return null;
}
