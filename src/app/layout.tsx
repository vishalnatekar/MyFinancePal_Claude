import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthInitializer } from "@/components/providers/AuthInitializer";

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
					<QueryProvider>{children}</QueryProvider>
				</AuthInitializer>
			</body>
		</html>
	);
}
