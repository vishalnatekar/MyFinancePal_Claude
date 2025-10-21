"use client";

import { HouseholdSettingsForm } from "@/components/household/HouseholdSettingsForm";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase";
import { HouseholdService } from "@/services/household-service";
import type { Household, HouseholdWithMembers } from "@/types/household";
import { AlertCircle, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function HouseholdSettingsPage() {
	const params = useParams();
	const router = useRouter();
	const householdId = params.id as string;

	const [household, setHousehold] = useState<HouseholdWithMembers | null>(null);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isLeaving, setIsLeaving] = useState(false);

	const supabase = useMemo(() => createClient(), []);

	const loadHousehold = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				setCurrentUserId(user.id);
			}

			const result = await HouseholdService.getHousehold(householdId);
			setHousehold(result.household as HouseholdWithMembers);
		} catch (err) {
			console.error("Error loading household:", err);
			setError(err instanceof Error ? err.message : "Failed to load household");
		} finally {
			setIsLoading(false);
		}
	}, [householdId, supabase]);

	useEffect(() => {
		void loadHousehold();
	}, [loadHousehold]);

	const handleLeaveHousehold = async () => {
		if (!currentUserId) return;

		try {
			setIsLeaving(true);
			await HouseholdService.leaveHousehold(householdId, currentUserId);
			router.push("/household");
		} catch (err) {
			console.error("Error leaving household:", err);
			setError(
				err instanceof Error ? err.message : "Failed to leave household",
			);
			setIsLeaving(false);
		}
	};

	const handleUpdate = (updatedHousehold: Household) => {
		if (household) {
			setHousehold({
				...household,
				...updatedHousehold,
			});
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (error || !household) {
		return (
			<div className="max-w-4xl mx-auto">
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error || "Household not found"}</AlertDescription>
				</Alert>
				<div className="mt-4">
					<Link href="/household">
						<Button variant="outline">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Households
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	const userMembership = household.household_members?.find(
		(m) => m.user_id === currentUserId,
	);
	const isCreator = userMembership?.role === "creator";
	const isSoleMember = household.household_members?.length === 1;

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Household Settings</h1>
					<p className="text-muted-foreground">{household.name}</p>
				</div>
				<Link href={`/household/${householdId}`}>
					<Button variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back
					</Button>
				</Link>
			</div>

			<HouseholdSettingsForm
				household={household}
				isCreator={isCreator}
				onUpdate={handleUpdate}
			/>

			<NotificationPreferences
				householdId={householdId}
				userId={currentUserId || undefined}
			/>

			<Card className="border-destructive">
				<CardHeader>
					<CardTitle className="text-destructive">Danger Zone</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-medium">Leave Household</h3>
							<p className="text-sm text-muted-foreground">
								{isSoleMember && isCreator
									? "You cannot leave as the sole member and creator. Please delete the household instead."
									: "Permanently leave this household. This action cannot be undone."}
							</p>
						</div>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									variant="destructive"
									disabled={isSoleMember && isCreator}
								>
									<LogOut className="mr-2 h-4 w-4" />
									Leave Household
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
									<AlertDialogDescription>
										This action cannot be undone. You will be removed from this
										household and will lose access to all shared expenses and
										data.
										{isCreator &&
											!isSoleMember &&
											" As the creator, you may want to transfer ownership before leaving (feature coming soon)."}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleLeaveHousehold}
										disabled={isLeaving}
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									>
										{isLeaving ? "Leaving..." : "Leave Household"}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
