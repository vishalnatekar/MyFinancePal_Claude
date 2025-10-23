"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfidenceBadge } from "@/components/transactions/ConfidenceBadge";
import { CategoryIndicator } from "@/components/transactions/CategoryIndicator";
import { TransactionCategoryOverride } from "@/components/transactions/TransactionCategoryOverride";
import type { UncategorizedQueueItem } from "@/types/transaction";
import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

export default function ReviewTransactionsPage() {
	const params = useParams();
	const householdId = params.id as string;
	const queryClient = useQueryClient();

	const [selectedTransaction, setSelectedTransaction] =
		useState<UncategorizedQueueItem | null>(null);
	const [overrideOpen, setOverrideOpen] = useState(false);

	// Fetch uncategorized transactions
	const { data, isLoading } = useQuery({
		queryKey: ["uncategorized", householdId],
		queryFn: async () => {
			const response = await fetch(
				`/api/households/${householdId}/uncategorized?max_confidence=70`,
			);
			if (!response.ok) throw new Error("Failed to fetch");
			return response.json();
		},
	});

	// Accept suggestion mutation
	const acceptMutation = useMutation({
		mutationFn: async (item: UncategorizedQueueItem) => {
			if (!item.suggested_rule) {
				throw new Error("No suggested rule");
			}

			const response = await fetch(
				`/api/households/${householdId}/categorize-batch`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						transaction_ids: [item.transaction.id],
						action: "apply_rule",
						rule_id: item.suggested_rule.id,
					}),
				},
			);

			if (!response.ok) throw new Error("Failed to accept");
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["uncategorized"] });
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
		},
	});

	// Reject mutation (mark as personal)
	const rejectMutation = useMutation({
		mutationFn: async (item: UncategorizedQueueItem) => {
			const response = await fetch(
				`/api/households/${householdId}/categorize-batch`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						transaction_ids: [item.transaction.id],
						action: "mark_personal",
					}),
				},
			);

			if (!response.ok) throw new Error("Failed to reject");
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["uncategorized"] });
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
		},
	});

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	const queueItems: UncategorizedQueueItem[] = data?.queue_items || [];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Transactions Needing Review</h1>
				<p className="text-muted-foreground mt-1">
					{queueItems.length} transaction
					{queueItems.length !== 1 ? "s" : ""} need your attention
				</p>
			</div>

			{queueItems.length === 0 ? (
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-lg font-medium">
							All transactions are categorized!
						</p>
						<p className="text-muted-foreground mt-1">
							There are no transactions that need review.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4">
					{queueItems.map((item) => (
						<Card key={item.transaction.id}>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="space-y-1">
										<CardTitle className="text-lg">
											{item.transaction.merchant_name}
										</CardTitle>
										<p className="text-sm text-muted-foreground">
											{new Date(item.transaction.date).toLocaleDateString()} •{" "}
											{item.transaction.category}
										</p>
									</div>
									<div className="text-right">
										<p className="text-lg font-semibold">
											£{Math.abs(item.transaction.amount).toFixed(2)}
										</p>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								{/* Status badges */}
								<div className="flex gap-2 flex-wrap">
									<CategoryIndicator transaction={item.transaction} />
									<ConfidenceBadge
										confidenceScore={item.transaction.confidence_score}
									/>
									<Badge variant="outline">{item.requires_review_reason}</Badge>
								</div>

								{/* Suggested rule */}
								{item.suggested_rule && (
									<div className="rounded-lg bg-muted p-3">
										<p className="text-sm font-medium">Suggested Rule</p>
										<p className="text-sm text-muted-foreground">
											{item.suggested_rule.rule_name} (
											{item.suggested_confidence}% confidence)
										</p>
									</div>
								)}

								{/* Actions */}
								<div className="flex gap-2">
									{item.suggested_rule && (
										<Button
											size="sm"
											onClick={() => acceptMutation.mutate(item)}
											disabled={acceptMutation.isPending}
										>
											<CheckCircle className="mr-1" size={14} />
											Accept
										</Button>
									)}
									<Button
										size="sm"
										variant="outline"
										onClick={() => rejectMutation.mutate(item)}
										disabled={rejectMutation.isPending}
									>
										<XCircle className="mr-1" size={14} />
										Mark Personal
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											setSelectedTransaction(item);
											setOverrideOpen(true);
										}}
									>
										Edit
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Override dialog */}
			{selectedTransaction && (
				<TransactionCategoryOverride
					transaction={selectedTransaction.transaction}
					open={overrideOpen}
					onOpenChange={setOverrideOpen}
					onSuccess={() => {
						queryClient.invalidateQueries({ queryKey: ["uncategorized"] });
					}}
				/>
			)}
		</div>
	);
}
