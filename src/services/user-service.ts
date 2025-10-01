import type { UserPreferences } from "@/hooks/use-user-preferences";

export interface ServiceResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export interface UserPreferencesResponse {
	success: boolean;
	preferences?: UserPreferences;
	error?: string;
}

export class UserService {
	private static async request<T>(
		endpoint: string,
		options: RequestInit = {},
	): Promise<ServiceResponse<T>> {
		try {
			const response = await fetch(endpoint, {
				headers: {
					"Content-Type": "application/json",
					...options.headers,
				},
				...options,
			});

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ error: "Network error" }));
				return {
					success: false,
					error:
						errorData.error ||
						`HTTP ${response.status}: ${response.statusText}`,
				};
			}

			const data = await response.json();
			return {
				success: true,
				data,
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : "Request failed";
			return {
				success: false,
				error: message,
			};
		}
	}

	/**
	 * Get user preferences
	 */
	static async getUserPreferences(): Promise<UserPreferencesResponse> {
		const response = await this.request<UserPreferences>(
			"/api/user/preferences",
			{
				method: "GET",
			},
		);

		return {
			success: response.success,
			preferences: response.data,
			error: response.error,
		};
	}

	/**
	 * Update user preferences
	 */
	static async updateUserPreferences(
		preferences: Partial<UserPreferences>,
	): Promise<UserPreferencesResponse> {
		const response = await this.request<UserPreferences>(
			"/api/user/preferences",
			{
				method: "PUT",
				body: JSON.stringify(preferences),
			},
		);

		return {
			success: response.success,
			preferences: response.data,
			error: response.error,
		};
	}
}
