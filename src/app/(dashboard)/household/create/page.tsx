"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateHouseholdPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		settlement_day: 1,
	});

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			setError("Household name is required");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/households", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: formData.name.trim(),
					description: formData.description.trim() || undefined,
					settlement_day: formData.settlement_day,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(errorData?.error || "Failed to create household");
			}

			const result = await response.json();

			// Redirect to the new household page
			router.push(`/household/${result.household.id}`);
		} catch (err) {
			console.error("Error creating household:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Failed to create household";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		router.push("/household");
	};

	return (
		<div className="max-w-2xl mx-auto">
			<h1 className="text-3xl font-bold mb-6">Create New Household</h1>

			<Card>
				<CardHeader>
					<CardTitle>Household Details</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
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
								disabled={isLoading}
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
								disabled={isLoading}
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
								disabled={isLoading}
							/>
							<p className="text-sm text-muted-foreground">
								Day of the month when expenses are settled (1-31)
							</p>
						</div>

						<div className="flex justify-end space-x-4">
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating...
									</>
								) : (
									"Create Household"
								)}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
