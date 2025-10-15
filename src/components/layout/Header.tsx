"use client";

import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import { LogOut, Menu, Settings, User } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
	onMenuClick: () => void;
	sidebarOpen: boolean;
}

export function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
	const { user, profile, signOut } = useAuthStore();

	const initials = profile?.full_name
		? profile.full_name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
		: profile?.email[0].toUpperCase() || "U";

	const handleSignOut = async () => {
		await signOut();
	};

	return (
		<header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
			<div className="flex h-16 items-center justify-between px-4 md:px-6">
				<div className="flex items-center space-x-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={onMenuClick}
						className="md:hidden"
					>
						<Menu className="w-5 h-5" />
					</Button>

					<div className="hidden md:flex items-center space-x-2">
						<h1 className="text-xl font-bold text-primary">MyFinancePal</h1>
					</div>
				</div>

				<div className="flex items-center space-x-4">
					{user && <NotificationCenter userId={user.id} />}
					{profile && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="relative w-8 h-8 rounded-full"
								>
									<Avatar className="w-8 h-8">
										<AvatarImage
											src={profile.avatar_url || undefined}
											alt="Profile picture"
										/>
										<AvatarFallback>{initials}</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56" align="end" forceMount>
								<div className="flex items-center justify-start gap-2 p-2">
									<div className="flex flex-col space-y-1 leading-none">
										{profile.full_name && (
											<p className="font-medium">{profile.full_name}</p>
										)}
										<p className="w-[200px] truncate text-sm text-muted-foreground">
											{profile.email}
										</p>
									</div>
								</div>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link href="/profile" className="cursor-pointer">
										<User className="mr-2 h-4 w-4" />
										<span>Profile</span>
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link href="/settings" className="cursor-pointer">
										<Settings className="mr-2 h-4 w-4" />
										<span>Settings</span>
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleSignOut}
									className="cursor-pointer"
								>
									<LogOut className="mr-2 h-4 w-4" />
									<span>Sign out</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>
		</header>
	);
}
