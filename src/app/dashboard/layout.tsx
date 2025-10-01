"use client";

import { AuthErrorBoundary } from "@/components/auth/AuthErrorBoundary";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthGuard } from "@/components/ui/AuthGuard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();

	return (
		<AuthErrorBoundary>
			<AuthGuard
				fallback={
					<LoadingSpinner fullScreen text="Authenticating..." size="lg" />
				}
				redirectTo="/login"
				requireProfile={true}
			>
				<div className="min-h-screen bg-background">
					<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

					<div
						className={cn(
							"flex flex-col min-h-screen transition-all duration-300",
							"md:ml-64", // Always offset for desktop sidebar
						)}
					>
						<Header onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />

						<main className="flex-1 p-4 md:p-6">
							<div className="max-w-7xl mx-auto">{children}</div>
						</main>
					</div>
				</div>
			</AuthGuard>
		</AuthErrorBoundary>
	);
}
