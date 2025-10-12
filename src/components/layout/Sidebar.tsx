"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
	CreditCard,
	Home,
	PieChart,
	Receipt,
	Settings,
	User,
	Users,
	Wallet,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
	open: boolean;
	onClose: () => void;
	className?: string;
}

const navigation = [
	{
		name: "Dashboard",
		href: "/",
		icon: Home,
		description: "Overview and quick actions",
	},
	{
		name: "Accounts",
		href: "/accounts",
		icon: Wallet,
		description: "Connected bank and investment accounts",
	},
	{
		name: "Transactions",
		href: "/transactions",
		icon: Receipt,
		description: "View and manage transaction history",
	},
	{
		name: "My Finances",
		href: "/finances",
		icon: CreditCard,
		description: "Personal accounts and transactions",
	},
	{
		name: "Household",
		href: "/household",
		icon: Users,
		description: "Shared expenses and budgets",
	},
	{
		name: "Reports",
		href: "/reports",
		icon: PieChart,
		description: "Financial insights and analytics",
	},
];

const accountNavigation = [
	{
		name: "Profile",
		href: "/profile",
		icon: User,
	},
	{
		name: "Settings",
		href: "/settings",
		icon: Settings,
	},
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
	const pathname = usePathname();

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between p-6">
				<Link href="/" className="flex items-center space-x-2">
					<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
						<CreditCard className="w-5 h-5 text-primary-foreground" />
					</div>
					<span className="text-xl font-bold">MyFinancePal</span>
				</Link>
				{onClose && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="md:hidden"
					>
						<X className="w-5 h-5" />
					</Button>
				)}
			</div>

			<nav className="flex-1 px-4 space-y-2">
				<div className="space-y-1">
					{navigation.map((item) => {
						const isActive =
							pathname === item.href ||
							(item.href !== "/" && pathname.startsWith(item.href));

						return (
							<Button
								key={item.name}
								asChild
								variant={isActive ? "secondary" : "ghost"}
								className={cn(
									"w-full justify-start h-12",
									isActive && "bg-secondary font-medium",
								)}
								onClick={onClose}
							>
								<Link href={item.href}>
									<item.icon className="mr-3 h-5 w-5" />
									<div className="text-left">
										<div className="font-medium">{item.name}</div>
										<div className="text-xs text-muted-foreground">
											{item.description}
										</div>
									</div>
								</Link>
							</Button>
						);
					})}
				</div>

				<Separator className="my-4" />

				<div className="space-y-1">
					<div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Account
					</div>
					{accountNavigation.map((item) => {
						const isActive = pathname === item.href;

						return (
							<Button
								key={item.name}
								asChild
								variant={isActive ? "secondary" : "ghost"}
								className={cn(
									"w-full justify-start",
									isActive && "bg-secondary font-medium",
								)}
								onClick={onClose}
							>
								<Link href={item.href}>
									<item.icon className="mr-3 h-4 w-4" />
									{item.name}
								</Link>
							</Button>
						);
					})}
				</div>
			</nav>

			<div className="p-4 border-t">
				<div className="text-xs text-muted-foreground text-center">
					© 2025 MyFinancePal
				</div>
			</div>
		</div>
	);
}

export function Sidebar({ open, onClose, className }: SidebarProps) {
	return (
		<>
			{/* Desktop Sidebar */}
			<aside
				className={cn(
					"hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 md:border-r md:bg-card",
					className,
				)}
			>
				<SidebarContent />
			</aside>

			{/* Mobile Sidebar */}
			<Sheet open={open} onOpenChange={onClose}>
				<SheetContent side="left" className="p-0 w-64">
					<SidebarContent onClose={onClose} />
				</SheetContent>
			</Sheet>
		</>
	);
}
