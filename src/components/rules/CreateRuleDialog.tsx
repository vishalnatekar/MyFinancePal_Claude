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
import type {
	CreateSplittingRuleRequest,
	RuleType,
} from "@/types/splitting-rule";
import { useEffect, useState } from "react";

interface CreateRuleDialogProps {
	householdId: string;
	open: boolean;
	onClose: () => void;
	onRuleCreated: () => void;
}

interface HouseholdMember {
	user_id: string;
	name: string;
}

export function CreateRuleDialog({
	householdId,
	open,
	onClose,
	onRuleCreated,
}: CreateRuleDialogProps) {
	const [loading, setLoading] = useState(false);
	const [ruleType, setRuleType] = useState<RuleType>("merchant");
	const [ruleName, setRuleName] = useState("");
	const [merchantPattern, setMerchantPattern] = useState("");
	const [categoryMatch, setCategoryMatch] = useState("");
	const [minAmount, setMinAmount] = useState("");
	const [priority, setPriority] = useState("100");
	const [members, setMembers] = useState<HouseholdMember[]>([]);

	// Fetch household members when dialog opens
	useEffect(() => {
		if (open && householdId) {
			fetch(`/api/households/${householdId}`)
				.then((res) => res.json())
				.then((data) => {
					if (data.household?.household_members) {
						const memberList = data.household.household_members.map(
							(m: any) => ({
								user_id: m.user_id,
								name: m.name || m.full_name || "Member",
							}),
						);
						setMembers(memberList);
					}
				})
				.catch((err) =>
					console.error("Failed to fetch household members:", err),
				);
		}
	}, [open, householdId]);

	const handleRuleTypeChange = (value: string) => {
		const allowed: RuleType[] = [
			"merchant",
			"category",
			"amount_threshold",
			"default",
		];
		if (allowed.includes(value as RuleType)) {
			setRuleType(value as RuleType);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			// Create default equal split among household members
			const splitPercentage: Record<string, number> = {};
			if (members.length > 0) {
				const equalSplit = Math.floor(100 / members.length);
				const remainder = 100 - equalSplit * members.length;

				members.forEach((member, index) => {
					// Give remainder to first member to ensure sum = 100
					splitPercentage[member.user_id] =
						index === 0 ? equalSplit + remainder : equalSplit;
				});
			}

			// Build request body based on rule type
			const baseRequest: CreateSplittingRuleRequest = {
				rule_name: ruleName,
				rule_type: ruleType,
				split_percentage: splitPercentage,
				priority: Number.parseInt(priority, 10),
			};

			let requestBody: CreateSplittingRuleRequest = baseRequest;

			if (ruleType === "merchant") {
				requestBody = {
					...baseRequest,
					merchant_pattern: merchantPattern,
				};
			} else if (ruleType === "category") {
				requestBody = {
					...baseRequest,
					category_match: categoryMatch,
				};
			} else if (ruleType === "amount_threshold") {
				requestBody = {
					...baseRequest,
					min_amount: Number.parseFloat(minAmount),
				};
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
						<Select value={ruleType} onValueChange={handleRuleTypeChange}>
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
						<strong>Split Percentage:</strong> This rule will automatically
						split expenses equally among all {members.length} household member
						{members.length !== 1 ? "s" : ""}.
						{members.length === 2 && " (50/50 split)"}
						{members.length === 3 && " (33/33/34 split)"}
						<br />
						<span className="text-xs">
							Advanced split customization coming soon.
						</span>
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
