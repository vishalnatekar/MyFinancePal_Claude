"use client";

import { supabase } from "@/lib/supabase";
import type { NotificationWithActor } from "@/types/notification";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

export interface UseNotificationsReturn {
	notifications: NotificationWithActor[];
	unreadCount: number;
	loading: boolean;
	error: string | null;
	fetchNotifications: (householdId?: string) => Promise<void>;
	markAsRead: (notificationId: string) => Promise<void>;
	markAllAsRead: (householdId?: string) => Promise<void>;
	refreshNotifications: () => Promise<void>;
}

export function useNotifications(
	userId?: string,
	householdId?: string,
): UseNotificationsReturn {
	const [notifications, setNotifications] = useState<NotificationWithActor[]>(
		[],
	);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch notifications from API
	const fetchNotifications = useCallback(
		async (filterHouseholdId?: string) => {
			try {
				setLoading(true);
				setError(null);

				// Build query params
				const params = new URLSearchParams();
				if (filterHouseholdId || householdId) {
					params.append("household_id", filterHouseholdId || householdId || "");
				}
				params.append("limit", "50");

				const response = await fetch(`/api/notifications?${params.toString()}`);

				if (!response.ok) {
					throw new Error("Failed to fetch notifications");
				}

				const data = await response.json();
				setNotifications(data.notifications || []);
				setUnreadCount(data.unread_count || 0);
			} catch (err) {
				console.error("Error fetching notifications:", err);
				setError(
					err instanceof Error ? err.message : "Failed to fetch notifications",
				);
			} finally {
				setLoading(false);
			}
		},
		[householdId],
	);

	// Mark a single notification as read
	const markAsRead = useCallback(async (notificationId: string) => {
		try {
			const response = await fetch(`/api/notifications/${notificationId}/read`, {
				method: "PUT",
			});

			if (!response.ok) {
				throw new Error("Failed to mark notification as read");
			}

			// Optimistically update local state
			setNotifications((prev) =>
				prev.map((notif) =>
					notif.id === notificationId
						? { ...notif, is_read: true, read_at: new Date().toISOString() }
						: notif,
				),
			);

			setUnreadCount((prev) => Math.max(0, prev - 1));
		} catch (err) {
			console.error("Error marking notification as read:", err);
			throw err;
		}
	}, []);

	// Mark all notifications as read
	const markAllAsRead = useCallback(
		async (filterHouseholdId?: string) => {
			try {
				const body = filterHouseholdId || householdId
					? { household_id: filterHouseholdId || householdId }
					: {};

				const response = await fetch("/api/notifications/mark-all-read", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				});

				if (!response.ok) {
					throw new Error("Failed to mark all notifications as read");
				}

				// Optimistically update local state
				setNotifications((prev) =>
					prev.map((notif) =>
						!notif.is_read
							? { ...notif, is_read: true, read_at: new Date().toISOString() }
							: notif,
					),
				);

				setUnreadCount(0);
			} catch (err) {
				console.error("Error marking all notifications as read:", err);
				throw err;
			}
		},
		[householdId],
	);

	// Refresh notifications (alias for fetchNotifications for convenience)
	const refreshNotifications = useCallback(() => {
		return fetchNotifications(householdId);
	}, [fetchNotifications, householdId]);

	// Initial fetch on mount
	useEffect(() => {
		if (userId) {
			fetchNotifications(householdId);
		}
	}, [userId, householdId, fetchNotifications]);

	// Set up real-time subscription
	useEffect(() => {
		if (!userId) return;

		// Subscribe to notifications table for INSERT events
		const channel = supabase
			.channel("notifications-changes")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "notifications",
					filter: `recipient_id=eq.${userId}`,
				},
				async (
					payload: RealtimePostgresChangesPayload<{
						[key: string]: any;
					}>,
				) => {
					console.log("New notification received:", payload);

					// Type the payload.new properly
					const newRecord = payload.new as {
						id: string;
						household_id: string;
						[key: string]: any;
					};

					// If householdId filter is active, only add notifications for that household
					if (
						householdId &&
						newRecord.household_id !== householdId
					) {
						// Still increment unread count but don't add to list
						setUnreadCount((prev) => prev + 1);
						return;
					}

					// Fetch the complete notification
					const { data: newNotification, error: fetchError } = await supabase
						.from("notifications")
						.select("*")
						.eq("id", newRecord.id)
						.single();

					if (fetchError) {
						console.error("Error fetching new notification:", fetchError);
						return;
					}

					// Fetch actor profile separately if actor_id exists
					let actor = null;
					if (newNotification.actor_id) {
						const { data: actorData } = await supabase
							.from("profiles")
							.select("id, email, full_name, avatar_url")
							.eq("id", newNotification.actor_id)
							.single();

						actor = actorData;
					}

					// Add to notifications list with actor
					setNotifications((prev) => [
						{ ...newNotification, actor } as NotificationWithActor,
						...prev,
					]);

					// Increment unread count
					setUnreadCount((prev) => prev + 1);
				},
			)
			.subscribe();

		// Cleanup on unmount
		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId, householdId]);

	return {
		notifications,
		unreadCount,
		loading,
		error,
		fetchNotifications,
		markAsRead,
		markAllAsRead,
		refreshNotifications,
	};
}
