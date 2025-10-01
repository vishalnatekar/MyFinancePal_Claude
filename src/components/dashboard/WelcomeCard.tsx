"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { Plus, Settings, Users } from "lucide-react";
import Link from "next/link";

export function WelcomeCard() {
	const { user, profile } = useAuthStore();

	if (!user || !profile) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="animate-pulse">
						<div className="flex items-center space-x-4 mb-4">
							<div className="w-12 h-12 bg-muted rounded-full" />
							<div className="space-y-2">
								<div className="h-4 bg-muted rounded w-32" />
								<div className="h-3 bg-muted rounded w-48" />
							</div>
						</div>
						<div className="h-8 bg-muted rounded w-full mb-4" />
						<div className="flex space-x-2">
							<div className="h-9 bg-muted rounded w-24" />
							<div className="h-9 bg-muted rounded w-32" />
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	const initials = profile.full_name
		? profile.full_name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
		: profile.email[0].toUpperCase();

	const displayName = profile.full_name?.split(" ")[0] || "there";
	const timeOfDay =
		new Date().getHours() < 12
			? "morning"
			: new Date().getHours() < 18
				? "afternoon"
				: "evening";

	return (
		<Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<Avatar className="w-12 h-12">
							<AvatarImage
								src={profile.avatar_url || undefined}
								alt="Profile picture"
							/>
							<AvatarFallback>{initials}</AvatarFallback>
						</Avatar>
						<div>
							<h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
								Good {timeOfDay}, {displayName}!
							</h2>
							<p className="text-blue-700 dark:text-blue-300">
								Welcome back to MyFinancePal
							</p>
						</div>
					</div>
					<Button asChild variant="outline" size="sm">
						<Link href="/profile">
							<Settings className="w-4 h-4 mr-2" />
							Settings
						</Link>
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
					<h3 className="font-semibold mb-2">Quick Actions</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
						<Button
							asChild
							variant="outline"
							size="sm"
							className="justify-start"
						>
							<Link href="/accounts/connect">
								<Plus className="w-4 h-4 mr-2" />
								Add Bank Account
							</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							size="sm"
							className="justify-start"
						>
							<Link href="/household/create">
								<Users className="w-4 h-4 mr-2" />
								Create Household
							</Link>
						</Button>
					</div>
				</div>
				<div className="text-sm text-blue-700 dark:text-blue-300">
					Start by connecting your accounts or setting up a household to track
					shared expenses.
				</div>
			</CardContent>
		</Card>
	);
}
