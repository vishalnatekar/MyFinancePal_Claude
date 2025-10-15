"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { NotificationPreferences as NotificationPreferencesType } from "@/types/notification";
import { Bell, Mail } from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationPreferencesProps {
	householdId: string;
	userId?: string;
}

export function NotificationPreferences({
	householdId,
	userId,
}: NotificationPreferencesProps) {
	const [preferences, setPreferences] = useState<NotificationPreferencesType | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// Fetch preferences on mount
	useEffect(() => {
		if (userId && householdId) {
			fetchPreferences();
		}
	}, [userId, householdId]);

	const fetchPreferences = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`/api/notifications/preferences/${householdId}`);

			if (!response.ok) {
				throw new Error("Failed to fetch notification preferences");
			}

			const data = await response.json();
			setPreferences(data);
		} catch (err) {
			console.error("Error fetching preferences:", err);
			setError(err instanceof Error ? err.message : "Failed to load preferences");
		} finally {
			setLoading(false);
		}
	};

	const updatePreferences = async (updates: Partial<NotificationPreferencesType>) => {
		if (!preferences) return;

		const updatedPreferences = { ...preferences, ...updates };
		setPreferences(updatedPreferences);

		try {
			setSaving(true);
			setError(null);
			setSuccessMessage(null);

			const response = await fetch(`/api/notifications/preferences/${householdId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updatedPreferences),
			});

			if (!response.ok) {
				throw new Error("Failed to save notification preferences");
			}

			setSuccessMessage("Preferences saved successfully");
			setTimeout(() => setSuccessMessage(null), 3000);
		} catch (err) {
			console.error("Error saving preferences:", err);
			setError(err instanceof Error ? err.message : "Failed to save preferences");
			// Revert changes on error
			fetchPreferences();
		} finally {
			setSaving(false);
		}
	};

	const handleThresholdChange = (value: number) => {
		updatePreferences({ large_transaction_threshold: value });
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Notification Preferences</CardTitle>
					<CardDescription>
						Loading preferences...
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	if (!preferences) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Bell className="w-5 h-5" />
					Notification Preferences
				</CardTitle>
				<CardDescription>
					Manage how you receive notifications for this household
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{error && (
					<div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
						{error}
					</div>
				)}

				{successMessage && (
					<div className="p-3 rounded-md bg-green-50 text-green-700 text-sm">
						{successMessage}
					</div>
				)}

				{/* In-App Notifications */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="in-app-notifications" className="text-base">
								In-App Notifications
							</Label>
							<p className="text-sm text-muted-foreground">
								Receive real-time notifications in the app
							</p>
						</div>
						<Switch
							id="in-app-notifications"
							checked={preferences.in_app_notifications}
							onCheckedChange={(checked) =>
								updatePreferences({ in_app_notifications: checked })
							}
							disabled={saving}
						/>
					</div>
					<Separator />
				</div>

				{/* Email Notifications */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="email-notifications" className="text-base flex items-center gap-2">
								<Mail className="w-4 h-4" />
								Email Notifications
							</Label>
							<p className="text-sm text-muted-foreground">
								Receive notifications via email
							</p>
						</div>
						<Switch
							id="email-notifications"
							checked={preferences.email_notifications}
							onCheckedChange={(checked) =>
								updatePreferences({ email_notifications: checked })
							}
							disabled={saving}
						/>
					</div>
					<Separator />
				</div>

				{/* Large Transaction Threshold */}
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="threshold" className="text-base">
							Large Transaction Alert Threshold
						</Label>
						<p className="text-sm text-muted-foreground">
							Get notified when a shared transaction exceeds this amount (£{preferences.large_transaction_threshold})
						</p>
						<div className="flex items-center gap-4 pt-2">
							<input
								id="threshold"
								type="range"
								min="10"
								max="1000"
								step="10"
								value={preferences.large_transaction_threshold}
								onChange={(e) => handleThresholdChange(Number(e.target.value))}
								className="flex-1"
								disabled={saving}
							/>
							<div className="w-20 text-right font-medium">
								£{preferences.large_transaction_threshold}
							</div>
						</div>
					</div>
					<Separator />
				</div>

				{/* Weekly Digest */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="weekly-digest" className="text-base">
								Weekly Summary Email
							</Label>
							<p className="text-sm text-muted-foreground">
								Receive a weekly summary of household activity (every Sunday)
							</p>
						</div>
						<Switch
							id="weekly-digest"
							checked={preferences.weekly_digest_enabled}
							onCheckedChange={(checked) =>
								updatePreferences({ weekly_digest_enabled: checked })
							}
							disabled={saving}
						/>
					</div>
				</div>

				{saving && (
					<div className="text-sm text-muted-foreground">
						Saving...
					</div>
				)}
			</CardContent>
		</Card>
	);
}
