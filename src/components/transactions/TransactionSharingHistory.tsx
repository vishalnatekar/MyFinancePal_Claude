"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { transactionSharingService } from "@/services/transaction-sharing-service";
import type { TransactionSharingHistory } from "@/types/transaction";
import { Clock, Lock, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface TransactionSharingHistoryProps {
	transactionId: string;
}

export function TransactionSharingHistoryComponent({
	transactionId,
}: TransactionSharingHistoryProps) {
	const [history, setHistory] = useState<TransactionSharingHistory[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchHistory = async () => {
			try {
				setIsLoading(true);
				const data = await transactionSharingService.getSharingHistory(
					transactionId,
				);
				setHistory(data);
			} catch (err) {
				console.error("Failed to fetch sharing history:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load history",
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchHistory();
	}, [transactionId]);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat("en-GB", {
			dateStyle: "medium",
			timeStyle: "short",
		}).format(date);
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Sharing History</CardTitle>
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
					<CardTitle className="text-sm">Sharing History</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-destructive">{error}</p>
				</CardContent>
			</Card>
		);
	}

	if (history.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Sharing History</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						No sharing history for this transaction.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">Sharing History</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{history.map((entry) => (
						<div
							key={entry.id}
							className="flex items-start gap-3 pb-3 border-b last:border-b-0"
						>
							<div className="mt-1">
								{entry.action === "shared" ? (
									<Users className="h-4 w-4 text-green-600" />
								) : (
									<Lock className="h-4 w-4 text-gray-600" />
								)}
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium">
									{entry.action === "shared"
										? "Shared with household"
										: "Made private"}
								</p>
								<p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
									<Clock className="h-3 w-3" />
									{formatDate(entry.changed_at)}
								</p>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
