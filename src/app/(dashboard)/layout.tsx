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
				requireProfile={false}
			>
				<div className="min-h-screen bg-background/80">
					<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

					<div
						className={cn(
							"flex min-h-screen flex-col transition-all duration-300",
							"md:ml-72", // Always offset for desktop sidebar
						)}
					>
						<Header onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />

						<main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-10">
							<div className="mx-auto w-full max-w-7xl space-y-8">
								{children}
							</div>
						</main>
					</div>
				</div>
			</AuthGuard>
		</AuthErrorBoundary>
	);
}
