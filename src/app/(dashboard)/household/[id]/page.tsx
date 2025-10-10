"use client";

import { HouseholdMemberList } from "@/components/household/HouseholdMemberList";
import { InviteMemberModal } from "@/components/household/InviteMemberModal";
import { PendingInvitations } from "@/components/household/PendingInvitations";
import { SharedTransactionsList } from "@/components/household/SharedTransactionsList";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { HouseholdService } from "@/services/household-service";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft, Settings, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface HouseholdDetailPageProps {
	params: {
		id: string;
	};
}

export default function HouseholdDetailPage({
	params,
}: HouseholdDetailPageProps) {
	const [household, setHousehold] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [inviteModalOpen, setInviteModalOpen] = useState(false);

	const supabase = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
	);

	useEffect(() => {
		loadHouseholdData();
	}, [params.id]);

	const loadHouseholdData = async () => {
		try {
			setLoading(true);

			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				setCurrentUserId(user.id);
			}

			const result = await HouseholdService.getHousehold(params.id);
			setHousehold(result.household);
		} catch (err) {
			console.error("Error loading household:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleInviteSent = () => {
		// Reload household data to show updated member list
		loadHouseholdData();
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (!household) {
		return (
			<div className="text-center py-12">
				<h2 className="text-2xl font-bold mb-4">Household not found</h2>
				<Link href="/household">
					<Button variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Households
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<div className="flex items-center space-x-4">
						<Link href="/household">
							<Button variant="ghost" size="sm">
								<ArrowLeft className="h-4 w-4" />
							</Button>
						</Link>
						<h1 className="text-3xl font-bold">{household.name}</h1>
					</div>
					{household.description && (
						<p className="text-muted-foreground ml-12">
							{household.description}
						</p>
					)}
				</div>
				<div className="flex space-x-3">
					<Button
						variant="outline"
						onClick={() => setInviteModalOpen(true)}
					>
						<UserPlus className="mr-2 h-4 w-4" />
						Invite Members
					</Button>
					<Link href={`/household/${params.id}/settings`}>
						<Button variant="outline">
							<Settings className="mr-2 h-4 w-4" />
							Settings
						</Button>
					</Link>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				<div className="md:col-span-2 space-y-6">
					<SharedTransactionsList householdId={params.id} />
				</div>

				<div className="space-y-6">
					<HouseholdMemberList
						members={household.household_members || []}
						currentUserId={currentUserId || undefined}
					/>

					<PendingInvitations householdId={params.id} />

					<div className="bg-card border rounded-lg p-6">
						<h3 className="text-lg font-semibold mb-4">Settlement Day</h3>
						<p className="text-2xl font-bold">
							Day {household.settlement_day}
						</p>
						<p className="text-sm text-muted-foreground mt-2">
							of each month
						</p>
					</div>
				</div>
			</div>

			<InviteMemberModal
				householdId={params.id}
				householdName={household.name}
				open={inviteModalOpen}
				onOpenChange={setInviteModalOpen}
				onInviteSent={handleInviteSent}
			/>
		</div>
	);
}
