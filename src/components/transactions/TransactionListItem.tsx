"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/currency-utils";
import type { Transaction } from "@/types/transaction";
import { format } from "date-fns";
import { Lock, Users } from "lucide-react";
import { TransactionSharingToggle } from "./TransactionSharingToggle";

interface TransactionListItemProps {
	transaction: Transaction;
	onEdit: (transaction: Transaction) => void;
	accountName?: string;
	showSharing?: boolean;
	households?: Array<{ id: string; name: string }>;
	onChange?: () => void;
	selectable?: boolean;
	selected?: boolean;
	onToggleSelect?: (transactionId: string) => void;
}

/**
 * Individual transaction list item component
 */
export function TransactionListItem({
	transaction,
	onEdit,
	accountName,
	showSharing = false,
	households = [],
	onChange,
	selectable = false,
	selected = false,
	onToggleSelect,
}: TransactionListItemProps) {
	const isIncome = transaction.amount > 0;
	const isShared =
		transaction.is_shared_expense && transaction.shared_with_household_id;
	const currentHousehold = households.find(
		(h) => h.id === transaction.shared_with_household_id,
	);

	const handleClick = (e: React.MouseEvent) => {
		// Don't trigger edit if clicking on checkbox or sharing toggle
		const target = e.target as HTMLElement;
		if (
			target.closest("[data-checkbox]") ||
			target.closest("[data-sharing-toggle]")
		) {
			return;
		}
		onEdit(transaction);
	};

	return (
		<div className="flex items-center gap-3 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
			{/* Checkbox for bulk selection */}
			{selectable && (
				<div data-checkbox onPointerDown={(e) => e.stopPropagation()}>
					<Checkbox
						checked={selected}
						onCheckedChange={() => onToggleSelect?.(transaction.id)}
					/>
				</div>
			)}

			<button
				type="button"
				onClick={handleClick}
				className="flex-1 min-w-0 text-left"
			>
				<div className="flex items-center gap-2">
					<span className="font-medium text-gray-900 truncate">
						{transaction.merchant_name ||
							transaction.description ||
							"Unknown Merchant"}
					</span>
					{transaction.manual_override && (
						<span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
							Edited
						</span>
					)}
					{/* Sharing status badge */}
					{showSharing && (
						<Badge
							variant={isShared ? "default" : "secondary"}
							className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${
								isShared
									? "bg-primary/15 text-primary hover:bg-primary/20"
									: "bg-muted/70 text-muted-foreground hover:bg-muted/80"
							}`}
						>
							{isShared ? (
								<>
									<Users className="mr-1 h-3 w-3" />
									<span>
										Shared
										{currentHousehold?.name
											? ` (${currentHousehold.name})`
											: ""}
									</span>
								</>
							) : (
								<>
									<Lock className="mr-1 h-3 w-3" />
									Private
								</>
							)}
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-2 mt-1">
					<span
						className={`px-2 py-0.5 text-xs rounded-full capitalize ${getCategoryColor(
							transaction.category,
						)}`}
					>
						{transaction.category || "other"}
					</span>
					<span className="text-sm text-gray-500">
						{format(new Date(transaction.date), "MMM dd, yyyy")}
					</span>
					{accountName && (
						<span className="text-xs text-gray-400">• {accountName}</span>
					)}
				</div>
				{transaction.description && transaction.merchant_name && (
					<p className="text-sm text-gray-600 mt-1 truncate">
						{transaction.description}
					</p>
				)}
			</button>

			{/* Sharing toggle */}
			{showSharing && households.length > 0 && (
				<div data-sharing-toggle onPointerDown={(e) => e.stopPropagation()}>
					<TransactionSharingToggle
						transaction={transaction}
						households={households}
						onChange={onChange}
					/>
				</div>
			)}

			{/* Amount */}
			<div className="ml-4 text-right">
				<span
					className={`text-lg font-semibold ${
						isIncome ? "text-green-600" : "text-gray-900"
					}`}
				>
					{isIncome ? "+" : ""}
					{formatCurrency(Math.abs(transaction.amount), "GBP")}
				</span>
			</div>
		</div>
	);
}

function getCategoryColor(category: string): string {
	const colors: Record<string, string> = {
		groceries: "bg-green-100 text-green-800",
		utilities: "bg-blue-100 text-blue-800",
		entertainment: "bg-purple-100 text-purple-800",
		transport: "bg-yellow-100 text-yellow-800",
		dining: "bg-orange-100 text-orange-800",
		shopping: "bg-pink-100 text-pink-800",
		healthcare: "bg-red-100 text-red-800",
		housing: "bg-indigo-100 text-indigo-800",
		income: "bg-green-100 text-green-800",
		transfer: "bg-gray-100 text-gray-800",
		other: "bg-gray-100 text-gray-800",
	};

	return colors[category] || colors.other;
}
