"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { Transaction } from "@/types/transaction";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface TransactionCategoryOverrideProps {
	transaction: Transaction;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function TransactionCategoryOverride({
	transaction,
	open,
	onOpenChange,
	onSuccess,
}: TransactionCategoryOverrideProps) {
	const queryClient = useQueryClient();
	const [selectedOption, setSelectedOption] = useState<string>(
		transaction.is_shared_expense ? "shared" : "personal",
	);
	const [reason, setReason] = useState("");

	const overrideMutation = useMutation({
		mutationFn: async () => {
			const response = await fetch(
				`/api/transactions/${transaction.id}/override`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						is_shared_expense: selectedOption === "shared",
						reason: reason || undefined,
					}),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to override");
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			queryClient.invalidateQueries({ queryKey: ["uncategorized"] });
			onSuccess?.();
			onOpenChange(false);
		},
	});

	const handleSubmit = () => {
		overrideMutation.mutate();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Override Transaction Categorization</DialogTitle>
					<DialogDescription>
						Change how this transaction is categorized for expense splitting.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Current categorization */}
					<div className="rounded-lg bg-muted p-3">
						<p className="text-sm font-medium">Current</p>
						<p className="text-sm text-muted-foreground">
							{transaction.is_shared_expense
								? "Shared expense"
								: "Personal expense"}
							{transaction.splitting_rule_id && " (automatically categorized)"}
						</p>
					</div>

					{/* Override options */}
					<div className="space-y-3">
						<Label>New Categorization</Label>
						<RadioGroup
							value={selectedOption}
							onValueChange={setSelectedOption}
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="personal" id="personal" />
								<Label htmlFor="personal" className="font-normal">
									Mark as Personal (not shared)
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="shared" id="shared" />
								<Label htmlFor="shared" className="font-normal">
									Mark as Shared
								</Label>
							</div>
						</RadioGroup>
					</div>

					{/* Reason (optional) */}
					<div className="space-y-2">
						<Label htmlFor="reason">Reason (optional)</Label>
						<Textarea
							id="reason"
							placeholder="Why are you changing this categorization?"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							rows={3}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={overrideMutation.isPending}
					>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={overrideMutation.isPending}>
						{overrideMutation.isPending ? "Saving..." : "Save Override"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
