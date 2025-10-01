import { supabase } from "@/lib/supabase";
import type {
	CreateHouseholdData,
	HouseholdResponse,
	HouseholdsResponse,
	UpdateHouseholdData,
} from "@/types/household";

export class HouseholdService {
	// Get all households for the current user
	static async getUserHouseholds(): Promise<HouseholdsResponse> {
		const response = await fetch("/api/households");

		if (!response.ok) {
			throw new Error("Failed to fetch households");
		}

		return response.json();
	}

	// Get a specific household by ID
	static async getHousehold(id: string): Promise<HouseholdResponse> {
		const response = await fetch(`/api/households/${id}`);

		if (!response.ok) {
			throw new Error("Failed to fetch household");
		}

		return response.json();
	}

	// Create a new household
	static async createHousehold(
		data: CreateHouseholdData,
	): Promise<HouseholdResponse> {
		const response = await fetch("/api/households", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Failed to create household");
		}

		return response.json();
	}

	// Update household settings
	static async updateHousehold(
		id: string,
		data: UpdateHouseholdData,
	): Promise<HouseholdResponse> {
		const response = await fetch(`/api/households/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Failed to update household");
		}

		return response.json();
	}

	// Delete a household
	static async deleteHousehold(id: string): Promise<void> {
		const response = await fetch(`/api/households/${id}`, {
			method: "DELETE",
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Failed to delete household");
		}
	}

	// Leave a household
	static async leaveHousehold(householdId: string): Promise<void> {
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("User not authenticated");
		}

		const { error } = await supabase
			.from("household_members")
			.delete()
			.eq("household_id", householdId)
			.eq("user_id", user.id);

		if (error) {
			throw new Error("Failed to leave household");
		}
	}

	// Get household statistics
	static async getHouseholdStats(householdId: string) {
		// This would fetch expense statistics, balances, etc.
		// Implementation will be added when expense features are developed
		return {
			totalExpenses: 0,
			memberCount: 0,
			currentBalance: 0,
		};
	}
}
