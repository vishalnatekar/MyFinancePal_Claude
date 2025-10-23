"use client";

import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/types/transaction";
import { Split, User, Users } from "lucide-react";

interface CategoryIndicatorProps {
	transaction: Transaction;
	size?: "sm" | "md" | "lg";
}

export function CategoryIndicator({
	transaction,
	size = "md",
}: CategoryIndicatorProps) {
	const iconSize = {
		sm: 12,
		md: 14,
		lg: 16,
	}[size];

	// Check if transaction is split
	if (transaction.split_details) {
		return (
			<Badge
				variant="outline"
				className="bg-purple-100 text-purple-800 border-purple-200"
			>
				<Split className="mr-1" size={iconSize} />
				<span>Split</span>
			</Badge>
		);
	}

	// Check if shared
	if (transaction.is_shared_expense) {
		return (
			<Badge
				variant="outline"
				className="bg-blue-100 text-blue-800 border-blue-200"
			>
				<Users className="mr-1" size={iconSize} />
				<span>Shared</span>
			</Badge>
		);
	}

	// Personal
	return (
		<Badge
			variant="outline"
			className="bg-gray-100 text-gray-800 border-gray-200"
		>
			<User className="mr-1" size={iconSize} />
			<span>Personal</span>
		</Badge>
	);
}
