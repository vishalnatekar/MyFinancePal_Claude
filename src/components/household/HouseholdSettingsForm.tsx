"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HouseholdService } from "@/services/household-service";
import type { Household } from "@/types/household";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { useState } from "react";

interface HouseholdSettingsFormProps {
	household: Household;
	isCreator: boolean;
	onUpdate?: (updated: Household) => void;
}

export function HouseholdSettingsForm({
	household,
	isCreator,
	onUpdate,
}: HouseholdSettingsFormProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [formData, setFormData] = useState({
		name: household.name,
		description: household.description || "",
		settlement_day: household.settlement_day,
	});

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		setSuccess(false);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!isCreator) {
			setError("Only household creators can update settings");
			return;
		}

		if (!formData.name.trim()) {
			setError("Household name is required");
			return;
		}

		setIsLoading(true);
		setError(null);
		setSuccess(false);

		try {
			const result = await HouseholdService.updateHousehold(household.id, {
				name: formData.name.trim(),
				description: formData.description.trim() || undefined,
				settlement_day: formData.settlement_day,
			});

			setSuccess(true);
			if (onUpdate) {
				onUpdate(result.household as Household);
			}
		} catch (err) {
			console.error("Error updating household:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Failed to update household";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Household Settings</CardTitle>
				<CardDescription>
					{isCreator
						? "Update your household information"
						: "Only the household creator can update these settings"}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6">
					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{success && (
						<Alert>
							<AlertDescription>
								Household settings updated successfully!
							</AlertDescription>
						</Alert>
					)}

					<div className="space-y-2">
						<Label htmlFor="name">
							Household Name <span className="text-destructive">*</span>
						</Label>
						<Input
							id="name"
							name="name"
							value={formData.name}
							onChange={handleInputChange}
							placeholder="e.g., Smith Family Home"
							disabled={isLoading || !isCreator}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description (Optional)</Label>
						<Textarea
							id="description"
							name="description"
							value={formData.description}
							onChange={handleInputChange}
							placeholder="Brief description of this household..."
							rows={3}
							disabled={isLoading || !isCreator}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="settlement_day">Settlement Day of Month</Label>
						<Input
							id="settlement_day"
							name="settlement_day"
							type="number"
							min="1"
							max="31"
							value={formData.settlement_day}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									settlement_day: Number.parseInt(e.target.value) || 1,
								}))
							}
							disabled={isLoading || !isCreator}
						/>
						<p className="text-sm text-muted-foreground">
							Day of the month when expenses are settled (1-31)
						</p>
					</div>

					{isCreator && (
						<div className="flex justify-end">
							<Button type="submit" disabled={isLoading}>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<Save className="mr-2 h-4 w-4" />
										Save Changes
									</>
								)}
							</Button>
						</div>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
