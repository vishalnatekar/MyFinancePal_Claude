// Create Rule Dialog Component
// Story 4.1: Expense Splitting Rules Engine

"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface CreateRuleDialogProps {
	householdId: string;
	open: boolean;
	onClose: () => void;
	onRuleCreated: () => void;
}

export function CreateRuleDialog({
	householdId,
	open,
	onClose,
	onRuleCreated,
}: CreateRuleDialogProps) {
	const [loading, setLoading] = useState(false);
	const [ruleType, setRuleType] = useState<string>("merchant");
	const [ruleName, setRuleName] = useState("");
	const [merchantPattern, setMerchantPattern] = useState("");
	const [categoryMatch, setCategoryMatch] = useState("");
	const [minAmount, setMinAmount] = useState("");
	const [priority, setPriority] = useState("100");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			// Build request body based on rule type
			const requestBody: any = {
				rule_name: ruleName,
				rule_type: ruleType,
				priority: Number.parseInt(priority),
				split_percentage: {}, // TODO: Implement split percentage selector
			};

			if (ruleType === "merchant") {
				requestBody.merchant_pattern = merchantPattern;
			} else if (ruleType === "category") {
				requestBody.category_match = categoryMatch;
			} else if (ruleType === "amount_threshold") {
				requestBody.min_amount = Number.parseFloat(minAmount);
			}

			const response = await fetch(`/api/households/${householdId}/rules`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to create rule");
			}

			onRuleCreated();
			handleClose();
		} catch (err) {
			console.error("Error creating rule:", err);
			alert(err instanceof Error ? err.message : "Failed to create rule");
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setRuleName("");
		setMerchantPattern("");
		setCategoryMatch("");
		setMinAmount("");
		setPriority("100");
		setRuleType("merchant");
		onClose();
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Create Splitting Rule</DialogTitle>
					<DialogDescription>
						Define a rule to automatically split shared expenses
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Label htmlFor="rule-name">Rule Name</Label>
						<Input
							id="rule-name"
							value={ruleName}
							onChange={(e) => setRuleName(e.target.value)}
							placeholder="e.g., Groceries 50/50"
							required
						/>
					</div>

					<div>
						<Label htmlFor="rule-type">Rule Type</Label>
						<Select value={ruleType} onValueChange={setRuleType}>
							<SelectTrigger id="rule-type">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="merchant">Merchant Pattern</SelectItem>
								<SelectItem value="category">Category Match</SelectItem>
								<SelectItem value="amount_threshold">
									Amount Threshold
								</SelectItem>
								<SelectItem value="default">Default Rule</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{ruleType === "merchant" && (
						<div>
							<Label htmlFor="merchant-pattern">Merchant Pattern (Regex)</Label>
							<Input
								id="merchant-pattern"
								value={merchantPattern}
								onChange={(e) => setMerchantPattern(e.target.value)}
								placeholder="e.g., Tesco.* or (Sainsbury|Asda).*"
								required
							/>
							<p className="text-xs text-muted-foreground mt-1">
								Use regex patterns to match merchant names
							</p>
						</div>
					)}

					{ruleType === "category" && (
						<div>
							<Label htmlFor="category-match">Category</Label>
							<Input
								id="category-match"
								value={categoryMatch}
								onChange={(e) => setCategoryMatch(e.target.value)}
								placeholder="e.g., groceries, dining, transport"
								required
							/>
						</div>
					)}

					{ruleType === "amount_threshold" && (
						<div>
							<Label htmlFor="min-amount">Minimum Amount (£)</Label>
							<Input
								id="min-amount"
								type="number"
								step="0.01"
								value={minAmount}
								onChange={(e) => setMinAmount(e.target.value)}
								placeholder="e.g., 100"
								required
							/>
						</div>
					)}

					<div>
						<Label htmlFor="priority">Priority (1 = highest)</Label>
						<Input
							id="priority"
							type="number"
							value={priority}
							onChange={(e) => setPriority(e.target.value)}
							min="1"
							max="1000"
							required
						/>
					</div>

					<div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
						Note: Split percentage configuration will be added in the complete
						implementation. For now, rules will be created with empty split
						percentages.
					</div>

					<div className="flex justify-end gap-2 pt-4">
						<Button type="button" variant="outline" onClick={handleClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "Creating..." : "Create Rule"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
