import { supabase } from "@/lib/supabase";
import { HouseholdService } from "@/services/household-service";
import type {
	HouseholdDashboardData,
	HouseholdSyncResponse,
} from "@/types/household";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Hook for fetching and managing household dashboard data
 * Includes real-time updates for shared transactions and account changes
 */
export function useHouseholdDashboard(householdId: string | null) {
	const queryClient = useQueryClient();

	// Fetch household dashboard data
	const {
		data,
		isLoading,
		error,
		refetch: refetchDashboard,
	} = useQuery<HouseholdDashboardData>({
		queryKey: ["household-dashboard", householdId],
		queryFn: () =>
			HouseholdService.getHouseholdDashboard(householdId as string),
		enabled: !!householdId,
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: true,
	});

	// Sync household accounts mutation
	const syncMutation = useMutation<
		HouseholdSyncResponse,
		Error,
		{ forceSync: boolean }
	>({
		mutationFn: ({ forceSync }) =>
			HouseholdService.syncHouseholdAccounts(householdId as string, forceSync),
		onSuccess: () => {
			// Refetch dashboard data after sync
			setTimeout(() => {
				queryClient.invalidateQueries({
					queryKey: ["household-dashboard", householdId],
				});
			}, 2000); // Wait 2 seconds for sync to complete
		},
	});

	// Subscribe to real-time updates
	useEffect(() => {
		if (!householdId) return;

		// Create a channel for household updates
		const channel = supabase
			.channel(`household-${householdId}`)
			// Listen for new shared transactions
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "transactions",
					filter: `shared_with_household_id=eq.${householdId}`,
				},
				() => {
					// Refetch dashboard data when transactions change
					queryClient.invalidateQueries({
						queryKey: ["household-dashboard", householdId],
					});
				},
			)
			// Listen for new household members
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "household_members",
					filter: `household_id=eq.${householdId}`,
				},
				() => {
					// Refetch dashboard data when members join
					queryClient.invalidateQueries({
						queryKey: ["household-dashboard", householdId],
					});
				},
			)
			.subscribe();

		// Cleanup subscription on unmount
		return () => {
			channel.unsubscribe();
		};
	}, [householdId, queryClient]);

	return {
		dashboard: data,
		isLoading,
		error,
		refetchDashboard,
		syncAccounts: (forceSync = false) => syncMutation.mutate({ forceSync }),
		isSyncing: syncMutation.isPending,
		syncError: syncMutation.error,
	};
}
