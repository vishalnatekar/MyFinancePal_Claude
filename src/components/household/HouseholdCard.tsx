"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { HouseholdWithMembers } from "@/types/household";
import { Calendar, Users } from "lucide-react";
import Link from "next/link";

interface HouseholdCardProps {
	household: HouseholdWithMembers;
	userRole?: "creator" | "member";
}

export function HouseholdCard({ household, userRole }: HouseholdCardProps) {
	const memberCount = household.household_members?.length || 0;

	return (
		<Card className="hover:shadow-lg transition-shadow">
			<CardHeader>
				<div className="flex justify-between items-start">
					<div className="space-y-1">
						<CardTitle className="text-xl">{household.name}</CardTitle>
						{household.description && (
							<CardDescription>{household.description}</CardDescription>
						)}
					</div>
					{userRole && (
						<Badge variant={userRole === "creator" ? "default" : "secondary"}>
							{userRole === "creator" ? "Creator" : "Member"}
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="flex items-center text-sm text-muted-foreground">
						<Users className="mr-2 h-4 w-4" />
						<span>
							{memberCount} {memberCount === 1 ? "member" : "members"}
						</span>
					</div>

					<div className="flex items-center text-sm text-muted-foreground">
						<Calendar className="mr-2 h-4 w-4" />
						<span>Settlement day: {household.settlement_day}</span>
					</div>

					<div className="pt-2">
						<Link href={`/household/${household.id}`}>
							<Button variant="outline" className="w-full">
								View Household
							</Button>
						</Link>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
