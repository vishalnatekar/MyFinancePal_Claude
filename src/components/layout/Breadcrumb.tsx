"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
	label: string;
	href: string;
}

const pathLabels: Record<string, string> = {
	"/": "Dashboard",
	"/profile": "Profile",
	"/settings": "Settings",
	"/finances": "My Finances",
	"/household": "Household",
	"/household/create": "Create Household",
	"/reports": "Reports",
	"/accounts": "Accounts",
};

export function Breadcrumb() {
	const pathname = usePathname();

	// Generate breadcrumb items from pathname
	const generateBreadcrumbs = (): BreadcrumbItem[] => {
		const segments = pathname.split("/").filter(Boolean);
		const breadcrumbs: BreadcrumbItem[] = [];

		// Always start with Dashboard, but only if we're not already on dashboard
		if (pathname !== "/") {
			breadcrumbs.push({ label: "Dashboard", href: "/" });
		}

		let currentPath = "";
		for (const segment of segments) {
			currentPath += `/${segment}`;
			const label =
				pathLabels[currentPath] ||
				segment.charAt(0).toUpperCase() + segment.slice(1);

			breadcrumbs.push({
				label,
				href: currentPath,
			});
		}

		// Don't show breadcrumb if we're on the dashboard
		if (pathname === "/") {
			return [];
		}

		return breadcrumbs;
	};

	const breadcrumbs = generateBreadcrumbs();

	if (breadcrumbs.length === 0) {
		return null;
	}

	return (
		<nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
			<Link
				href="/"
				className="flex items-center hover:text-foreground transition-colors"
			>
				<Home className="w-4 h-4" />
			</Link>

			{breadcrumbs.map((item, index) => {
				const isLast = index === breadcrumbs.length - 1;

				return (
					<div key={item.href} className="flex items-center space-x-2">
						<ChevronRight className="w-4 h-4" />
						{isLast ? (
							<span className="font-medium text-foreground">{item.label}</span>
						) : (
							<Link
								href={item.href}
								className="hover:text-foreground transition-colors"
							>
								{item.label}
							</Link>
						)}
					</div>
				);
			})}
		</nav>
	);
}
