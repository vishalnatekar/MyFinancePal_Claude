"use client";

import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { UserPreferences } from "@/components/profile/UserPreferences";
import { UserProfile } from "@/components/profile/UserProfile";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
	return (
		<div className="space-y-6">
			<Breadcrumb />

			<div>
				<h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
				<p className="text-muted-foreground">
					Manage your account settings and preferences
				</p>
			</div>

			<Separator />

			<div className="grid gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Profile Information</CardTitle>
						<CardDescription>
							Your account details from Google authentication
						</CardDescription>
					</CardHeader>
					<CardContent>
						<UserProfile />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Preferences</CardTitle>
						<CardDescription>
							Customize your notification and display preferences
						</CardDescription>
					</CardHeader>
					<CardContent>
						<UserPreferences />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
