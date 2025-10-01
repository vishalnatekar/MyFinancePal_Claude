import type { HouseholdWithMembers } from "@/types/household";
import { create } from "zustand";

interface HouseholdState {
	// State
	households: HouseholdWithMembers[];
	currentHousehold: HouseholdWithMembers | null;
	loading: boolean;
	error: string | null;

	// Actions
	setHouseholds: (households: HouseholdWithMembers[]) => void;
	setCurrentHousehold: (household: HouseholdWithMembers | null) => void;
	addHousehold: (household: HouseholdWithMembers) => void;
	updateHousehold: (id: string, updates: Partial<HouseholdWithMembers>) => void;
	removeHousehold: (id: string) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	clearError: () => void;
}

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
	// Initial state
	households: [],
	currentHousehold: null,
	loading: false,
	error: null,

	// Actions
	setHouseholds: (households) =>
		set({
			households,
			error: null,
		}),

	setCurrentHousehold: (household) =>
		set({
			currentHousehold: household,
			error: null,
		}),

	addHousehold: (household) =>
		set((state) => ({
			households: [...state.households, household],
			error: null,
		})),

	updateHousehold: (id, updates) =>
		set((state) => ({
			households: state.households.map((h) =>
				h.id === id ? { ...h, ...updates } : h,
			),
			currentHousehold:
				state.currentHousehold?.id === id
					? { ...state.currentHousehold, ...updates }
					: state.currentHousehold,
			error: null,
		})),

	removeHousehold: (id) =>
		set((state) => ({
			households: state.households.filter((h) => h.id !== id),
			currentHousehold:
				state.currentHousehold?.id === id ? null : state.currentHousehold,
			error: null,
		})),

	setLoading: (loading) => set({ loading }),

	setError: (error) => set({ error }),

	clearError: () => set({ error: null }),
}));
