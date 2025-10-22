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
		<div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
			<div className="flex items-center justify-between px-6 py-6">
				<Link href="/" className="flex items-center space-x-2">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sidebar-primary via-primary to-sidebar-primary shadow-lg shadow-primary/20">
						<CreditCard className="h-5 w-5 text-sidebar-primary-foreground" />
					</div>
					<div className="flex flex-col">
						<span className="text-base font-semibold leading-tight">
							MyFinancePal
						</span>
						<span className="text-xs text-sidebar-foreground/70">
							Intentional money for households
						</span>
					</div>
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

			<nav className="flex-1 space-y-6 px-4">
				<div className="space-y-1.5">
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
									"w-full justify-start rounded-xl border border-transparent bg-transparent px-3 py-3 text-left shadow-none transition hover:border-sidebar-border/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
									isActive &&
										"border-sidebar-border/80 bg-sidebar-accent/60 text-sidebar-primary shadow-sm",
								)}
								onClick={onClose}
							>
								<Link href={item.href}>
									<item.icon
										className={cn(
											"mr-3 h-5 w-5",
											isActive && "text-sidebar-primary",
										)}
									/>
									<div className="flex flex-col">
										<div className="font-medium tracking-tight">
											{item.name}
										</div>
										<div className="text-xs text-sidebar-foreground/70">
											{item.description}
										</div>
									</div>
								</Link>
							</Button>
						);
					})}
				</div>

				<Separator className="my-4" />

				<div className="space-y-2">
					<div className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
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
									"w-full justify-start rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition hover:border-sidebar-border/60 hover:bg-sidebar-accent/30",
									isActive && "border-sidebar-border/80 bg-sidebar-accent/60",
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

			<div className="border-t border-sidebar-border/60 p-6">
				<div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/30 px-4 py-3 text-xs text-sidebar-foreground/70">
					<span className="font-semibold text-sidebar-foreground">Tip:</span>{" "}
					Stay in sync by reconnecting accounts weekly for the freshest
					insights.
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
					"hidden md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col md:border-r md:border-sidebar-border/80 md:bg-sidebar",
					className,
				)}
			>
				<SidebarContent />
			</aside>

			{/* Mobile Sidebar */}
			<Sheet open={open} onOpenChange={onClose}>
				<SheetContent
					side="left"
					className="w-72 border-sidebar-border/80 bg-sidebar p-0"
				>
					<SidebarContent onClose={onClose} />
				</SheetContent>
			</Sheet>
		</>
	);
}
