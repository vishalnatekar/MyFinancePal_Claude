import { HouseholdService } from "@/services/household-service";
import { useHouseholdStore } from "@/stores/household-store";
import type {
	CreateHouseholdData,
	UpdateHouseholdData,
} from "@/types/household";
import { useEffect } from "react";

export function useHouseholds() {
	const {
		households,
		loading,
		error,
		setHouseholds,
		addHousehold,
		updateHousehold,
		removeHousehold,
		setLoading,
		setError,
		clearError,
	} = useHouseholdStore();

	// Load households on mount
	useEffect(() => {
		loadHouseholds();
	}, []);

	const loadHouseholds = async () => {
		try {
			setLoading(true);
			clearError();
			const response = await HouseholdService.getUserHouseholds();
			setHouseholds(response.households);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load households",
			);
		} finally {
			setLoading(false);
		}
	};

	const createHousehold = async (data: CreateHouseholdData) => {
		try {
			setLoading(true);
			clearError();
			const response = await HouseholdService.createHousehold(data);
			addHousehold(response.household);
			return response.household;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to create household";
			setError(errorMessage);
			throw new Error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const updateHouseholdData = async (id: string, data: UpdateHouseholdData) => {
		try {
			setLoading(true);
			clearError();
			const response = await HouseholdService.updateHousehold(id, data);
			updateHousehold(id, response.household);
			return response.household;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to update household";
			setError(errorMessage);
			throw new Error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const deleteHousehold = async (id: string) => {
		try {
			setLoading(true);
			clearError();
			await HouseholdService.deleteHousehold(id);
			removeHousehold(id);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to delete household";
			setError(errorMessage);
			throw new Error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const leaveHousehold = async (id: string) => {
		try {
			setLoading(true);
			clearError();
			await HouseholdService.leaveHousehold(id);
			removeHousehold(id);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to leave household";
			setError(errorMessage);
			throw new Error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return {
		households,
		loading,
		error,
		loadHouseholds,
		createHousehold,
		updateHousehold: updateHouseholdData,
		deleteHousehold,
		leaveHousehold,
		clearError,
	};
}
