"use client";

import { UserService } from "@/services/user-service";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect, useState } from "react";

export interface UserPreferences {
	email_notifications: boolean;
	shared_expense_alerts: boolean;
	settlement_reminders: boolean;
	timezone: string;
}

export function useUserPreferences() {
	const { user, isAuthenticated } = useAuthStore();
	const [preferences, setPreferences] = useState<UserPreferences | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isUpdating, setIsUpdating] = useState(false);

	useEffect(() => {
		if (isAuthenticated && user) {
			loadPreferences();
		}
	}, [isAuthenticated, user]);

	const loadPreferences = async () => {
		if (!user) return;

		try {
			setLoading(true);
			setError(null);
			const response = await UserService.getUserPreferences();

			if (response.success && response.preferences) {
				setPreferences(response.preferences);
			} else if (response.error) {
				setError(response.error);
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to load preferences";
			setError(errorMessage);
			console.error("Error loading user preferences:", err);
		} finally {
			setLoading(false);
		}
	};

	const updatePreferences = async (
		newPreferences: Partial<UserPreferences>,
	) => {
		if (!user) {
			throw new Error("User not authenticated");
		}

		try {
			setIsUpdating(true);
			setError(null);

			const response = await UserService.updateUserPreferences(newPreferences);

			if (response.success && response.preferences) {
				setPreferences(response.preferences);
			} else if (response.error) {
				setError(response.error);
				throw new Error(response.error);
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to update preferences";
			setError(errorMessage);
			console.error("Error updating user preferences:", err);
			throw err;
		} finally {
			setIsUpdating(false);
		}
	};

	return {
		preferences,
		loading,
		error,
		updatePreferences,
		isUpdating,
		refetch: loadPreferences,
	};
}
