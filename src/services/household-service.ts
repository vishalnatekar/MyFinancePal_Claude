import { supabase } from "@/lib/supabase";
import type {
	CreateHouseholdData,
	HouseholdDashboardData,
	HouseholdResponse,
	HouseholdSyncResponse,
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
	static async leaveHousehold(
		householdId: string,
		userId: string,
	): Promise<void> {
		const response = await fetch(
			`/api/households/${householdId}/members/${userId}`,
			{
				method: "DELETE",
			},
		);

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Failed to leave household");
		}
	}

	// Send household invitation
	static async sendInvitation(
		householdId: string,
		email: string,
	): Promise<{ invitation: any }> {
		const response = await fetch(`/api/households/${householdId}/invite`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Failed to send invitation");
		}

		return response.json();
	}

	// Resend household invitation
	static async resendInvitation(
		householdId: string,
		invitationId: string,
	): Promise<void> {
		const response = await fetch(
			`/api/households/${householdId}/invite/${invitationId}/resend`,
			{
				method: "POST",
			},
		);

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Failed to resend invitation");
		}
	}

	// Get invitation details by token
	static async getInvitationByToken(token: string): Promise<any> {
		const response = await fetch(`/api/households/invite/${token}`);

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Failed to fetch invitation");
		}

		return response.json();
	}

	// Accept household invitation
	static async acceptInvitation(
		token: string,
	): Promise<{ household_id: string }> {
		const response = await fetch(`/api/households/invite/${token}/accept`, {
			method: "POST",
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Failed to accept invitation");
		}

		return response.json();
	}

	// Decline household invitation
	static async declineInvitation(token: string): Promise<void> {
		const response = await fetch(`/api/households/invite/${token}/decline`, {
			method: "POST",
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Failed to decline invitation");
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

	// Story 3.3: Get comprehensive household dashboard data
	static async getHouseholdDashboard(
		householdId: string,
	): Promise<HouseholdDashboardData> {
		const response = await fetch(`/api/dashboard/household/${householdId}`);

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(
				errorData.error || "Failed to fetch household dashboard data",
			);
		}

		return response.json();
	}

	// Story 3.3: Trigger household-wide account sync
	static async syncHouseholdAccounts(
		householdId: string,
		forceSync = false,
	): Promise<HouseholdSyncResponse> {
		const response = await fetch(
			`/api/dashboard/household/${householdId}/sync`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ force_sync: forceSync }),
			},
		);

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Failed to sync household accounts");
		}

		return response.json();
	}
}
