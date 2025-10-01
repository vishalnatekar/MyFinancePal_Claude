"use client";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle } from "lucide-react";

export default function HomePage() {
	const { loading, error, signInWithGoogle } = useAuth();

	const handleSignIn = async () => {
		await signInWithGoogle();
	};

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-24">
			<div className="z-10 max-w-5xl w-full items-center justify-between text-center">
				<h1 className="text-4xl font-bold mb-8">Welcome to MyFinancePal</h1>
				<p className="text-lg text-muted-foreground mb-8">
					Your household financial management solution
				</p>

				{error && (
					<div className="mb-6 max-w-md mx-auto">
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					</div>
				)}

				<GoogleSignInButton
					onClick={handleSignIn}
					size="lg"
					className="px-8 py-4"
				/>

				<div className="mt-8 text-sm text-muted-foreground max-w-md mx-auto">
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
