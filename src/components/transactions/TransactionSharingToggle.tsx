"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { transactionSharingService } from "@/services/transaction-sharing-service";
import type { Transaction } from "@/types/transaction";
import { Lock, Users } from "lucide-react";
import { useState } from "react";

interface TransactionSharingToggleProps {
	transaction: Transaction;
	households: Array<{ id: string; name: string }>;
	onSharingChange?: () => void;
}

export function TransactionSharingToggle({
	transaction,
	households,
	onSharingChange,
}: TransactionSharingToggleProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleShare = async (householdId: string) => {
		setIsLoading(true);
		try {
			await transactionSharingService.updateSharing(transaction.id, {
				household_id: householdId,
				is_shared: true,
			});
			onSharingChange?.();
		} catch (error) {
			console.error("Failed to share transaction:", error);
			alert(
				`Failed to share transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleUnshare = async () => {
		setIsLoading(true);
		try {
			await transactionSharingService.updateSharing(transaction.id, {
				household_id: transaction.shared_with_household_id || null,
				is_shared: false,
			});
			onSharingChange?.();
		} catch (error) {
			console.error("Failed to unshare transaction:", error);
			alert(
				`Failed to unshare transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			setIsLoading(false);
		}
	};

	const isShared =
		transaction.is_shared_expense && transaction.shared_with_household_id;
	const currentHousehold = households.find(
		(h) => h.id === transaction.shared_with_household_id,
	);

	if (households.length === 0) {
		return (
			<Button variant="ghost" size="sm" disabled>
				<Lock className="h-4 w-4 mr-1" />
				Private
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant={isShared ? "default" : "ghost"}
					size="sm"
					disabled={isLoading}
					className={isShared ? "bg-green-500 hover:bg-green-600" : ""}
				>
					{isShared ? (
						<>
							<Users className="h-4 w-4 mr-1" />
							{currentHousehold?.name || "Shared"}
						</>
					) : (
						<>
							<Lock className="h-4 w-4 mr-1" />
							Private
						</>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Share with Household</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{households.map((household) => (
					<DropdownMenuItem
						key={household.id}
						onClick={() => handleShare(household.id)}
						disabled={isLoading}
					>
						<Users className="h-4 w-4 mr-2" />
						{household.name}
						{transaction.shared_with_household_id === household.id && " ✓"}
					</DropdownMenuItem>
				))}
				{isShared && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleUnshare}
							disabled={isLoading}
							className="text-destructive"
						>
							<Lock className="h-4 w-4 mr-2" />
							Make Private
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
