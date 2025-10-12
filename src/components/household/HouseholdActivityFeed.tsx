"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { HouseholdActivityEvent } from "@/types/household";
import { formatDistanceToNow } from "date-fns";
import {
	AlertCircle,
	Filter,
	Share2,
	TrendingUp,
	UserPlus,
} from "lucide-react";
import { useMemo, useState } from "react";

interface HouseholdActivityFeedProps {
	activities: HouseholdActivityEvent[];
	limit?: number;
}

export function HouseholdActivityFeed({
	activities,
	limit = 30,
}: HouseholdActivityFeedProps) {
	const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
	const [displayCount, setDisplayCount] = useState(limit);

	// Filter activities by event type
	const filteredActivities = useMemo(() => {
		if (eventTypeFilter === "all") return activities;
		return activities.filter((activity) => activity.type === eventTypeFilter);
	}, [activities, eventTypeFilter]);

	const displayedActivities = filteredActivities.slice(0, displayCount);
	const hasMore = displayCount < filteredActivities.length;

	const getEventIcon = (type: HouseholdActivityEvent["type"]) => {
		switch (type) {
			case "member_joined":
				return <UserPlus className="h-4 w-4 text-blue-500" />;
			case "account_shared":
				return <Share2 className="h-4 w-4 text-green-500" />;
			case "transaction_shared":
				return <TrendingUp className="h-4 w-4 text-purple-500" />;
			case "large_transaction":
				return <AlertCircle className="h-4 w-4 text-orange-500" />;
			default:
				return <Share2 className="h-4 w-4 text-gray-500" />;
		}
	};

	const getEventColor = (type: HouseholdActivityEvent["type"]) => {
		switch (type) {
			case "member_joined":
				return "bg-blue-100 text-blue-800";
			case "account_shared":
				return "bg-green-100 text-green-800";
			case "transaction_shared":
				return "bg-purple-100 text-purple-800";
			case "large_transaction":
				return "bg-orange-100 text-orange-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getEventLabel = (type: HouseholdActivityEvent["type"]) => {
		switch (type) {
			case "member_joined":
				return "Member Joined";
			case "account_shared":
				return "Account Shared";
			case "transaction_shared":
				return "Transaction";
			case "large_transaction":
				return "Large Expense";
			default:
				return type;
		}
	};

	const loadMore = () => {
		setDisplayCount((prev) => prev + 30);
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>
						Activity Feed
						{filteredActivities.length !== activities.length && (
							<span className="text-sm font-normal text-muted-foreground ml-2">
								({filteredActivities.length} of {activities.length})
							</span>
						)}
					</CardTitle>
					<Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
						<SelectTrigger className="w-[180px]">
							<Filter className="h-4 w-4 mr-2" />
							<SelectValue placeholder="All events" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All events</SelectItem>
							<SelectItem value="member_joined">Member Joined</SelectItem>
							<SelectItem value="account_shared">Account Shared</SelectItem>
							<SelectItem value="transaction_shared">Transactions</SelectItem>
							<SelectItem value="large_transaction">Large Expenses</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
			<CardContent>
				{displayedActivities.length === 0 ? (
					<p className="text-sm text-muted-foreground text-center py-8">
						{eventTypeFilter !== "all"
							? "No activities of this type"
							: "No household activity yet"}
					</p>
				) : (
					<>
						<div className="space-y-3">
							{displayedActivities.map((activity) => (
								<div
									key={activity.id}
									className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
								>
									<div className="mt-0.5">{getEventIcon(activity.type)}</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<Badge
												className={`${getEventColor(activity.type)} text-xs`}
												variant="secondary"
											>
												{getEventLabel(activity.type)}
											</Badge>
											<span className="text-xs text-muted-foreground">
												{formatDistanceToNow(new Date(activity.timestamp), {
													addSuffix: true,
												})}
											</span>
										</div>
										<p className="text-sm">{activity.description}</p>
										{activity.metadata && (
											<div className="text-xs text-muted-foreground mt-1">
												{activity.metadata.merchant &&
													`Merchant: ${activity.metadata.merchant}`}
											</div>
										)}
									</div>
								</div>
							))}
						</div>

						{hasMore && (
							<div className="mt-4 text-center">
								<Button onClick={loadMore} variant="outline" size="sm">
									Load More ({filteredActivities.length - displayCount}{" "}
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
