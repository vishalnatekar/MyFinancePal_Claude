"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

const TIMEZONE_OPTIONS = [
	{ value: "America/New_York", label: "Eastern Time (ET)" },
	{ value: "America/Chicago", label: "Central Time (CT)" },
	{ value: "America/Denver", label: "Mountain Time (MT)" },
	{ value: "America/Los_Angeles", label: "Pacific Time (PT)" },
	{ value: "America/Anchorage", label: "Alaska Time (AT)" },
	{ value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
	{ value: "UTC", label: "UTC" },
];

export function UserPreferences() {
	const { preferences, loading, error, updatePreferences, isUpdating } =
		useUserPreferences();

	const [localPreferences, setLocalPreferences] = useState({
		email_notifications: preferences?.email_notifications ?? true,
		shared_expense_alerts: preferences?.shared_expense_alerts ?? true,
		settlement_reminders: preferences?.settlement_reminders ?? true,
		timezone: preferences?.timezone ?? "America/New_York",
	});

	const [showSuccess, setShowSuccess] = useState(false);

	const handleSave = async () => {
		try {
			await updatePreferences(localPreferences);
			setShowSuccess(true);
			setTimeout(() => setShowSuccess(false), 3000);
		} catch (error) {
			console.error("Failed to save preferences:", error);
		}
	};

	const hasChanges =
		localPreferences.email_notifications !==
			(preferences?.email_notifications ?? true) ||
		localPreferences.shared_expense_alerts !==
			(preferences?.shared_expense_alerts ?? true) ||
		localPreferences.settlement_reminders !==
			(preferences?.settlement_reminders ?? true) ||
		localPreferences.timezone !== (preferences?.timezone ?? "America/New_York");

	if (loading) {
		return (
			<div
				className="flex items-center justify-center py-8"
				aria-live="polite"
				aria-busy="true"
				aria-label="Loading preferences"
			>
				<Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{showSuccess && (
				<Alert>
					<CheckCircle className="h-4 w-4" />
					<AlertDescription>Preferences saved successfully!</AlertDescription>
				</Alert>
			)}

			<div className="space-y-4">
				<div>
					<h3 className="text-lg font-medium">Email Notifications</h3>
					<p className="text-sm text-muted-foreground">
						Configure when you want to receive email notifications
					</p>
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="email-notifications">Email Notifications</Label>
							<div className="text-sm text-muted-foreground">
								Receive general notifications via email
							</div>
						</div>
						<Switch
							id="email-notifications"
							checked={localPreferences.email_notifications}
							onCheckedChange={(checked) =>
								setLocalPreferences((prev) => ({
									...prev,
									email_notifications: checked,
								}))
							}
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="expense-alerts">Shared Expense Alerts</Label>
							<div className="text-sm text-muted-foreground">
								Get notified when shared expenses are added or updated
							</div>
						</div>
						<Switch
							id="expense-alerts"
							checked={localPreferences.shared_expense_alerts}
							onCheckedChange={(checked) =>
								setLocalPreferences((prev) => ({
									...prev,
									shared_expense_alerts: checked,
								}))
							}
							disabled={!localPreferences.email_notifications}
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="settlement-reminders">Settlement Reminders</Label>
							<div className="text-sm text-muted-foreground">
								Receive reminders about pending settlements
							</div>
						</div>
						<Switch
							id="settlement-reminders"
							checked={localPreferences.settlement_reminders}
							onCheckedChange={(checked) =>
								setLocalPreferences((prev) => ({
									...prev,
									settlement_reminders: checked,
								}))
							}
							disabled={!localPreferences.email_notifications}
						/>
					</div>
				</div>
			</div>

			<Separator />

			<div className="space-y-4">
				<div>
					<h3 className="text-lg font-medium">Display Preferences</h3>
					<p className="text-sm text-muted-foreground">
						Customize how information is displayed
					</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor="timezone">Time Zone</Label>
					<Select
						value={localPreferences.timezone}
						onValueChange={(value) =>
							setLocalPreferences((prev) => ({
								...prev,
								timezone: value,
							}))
						}
					>
						<SelectTrigger id="timezone">
							<SelectValue placeholder="Select timezone" />
						</SelectTrigger>
						<SelectContent>
							{TIMEZONE_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<p className="text-sm text-muted-foreground">
						Current time:{" "}
						{new Date().toLocaleString("en-US", {
							timeZone: localPreferences.timezone,
							timeZoneName: "short",
						})}
					</p>
				</div>
			</div>

			<div className="flex justify-end">
				<Button onClick={handleSave} disabled={!hasChanges || isUpdating}>
					{isUpdating ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							Saving...
						</>
					) : (
						"Save Changes"
					)}
				</Button>
			</div>
		</div>
	);
}
