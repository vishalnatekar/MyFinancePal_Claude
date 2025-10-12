"use client";

import { HouseholdCard } from "@/components/household/HouseholdCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { HouseholdService } from "@/services/household-service";
import { createBrowserClient } from "@supabase/ssr";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HouseholdPage() {
	const [households, setHouseholds] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);

	const supabase = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
	);

	useEffect(() => {
		loadHouseholds();
	}, []);

	const loadHouseholds = async () => {
		try {
			setLoading(true);

			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				setCurrentUserId(user.id);
			}

			const result = await HouseholdService.getUserHouseholds();
			setHouseholds(result.households || []);
		} catch (err) {
			console.error("Error loading households:", err);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Your Households</h1>
				<Link href="/household/create">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Create Household
					</Button>
				</Link>
			</div>

			{households.length === 0 ? (
				<div className="border rounded-lg p-12 bg-card text-center">
					<h3 className="text-lg font-semibold mb-2">No households yet</h3>
					<p className="text-muted-foreground mb-6">
						Create your first household to start managing shared expenses.
					</p>
					<Link href="/household/create">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Create your first household
						</Button>
					</Link>
				</div>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{households.map((household) => {
						const userMembership = household.household_members?.find(
							(m: any) => m.user_id === currentUserId,
						);
						return (
							<HouseholdCard
								key={household.id}
								household={household}
								userRole={userMembership?.role}
							/>
						);
					})}
				</div>
			)}
		</div>
	);
}
