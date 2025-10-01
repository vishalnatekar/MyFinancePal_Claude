"use client";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/stores/auth-store";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function LoginPageContent() {
	const { user, loading, error, signInWithGoogle } = useAuthStore();
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get("redirectTo") || "/dashboard";

	useEffect(() => {
		if (user && !loading) {
			router.push(redirectTo);
		}
	}, [user, loading, router, redirectTo]);

	const handleSignIn = async () => {
		console.log("Sign in button clicked");
		try {
			await signInWithGoogle();
			console.log("Sign in function completed");
		} catch (error) {
			console.error("Sign in error:", error);
		}
	};

	if (loading) {
		return (
			<div className="text-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
				<p className="text-sm text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (user) {
		return (
			<div className="text-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
				<p className="text-sm text-muted-foreground">
					Redirecting to dashboard...
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h2 className="text-2xl font-semibold tracking-tight">
					Sign in to your account
				</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					Use your Google account to access MyFinancePal
				</p>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<div className="space-y-4">
				<GoogleSignInButton
					onClick={handleSignIn}
					size="lg"
					className="w-full"
				/>

				<div className="text-center text-sm text-muted-foreground">
					<p>
						By signing in, you agree to our{" "}
						<a href="#" className="font-medium text-primary hover:underline">
							Terms of Service
						</a>{" "}
						and{" "}
						<a href="#" className="font-medium text-primary hover:underline">
							Privacy Policy
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-sm text-muted-foreground">Loading...</p>
				</div>
			}
		>
			<LoginPageContent />
		</Suspense>
	);
}
