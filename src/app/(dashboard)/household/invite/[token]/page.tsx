"use client";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase";
import { HouseholdService } from "@/services/household-service";
import type { HouseholdInvitationDetails } from "@/types/household";
import { AlertCircle, Check, Home, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function InvitationAcceptancePage() {
	const params = useParams();
	const router = useRouter();
	const token = params.token as string;

	const [invitation, setInvitation] =
		useState<HouseholdInvitationDetails | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const supabase = useMemo(() => createClient(), []);

	const checkAuthAndLoadInvitation = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			// Check authentication
			const {
				data: { user },
			} = await supabase.auth.getUser();
			setIsAuthenticated(!!user);

			// Load invitation details
			const result = await HouseholdService.getInvitationByToken(token);
			setInvitation(result.invitation);
		} catch (err) {
			console.error("Error loading invitation:", err);
			setError(
				err instanceof Error ? err.message : "Failed to load invitation",
			);
		} finally {
			setIsLoading(false);
		}
	}, [supabase, token]);

	useEffect(() => {
		void checkAuthAndLoadInvitation();
	}, [checkAuthAndLoadInvitation]);

	const handleAccept = async () => {
		if (!isAuthenticated) {
			// Redirect to sign in with return URL
			router.push(`/auth/signin?returnUrl=/household/invite/${token}`);
			return;
		}

		try {
			setIsProcessing(true);
			setError(null);

			const result = await HouseholdService.acceptInvitation(token);

			// Redirect to the household page
			router.push(`/household/${result.household_id}`);
		} catch (err) {
			console.error("Error accepting invitation:", err);
			setError(
				err instanceof Error ? err.message : "Failed to accept invitation",
			);
			setIsProcessing(false);
		}
	};

	const handleDecline = async () => {
		if (!isAuthenticated) {
			// If not authenticated, just redirect to home
			router.push("/");
			return;
		}

		try {
			setIsProcessing(true);
			setError(null);

			await HouseholdService.declineInvitation(token);

			// Redirect to households page
			router.push("/household");
		} catch (err) {
			console.error("Error declining invitation:", err);
			setError(
				err instanceof Error ? err.message : "Failed to decline invitation",
			);
			setIsProcessing(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (error || !invitation) {
		return (
			<div className="max-w-2xl mx-auto mt-8">
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						{error || "Invitation not found or has expired"}
					</AlertDescription>
				</Alert>
				<div className="mt-4">
					<Button onClick={() => router.push("/household")}>
						Go to Households
					</Button>
				</div>
			</div>
		);
	}

	const householdName = invitation.household_name || "Unknown Household";
	const inviterName = invitation.inviter_name || "Someone";
	const expiresAt = new Date(invitation.expires_at);

	return (
		<div className="max-w-2xl mx-auto mt-8">
			<Card>
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
						<Home className="h-8 w-8 text-primary" />
					</div>
					<CardTitle className="text-2xl">You're Invited!</CardTitle>
					<CardDescription>
						Join <strong>{householdName}</strong> to manage shared expenses
						together
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{!isAuthenticated && (
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>
								You need to sign in to accept this invitation. Click "Accept
								Invitation" below to continue.
							</AlertDescription>
						</Alert>
					)}

					<div className="space-y-3 bg-muted/50 p-4 rounded-lg">
						<div className="flex justify-between">
							<span className="text-sm font-medium">Household:</span>
							<span className="text-sm">{householdName}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm font-medium">Invited by:</span>
							<span className="text-sm">{inviterName}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm font-medium">Invitation expires:</span>
							<span className="text-sm">{expiresAt.toLocaleDateString()}</span>
						</div>
						{invitation.invited_email && (
							<div className="flex justify-between">
								<span className="text-sm font-medium">Invited email:</span>
								<span className="text-sm">{invitation.invited_email}</span>
							</div>
						)}
					</div>

					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="flex flex-col sm:flex-row gap-3">
						<Button
							onClick={handleDecline}
							variant="outline"
							className="flex-1"
							disabled={isProcessing}
						>
							<X className="mr-2 h-4 w-4" />
							Decline
						</Button>
						<Button
							onClick={handleAccept}
							className="flex-1"
							disabled={isProcessing}
						>
							{isProcessing ? (
								<>
									<LoadingSpinner size="sm" className="mr-2" />
									Processing...
								</>
							) : (
								<>
									<Check className="mr-2 h-4 w-4" />
									Accept Invitation
								</>
							)}
						</Button>
					</div>

					{!isAuthenticated && (
						<p className="text-xs text-center text-muted-foreground">
							Accepting the invitation will redirect you to sign in or create an
							account
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
