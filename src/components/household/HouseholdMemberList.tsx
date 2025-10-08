"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { HouseholdMemberWithProfile } from "@/types/household";
import { Crown, User } from "lucide-react";

interface HouseholdMemberListProps {
	members: HouseholdMemberWithProfile[];
	currentUserId?: string;
}

export function HouseholdMemberList({
	members,
	currentUserId,
}: HouseholdMemberListProps) {
	const getInitials = (name: string | null, email: string) => {
		if (name) {
			return name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2);
		}
		return email.slice(0, 2).toUpperCase();
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Household Members</CardTitle>
				<CardDescription>
					{members.length} {members.length === 1 ? "member" : "members"}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{members.map((member) => {
						const profile = member.profiles;
						const isCurrentUser = member.user_id === currentUserId;
						const isCreator = member.role === "creator";

						return (
							<div
								key={member.id}
								className="flex items-center justify-between p-3 rounded-lg border"
							>
								<div className="flex items-center space-x-3">
									<Avatar>
										<AvatarImage
											src={profile?.avatar_url || undefined}
											alt={profile?.full_name || profile?.email || "User"}
										/>
										<AvatarFallback>
											{profile
												? getInitials(profile.full_name, profile.email)
												: "??"}
										</AvatarFallback>
									</Avatar>

									<div className="space-y-1">
										<div className="flex items-center space-x-2">
											<p className="text-sm font-medium leading-none">
												{profile?.full_name || profile?.email || "Unknown User"}
												{isCurrentUser && (
													<span className="ml-2 text-xs text-muted-foreground">
														(You)
													</span>
												)}
											</p>
										</div>
										{profile?.full_name && (
											<p className="text-sm text-muted-foreground">
												{profile.email}
											</p>
										)}
										<p className="text-xs text-muted-foreground">
											Joined {new Date(member.joined_at).toLocaleDateString()}
										</p>
									</div>
								</div>

								<div className="flex items-center space-x-2">
									{isCreator ? (
										<Badge
											variant="default"
											className="flex items-center gap-1"
										>
											<Crown className="h-3 w-3" />
											Creator
										</Badge>
									) : (
										<Badge
											variant="secondary"
											className="flex items-center gap-1"
										>
											<User className="h-3 w-3" />
											Member
										</Badge>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
