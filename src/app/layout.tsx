import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { AuthInitializer } from "@/components/providers/AuthInitializer";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "MyFinancePal - Household Financial Management",
	description: "Manage shared expenses and financial tracking for households",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<AuthInitializer>
					<QueryProvider>
						{children}
						<Toaster />
					</QueryProvider>
				</AuthInitializer>
			</body>
		</html>
	);
}
