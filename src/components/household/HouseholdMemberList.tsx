"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { HouseholdService } from "@/services/household-service";
import type { HouseholdMemberWithProfile } from "@/types/household";
import { Crown, User, UserX } from "lucide-react";
import { useState } from "react";

interface HouseholdMemberListProps {
	members: HouseholdMemberWithProfile[];
	currentUserId?: string;
	householdId: string;
	isCurrentUserCreator?: boolean;
	onMemberRemoved?: () => void;
}

export function HouseholdMemberList({
	members,
	currentUserId,
	householdId,
	isCurrentUserCreator = false,
	onMemberRemoved,
}: HouseholdMemberListProps) {
	const [memberToRemove, setMemberToRemove] =
		useState<HouseholdMemberWithProfile | null>(null);
	const [isRemoving, setIsRemoving] = useState(false);
	const { toast } = useToast();

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

	const handleRemoveMember = async () => {
		if (!memberToRemove) return;

		setIsRemoving(true);
		try {
			await HouseholdService.removeMember(householdId, memberToRemove.user_id);
			toast({
				title: "Success",
				description: "Member removed successfully",
			});
			setMemberToRemove(null);
			onMemberRemoved?.();
		} catch (error) {
			console.error("Error removing member:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to remove member",
				variant: "destructive",
			});
		} finally {
			setIsRemoving(false);
		}
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

									{/* Show remove button only if current user is creator and target is not creator */}
									{isCurrentUserCreator && !isCreator && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setMemberToRemove(member)}
											className="text-destructive hover:text-destructive hover:bg-destructive/10"
										>
											<UserX className="h-4 w-4" />
										</Button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>

			{/* Confirmation Dialog */}
			<AlertDialog
				open={!!memberToRemove}
				onOpenChange={(open) => !open && setMemberToRemove(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Member</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove{" "}
							<span className="font-semibold">
								{memberToRemove?.profiles?.full_name ||
									memberToRemove?.profiles?.email}
							</span>{" "}
							from this household? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleRemoveMember}
							disabled={isRemoving}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isRemoving ? "Removing..." : "Remove Member"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
}
