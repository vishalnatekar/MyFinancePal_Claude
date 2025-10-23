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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Transaction } from "@/types/transaction";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface SplitTransactionDialogProps {
	transaction: Transaction;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function SplitTransactionDialog({
	transaction,
	open,
	onOpenChange,
	onSuccess,
}: SplitTransactionDialogProps) {
	const queryClient = useQueryClient();
	const totalAmount = Math.abs(transaction.amount);

	const [sharedAmount, setSharedAmount] = useState(totalAmount / 2);
	const [personalAmount, setPersonalAmount] = useState(totalAmount / 2);
	const [error, setError] = useState<string | null>(null);

	// Auto-calculate personal amount when shared changes
	useEffect(() => {
		const calculated = totalAmount - sharedAmount;
		if (calculated >= 0 && calculated <= totalAmount) {
			setPersonalAmount(calculated);
			setError(null);
		} else {
			setError("Invalid split amounts");
		}
	}, [sharedAmount, totalAmount]);

	const splitMutation = useMutation({
		mutationFn: async () => {
			// Validate
			if (Math.abs(sharedAmount + personalAmount - totalAmount) > 0.01) {
				throw new Error("Split amounts must equal transaction total");
			}

			const response = await fetch(
				`/api/transactions/${transaction.id}/split`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						personal_amount: personalAmount,
						shared_amount: sharedAmount,
						split_percentage: { default: 50 }, // TODO: Allow custom split percentages
					}),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to split transaction");
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			onSuccess?.();
			onOpenChange(false);
		},
		onError: (err: Error) => {
			setError(err.message);
		},
	});

	const handleSubmit = () => {
		splitMutation.mutate();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						Split Transaction: £{totalAmount.toFixed(2)}
					</DialogTitle>
					<DialogDescription>
						Split this transaction into shared and personal portions.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Shared Amount */}
					<div className="space-y-2">
						<Label htmlFor="shared-amount">Shared Amount (£)</Label>
						<Input
							id="shared-amount"
							type="number"
							step="0.01"
							min="0"
							max={totalAmount}
							value={sharedAmount}
							onChange={(e) =>
								setSharedAmount(Number.parseFloat(e.target.value) || 0)
							}
						/>
						<p className="text-xs text-muted-foreground">
							Amount to be split with household
						</p>
					</div>

					{/* Personal Amount */}
					<div className="space-y-2">
						<Label htmlFor="personal-amount">Personal Amount (£)</Label>
						<Input
							id="personal-amount"
							type="number"
							step="0.01"
							min="0"
							max={totalAmount}
							value={personalAmount}
							onChange={(e) =>
								setPersonalAmount(Number.parseFloat(e.target.value) || 0)
							}
						/>
						<p className="text-xs text-muted-foreground">
							Amount not shared (personal expense)
						</p>
					</div>

					{/* Preview */}
					<div className="rounded-lg bg-muted p-3">
						<p className="text-sm font-medium">Preview</p>
						<p className="text-sm text-muted-foreground">
							£{sharedAmount.toFixed(2)} shared + £{personalAmount.toFixed(2)}{" "}
							personal = £{totalAmount.toFixed(2)}
						</p>
						{Math.abs(sharedAmount + personalAmount - totalAmount) > 0.01 && (
							<p className="text-sm text-destructive mt-1">
								⚠️ Amounts must equal total
							</p>
						)}
					</div>

					{/* Error */}
					{error && (
						<div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={splitMutation.isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={
							splitMutation.isPending ||
							Math.abs(sharedAmount + personalAmount - totalAmount) > 0.01
						}
					>
						{splitMutation.isPending ? "Saving..." : "Save Split"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
