"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { Calendar, Mail, User } from "lucide-react";

export function UserProfile() {
	const { user, profile } = useAuthStore();

	if (!user || !profile) {
		return (
			<div className="flex items-center space-x-4">
				<div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
				<div className="space-y-2">
					<div className="h-4 bg-muted rounded animate-pulse w-32" />
					<div className="h-3 bg-muted rounded animate-pulse w-48" />
				</div>
			</div>
		);
	}

	const initials = profile.full_name
		? profile.full_name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
		: profile.email[0].toUpperCase();

	const joinedDate = new Date(profile.created_at).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center space-x-4">
				<Avatar className="w-16 h-16">
					<AvatarImage
						src={profile.avatar_url || undefined}
						alt="Profile picture"
					/>
					<AvatarFallback className="text-lg">{initials}</AvatarFallback>
				</Avatar>
				<div className="space-y-1">
					<div className="flex items-center space-x-2">
						<h2 className="text-2xl font-semibold">
							{profile.full_name || "No name provided"}
						</h2>
						<Badge variant="secondary" className="text-xs">
							Google Account
						</Badge>
					</div>
					<p className="text-muted-foreground flex items-center space-x-1">
						<Mail className="w-4 h-4" />
						<span>{profile.email}</span>
					</p>
				</div>
			</div>

			<Separator />

			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<div className="flex items-center space-x-2 text-sm font-medium">
						<User className="w-4 h-4 text-muted-foreground" />
						<span>Display Name</span>
					</div>
					<p className="text-sm text-muted-foreground ml-6">
						{profile.full_name || "Not provided"}
					</p>
				</div>

				<div className="space-y-2">
					<div className="flex items-center space-x-2 text-sm font-medium">
						<Calendar className="w-4 h-4 text-muted-foreground" />
						<span>Member Since</span>
					</div>
					<p className="text-sm text-muted-foreground ml-6">{joinedDate}</p>
				</div>

				<div className="space-y-2">
					<div className="flex items-center space-x-2 text-sm font-medium">
						<Mail className="w-4 h-4 text-muted-foreground" />
						<span>Email Address</span>
					</div>
					<p className="text-sm text-muted-foreground ml-6">{profile.email}</p>
				</div>

				<div className="space-y-2">
					<div className="flex items-center space-x-2 text-sm font-medium">
						<User className="w-4 h-4 text-muted-foreground" />
						<span>Account ID</span>
					</div>
					<p className="text-sm text-muted-foreground ml-6 font-mono text-xs">
						{user.id.slice(0, 8)}...{user.id.slice(-8)}
					</p>
				</div>
			</div>
		</div>
	);
}
