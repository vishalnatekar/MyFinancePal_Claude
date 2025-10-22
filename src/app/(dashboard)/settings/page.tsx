"use client";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bell, HelpCircle, Settings, Shield, User } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
	const settingsCategories = [
		{
			title: "Profile Settings",
			description: "Manage your personal information and preferences",
			icon: User,
			href: "/profile",
			available: true,
		},
		{
			title: "Notifications",
			description: "Configure email and notification preferences",
			icon: Bell,
			href: "/profile#preferences",
			available: true,
		},
		{
			title: "Privacy & Security",
			description: "Manage your privacy settings and account security",
			icon: Shield,
			href: "/settings/security",
			available: false,
		},
		{
			title: "Help & Support",
			description: "Get help and contact support",
			icon: HelpCircle,
			href: "/settings/help",
			available: false,
		},
	];

	return (
		<div className="space-y-6">
			<Breadcrumb />

			<div>
				<h1 className="text-3xl font-bold tracking-tight">Settings</h1>
				<p className="text-muted-foreground">
					Manage your account settings and application preferences
				</p>
			</div>

			<Separator />

			<div className="grid gap-4 md:grid-cols-2">
				{settingsCategories.map((category) => (
					<Card key={category.title} className="relative">
						<CardHeader className="pb-3">
							<div className="flex items-center space-x-2">
								<category.icon className="w-5 h-5 text-primary" />
								<CardTitle className="text-lg">{category.title}</CardTitle>
							</div>
							<CardDescription>{category.description}</CardDescription>
						</CardHeader>
						<CardContent>
							{category.available ? (
								<Button asChild variant="outline" className="w-full">
									<Link href={category.href}>Open {category.title}</Link>
								</Button>
							) : (
								<div className="space-y-2">
									<Button variant="outline" disabled className="w-full">
										Coming Soon
									</Button>
									<p className="text-xs text-muted-foreground text-center">
										This feature will be available in a future update
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Settings className="w-5 h-5" />
						<span>Application Information</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Version:</span>
							<span className="font-mono">1.3.0-dev</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Last Updated:</span>
							<span>{new Date().toLocaleDateString()}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Environment:</span>
							<span className="font-mono">Development</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
