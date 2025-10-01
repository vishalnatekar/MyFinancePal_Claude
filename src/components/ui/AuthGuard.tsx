"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

interface AuthGuardProps {
	children: ReactNode;
	fallback?: ReactNode;
	redirectTo?: string;
	requireProfile?: boolean;
}

export function AuthGuard({
	children,
	fallback,
	redirectTo = "/login",
	requireProfile = true,
}: AuthGuardProps) {
	const { user, profile, loading, error, isAuthenticated } = useAuthStore();
	const router = useRouter();

	useEffect(() => {
		// Don't redirect while still loading
		if (loading) return;

		// Redirect if not authenticated
		if (!isAuthenticated) {
			router.push(redirectTo);
			return;
		}

		// Redirect if profile is required but missing
		if (requireProfile && !profile) {
			console.warn("Profile required but not found");
			// Could redirect to profile completion page
		}
	}, [loading, isAuthenticated, profile, requireProfile, router, redirectTo]);

	// Show loading state
	if (loading) {
		return (
			fallback || (
				<div className="flex min-h-screen items-center justify-center">
					<div className="flex flex-col items-center space-y-4">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<p className="text-muted-foreground">Checking authentication...</p>
					</div>
				</div>
			)
		);
	}

	// Show error state
	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<div className="max-w-md w-full">
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription className="flex flex-col space-y-2">
							<span>{error}</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => window.location.reload()}
							>
								Try Again
							</Button>
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	// Don't render if not authenticated (will redirect)
	if (!isAuthenticated) {
		return null;
	}

	// Don't render if profile is required but missing
	if (requireProfile && !profile) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<div className="max-w-md w-full">
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>Loading user profile...</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	// Render protected content
	return <>{children}</>;
}
