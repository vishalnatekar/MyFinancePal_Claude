"use client";

import { HouseholdActivityFeed } from "@/components/household/HouseholdActivityFeed";
import { HouseholdMemberList } from "@/components/household/HouseholdMemberList";
import { InviteMemberModal } from "@/components/household/InviteMemberModal";
import { MemberContributionSummary } from "@/components/household/MemberContributionSummary";
import { PendingInvitations } from "@/components/household/PendingInvitations";
import { SharedTransactionsList } from "@/components/household/SharedTransactionsList";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHouseholdDashboard } from "@/hooks/use-household-dashboard";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Settings, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface HouseholdDetailPageProps {
	params: {
		id: string;
	};
}

export default function HouseholdDetailPage({
	params,
}: HouseholdDetailPageProps) {
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [inviteModalOpen, setInviteModalOpen] = useState(false);

	const supabase = useMemo(() => createClient(), []);

	// Use the comprehensive household dashboard hook
	const {
		dashboard,
		isLoading: loading,
		error,
		refetchDashboard,
	} = useHouseholdDashboard(params.id);

	useEffect(() => {
		const loadUser = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				setCurrentUserId(user.id);
			}
		};

		void loadUser();
	}, [supabase]);

	const handleInviteSent = () => {
		// Refetch dashboard data to show updated member list
		refetchDashboard();
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (error || !dashboard) {
		return (
			<div className="text-center py-12">
				<h2 className="text-2xl font-bold mb-4">
					{error ? "Error loading household" : "Household not found"}
				</h2>
				<Link href="/household">
					<Button variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Households
					</Button>
				</Link>
			</div>
		);
	}

	const { household, members, recent_shared_transactions, activity_feed } =
		dashboard;

	return (
		<div className="space-y-4 md:space-y-6">
			{/* Header - responsive */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1">
					<div className="flex items-center space-x-2 md:space-x-4">
						<Link href="/household">
							<Button variant="ghost" size="sm">
								<ArrowLeft className="h-4 w-4" />
							</Button>
						</Link>
						<h1 className="text-2xl md:text-3xl font-bold">{household.name}</h1>
					</div>
					{household.description && (
						<p className="text-sm md:text-base text-muted-foreground ml-10 md:ml-12">
							{household.description}
						</p>
					)}
				</div>
				<div className="flex gap-2 md:gap-3">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setInviteModalOpen(true)}
						className="flex-1 md:flex-none"
					>
						<UserPlus className="mr-2 h-4 w-4" />
						<span className="hidden sm:inline">Invite</span>
					</Button>
					<Link
						href={`/household/${params.id}/settings`}
						className="flex-1 md:flex-none"
					>
						<Button variant="outline" size="sm" className="w-full">
							<Settings className="mr-2 h-4 w-4" />
							<span className="hidden sm:inline">Settings</span>
						</Button>
					</Link>
				</div>
			</div>

			{/* Member Contributions */}
			<MemberContributionSummary members={members} />

			{/* Main Content - mobile tabs, desktop grid */}
			<div className="block lg:hidden">
				<Tabs defaultValue="transactions" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="transactions">Transactions</TabsTrigger>
						<TabsTrigger value="activity">Activity</TabsTrigger>
						<TabsTrigger value="members">Members</TabsTrigger>
					</TabsList>
					<TabsContent value="transactions" className="mt-4">
						<SharedTransactionsList
							householdId={params.id}
							transactions={recent_shared_transactions}
							members={members.map((m) => ({
								user_id: m.user_id,
								name: m.name,
								avatar_url: m.avatar_url,
							}))}
						/>
					</TabsContent>
					<TabsContent value="activity" className="mt-4">
						<HouseholdActivityFeed activities={activity_feed} />
					</TabsContent>
					<TabsContent value="members" className="mt-4">
						<div className="space-y-4">
							<HouseholdMemberList
								members={members.map((m) => ({
									id: m.id,
									household_id: params.id,
									user_id: m.user_id,
									role: m.role,
									joined_at: m.joined_at,
									profiles: {
										id: m.user_id,
										email: m.email,
										full_name: m.name,
										avatar_url: m.avatar_url || null,
									},
								}))}
								currentUserId={currentUserId || undefined}
							/>
							<PendingInvitations householdId={params.id} />
						</div>
					</TabsContent>
				</Tabs>
			</div>

			{/* Desktop Layout */}
			<div className="hidden lg:grid gap-6 grid-cols-3">
				<div className="col-span-2 space-y-6">
					<SharedTransactionsList
						householdId={params.id}
						transactions={recent_shared_transactions}
						members={members.map((m) => ({
							user_id: m.user_id,
							name: m.name,
							avatar_url: m.avatar_url,
						}))}
					/>
					<HouseholdActivityFeed activities={activity_feed} />
				</div>

				<div className="space-y-6">
					<HouseholdMemberList
						members={members.map((m) => ({
							id: m.id,
							household_id: params.id,
							user_id: m.user_id,
							role: m.role,
							joined_at: m.joined_at,
							profiles: {
								id: m.user_id,
								email: m.email,
								full_name: m.name,
								avatar_url: m.avatar_url || null,
							},
						}))}
						currentUserId={currentUserId || undefined}
					/>

					<PendingInvitations householdId={params.id} />

					<div className="bg-card border rounded-lg p-6">
						<h3 className="text-lg font-semibold mb-4">Settlement Day</h3>
						<p className="text-2xl font-bold">Day {household.settlement_day}</p>
						<p className="text-sm text-muted-foreground mt-2">of each month</p>
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
