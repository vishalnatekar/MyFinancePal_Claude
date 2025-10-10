"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SharedTransactionWithOwner } from "@/types/transaction";
import { Clock, User } from "lucide-react";
import { useEffect, useState } from "react";

interface SharedTransactionsListProps {
	householdId: string;
}

export function SharedTransactionsList({
	householdId,
}: SharedTransactionsListProps) {
	const [transactions, setTransactions] = useState<
		SharedTransactionWithOwner[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchSharedTransactions = async () => {
			try {
				setIsLoading(true);
				const response = await fetch(
					`/api/dashboard/household/${householdId}/transactions`,
					{
						credentials: "include",
					},
				);

				if (!response.ok) {
					throw new Error("Failed to fetch shared transactions");
				}

				const data = await response.json();
				setTransactions(data.transactions || []);
			} catch (err) {
				console.error("Failed to fetch shared transactions:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to load shared transactions",
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchSharedTransactions();
	}, [householdId]);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-GB", {
			style: "currency",
			currency: "GBP",
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat("en-GB", {
			dateStyle: "medium",
		}).format(date);
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Shared Transactions</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">Loading...</p>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Shared Transactions</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-destructive">{error}</p>
				</CardContent>
			</Card>
		);
	}

	if (transactions.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Shared Transactions</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						No transactions have been shared with this household yet.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Shared Transactions</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{transactions.map((transaction) => (
						<div
							key={transaction.id}
							className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
						>
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<p className="font-medium">{transaction.merchant_name}</p>
									<Badge variant="outline" className="text-xs">
										<User className="h-3 w-3 mr-1" />
										{transaction.owner_name}
									</Badge>
								</div>
								<div className="flex items-center gap-3 text-xs text-muted-foreground">
									<span className="flex items-center gap-1">
										<Clock className="h-3 w-3" />
										{formatDate(transaction.date)}
									</span>
									{transaction.category && (
										<Badge variant="secondary" className="text-xs">
											{transaction.category}
										</Badge>
									)}
								</div>
								{transaction.shared_at && (
									<p className="text-xs text-muted-foreground mt-1">
										Shared {formatDate(transaction.shared_at)}
									</p>
								)}
							</div>
							<div className="text-right">
								<p
									className={`text-lg font-semibold ${
										transaction.amount < 0
											? "text-red-600"
											: "text-green-600"
									}`}
								>
									{formatCurrency(transaction.amount)}
								</p>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
