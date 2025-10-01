"use client";

import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import React from "react";

interface AuthenticationStatusProps {
	showAvatar?: boolean;
	showName?: boolean;
	showEmail?: boolean;
	onSignOut?: () => void;
	className?: string;
}

export function AuthenticationStatus({
	showAvatar = true,
	showName = true,
	showEmail = false,
	onSignOut,
	className,
}: AuthenticationStatusProps) {
	const { user, profile, loading, signOut } = useAuth();

	const handleSignOut = async () => {
		if (onSignOut) {
			onSignOut();
		} else {
			await signOut();
		}
	};

	if (loading) {
		return (
			<div className={cn("flex items-center space-x-2", className)}>
				<div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
				<div className="space-y-1">
					<div className="h-4 w-20 animate-pulse bg-muted" />
					{showEmail && <div className="h-3 w-24 animate-pulse bg-muted" />}
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className={cn("text-sm text-muted-foreground", className)}>
				Not signed in
			</div>
		);
	}

	return (
		<div className={cn("flex items-center space-x-3", className)}>
			{showAvatar && (
				<div className="relative">
					{profile?.avatar_url ? (
						<img
							src={profile.avatar_url}
							alt={profile.full_name || user.email || "User avatar"}
							className="h-8 w-8 rounded-full object-cover"
						/>
					) : (
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
							{(profile?.full_name || user.email || "U")
								.charAt(0)
								.toUpperCase()}
						</div>
					)}
					<div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
				</div>
			)}

			<div className="flex flex-col">
				{showName && (
					<span className="text-sm font-medium">
						{profile?.full_name || user.email?.split("@")[0] || "User"}
					</span>
				)}
				{showEmail && user.email && (
					<span className="text-xs text-muted-foreground">{user.email}</span>
				)}
			</div>

			<button
				type="button"
				onClick={handleSignOut}
				className="text-xs text-muted-foreground hover:text-foreground transition-colors"
			>
				Sign out
			</button>
		</div>
	);
}
