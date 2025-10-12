"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import type { SharedTransactionWithOwner } from "@/types/household";
import { Clock, Filter, User, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SharedTransactionsListProps {
	householdId: string;
	transactions?: SharedTransactionWithOwner[];
	members?: Array<{
		user_id: string;
		name: string;
		avatar_url?: string;
	}>;
}

export function SharedTransactionsList({
	householdId,
	transactions: externalTransactions,
	members = [],
}: SharedTransactionsListProps) {
	const [transactions, setTransactions] = useState<
		SharedTransactionWithOwner[]
	>([]);
	const [filteredTransactions, setFilteredTransactions] = useState<
		SharedTransactionWithOwner[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [displayCount, setDisplayCount] = useState(20);

	// Filters
	const [selectedMember, setSelectedMember] = useState<string>("all");
	const [dateFrom, setDateFrom] = useState<string>("");
	const [dateTo, setDateTo] = useState<string>("");

	// Use external transactions if provided, otherwise fetch
	useEffect(() => {
		if (externalTransactions) {
			setTransactions(externalTransactions);
			setIsLoading(false);
			return;
		}

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

		// Set up real-time subscription for transaction sharing updates
		const channel = supabase
			.channel(`household-${householdId}-transactions`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "transactions",
					filter: `shared_with_household_id=eq.${householdId}`,
				},
				(payload) => {
					console.log("Transaction shared with household:", payload);
					// Refetch transactions to get updated list with owner info
					fetchSharedTransactions();
				},
			)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "transactions",
					filter: `shared_with_household_id=eq.${householdId}`,
				},
				(payload) => {
					console.log("New shared transaction:", payload);
					// Refetch transactions to get updated list with owner info
					fetchSharedTransactions();
				},
			)
			.subscribe();

		// Cleanup subscription on unmount
		return () => {
			supabase.removeChannel(channel);
		};
	}, [householdId, externalTransactions]);

	// Apply filters whenever transactions or filter criteria change
	useEffect(() => {
		let filtered = [...transactions];

		// Filter by member
		if (selectedMember !== "all") {
			filtered = filtered.filter((tx) => tx.owner_id === selectedMember);
		}

		// Filter by date range
		if (dateFrom) {
			filtered = filtered.filter(
				(tx) => new Date(tx.date) >= new Date(dateFrom),
			);
		}

		if (dateTo) {
			filtered = filtered.filter((tx) => new Date(tx.date) <= new Date(dateTo));
		}

		setFilteredTransactions(filtered);
		setDisplayCount(20); // Reset display count when filters change
	}, [transactions, selectedMember, dateFrom, dateTo]);

	const clearFilters = () => {
		setSelectedMember("all");
		setDateFrom("");
		setDateTo("");
	};

	const hasActiveFilters =
		selectedMember !== "all" || dateFrom !== "" || dateTo !== "";

	const loadMore = () => {
		setDisplayCount((prev) => prev + 20);
	};

	const displayedTransactions = filteredTransactions.slice(0, displayCount);
	const hasMore = displayCount < filteredTransactions.length;

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

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

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>
						Shared Transactions
						{filteredTransactions.length !== transactions.length && (
							<span className="text-sm font-normal text-muted-foreground ml-2">
								({filteredTransactions.length} of {transactions.length})
							</span>
						)}
					</CardTitle>
					{hasActiveFilters && (
						<Button variant="ghost" size="sm" onClick={clearFilters}>
							<X className="h-4 w-4 mr-1" />
							Clear Filters
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{/* Filters */}
				<div className="flex gap-3 mb-4 flex-wrap">
					{members.length > 0 && (
						<Select value={selectedMember} onValueChange={setSelectedMember}>
							<SelectTrigger className="w-[180px]">
								<Filter className="h-4 w-4 mr-2" />
								<SelectValue placeholder="All members" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All members</SelectItem>
								{members.map((member) => (
									<SelectItem key={member.user_id} value={member.user_id}>
										{member.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}

					<Input
						type="date"
						placeholder="From date"
						value={dateFrom}
						onChange={(e) => setDateFrom(e.target.value)}
						className="w-[160px]"
					/>

					<Input
						type="date"
						placeholder="To date"
						value={dateTo}
						onChange={(e) => setDateTo(e.target.value)}
						className="w-[160px]"
					/>
				</div>

				{/* Transactions List */}
				{displayedTransactions.length === 0 ? (
					<p className="text-sm text-muted-foreground text-center py-8">
						{hasActiveFilters
							? "No transactions match the selected filters"
							: "No transactions have been shared with this household yet"}
					</p>
				) : (
					<>
						<div className="space-y-2">
							{displayedTransactions.map((transaction) => (
								<div
									key={transaction.id}
									className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
								>
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<p className="font-medium">{transaction.merchant_name}</p>
											<Badge variant="outline" className="text-xs">
												<Avatar className="h-4 w-4 mr-1">
													<AvatarImage src={transaction.owner_avatar} />
													<AvatarFallback className="text-[8px]">
														{getInitials(transaction.owner_name)}
													</AvatarFallback>
												</Avatar>
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

						{/* Load More Button */}
						{hasMore && (
							<div className="mt-4 text-center">
								<Button onClick={loadMore} variant="outline">
									Load More ({filteredTransactions.length - displayCount}{" "}
									remaining)
								</Button>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
