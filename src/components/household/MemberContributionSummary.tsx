"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency-utils";
import type { HouseholdMemberWithStats } from "@/types/household";

interface MemberContributionSummaryProps {
	members: HouseholdMemberWithStats[];
}

export function MemberContributionSummary({
	members,
}: MemberContributionSummaryProps) {
	// Calculate total contributions for percentage calculation
	const totalContributions = members.reduce(
		(sum, member) => sum + member.total_contribution,
		0,
	);

	// Sort members by contribution (highest first)
	const sortedMembers = [...members].sort(
		(a, b) => b.total_contribution - a.total_contribution,
	);

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Member Contributions</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{sortedMembers.map((member) => {
						const percentage =
							totalContributions > 0
								? (member.total_contribution / totalContributions) * 100
								: 0;

						return (
							<div key={member.id} className="space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Avatar className="h-8 w-8">
											<AvatarImage src={member.avatar_url} alt={member.name} />
											<AvatarFallback>
												{getInitials(member.name)}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="text-sm font-medium">{member.name}</p>
											<p className="text-xs text-muted-foreground">
												{member.shared_transactions_count} shared expense
												{member.shared_transactions_count !== 1 ? "s" : ""}
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="text-sm font-semibold">
											{formatCurrency(member.total_contribution)}
										</p>
										{totalContributions > 0 && (
											<p className="text-xs text-muted-foreground">
												{percentage.toFixed(1)}%
											</p>
										)}
									</div>
								</div>

								{/* Progress bar */}
								{totalContributions > 0 && (
									<div className="w-full bg-secondary rounded-full h-2">
										<div
											className="bg-primary rounded-full h-2 transition-all"
											style={{ width: `${percentage}%` }}
										/>
									</div>
								)}
							</div>
						);
					})}

					{members.length === 0 && (
						<p className="text-sm text-muted-foreground text-center py-4">
							No member contributions yet
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
