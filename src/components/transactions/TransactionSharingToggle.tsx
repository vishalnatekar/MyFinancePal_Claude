"use client";

import { Button } from "@/components/ui/button";
import { transactionSharingService } from "@/services/transaction-sharing-service";
import type { Transaction } from "@/types/transaction";
import { Lock, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TransactionSharingToggleProps {
	transaction: Transaction;
	households: Array<{ id: string; name: string }>;
	onChange?: () => void;
	/**
	 * @deprecated Use onChange instead
	 */
	onSharingChange?: () => void;
}

export function TransactionSharingToggle({
	transaction,
	households,
	onChange,
	onSharingChange,
}: TransactionSharingToggleProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const handleChange = onChange ?? onSharingChange;

	useEffect(() => {
		if (!open) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (!containerRef.current) return;
			if (!containerRef.current.contains(event.target as Node)) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [open]);

	const handleShare = async (householdId: string) => {
		setIsLoading(true);
		try {
			await transactionSharingService.updateSharing(transaction.id, {
				household_id: householdId,
				is_shared: true,
			});
			handleChange?.();
			setOpen(false);
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
				household_id: null,
				is_shared: false,
			});
			handleChange?.();
			setOpen(false);
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
		return null;
	}

	return (
		<div ref={containerRef} className="relative inline-block text-left">
			<Button
				variant={isShared ? "default" : "ghost"}
				size="sm"
				disabled={isLoading}
				onClick={() => setOpen((prev) => !prev)}
				className={isShared ? "bg-green-500 hover:bg-green-600" : ""}
			>
				{isShared ? (
					<>
						<Users className="h-4 w-4 mr-1" />
						<span>Shared</span>
						{currentHousehold?.name && (
							<span className="ml-1 text-xs text-muted-foreground">
								{currentHousehold.name}
							</span>
						)}
					</>
				) : (
					<>
						<Lock className="h-4 w-4 mr-1" />
						Private
					</>
				)}
			</Button>
			{open && (
				<div className="absolute right-0 z-10 mt-2 w-52 rounded-md border bg-popover shadow-lg">
					<div className="px-3 py-2 text-sm font-semibold">
						Share with Household
					</div>
					<div className="py-1">
						{households.map((household) => (
							<button
								key={household.id}
								type="button"
								onClick={() => handleShare(household.id)}
								disabled={isLoading}
								className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
							>
								<Users className="h-4 w-4" />
								<span className="flex-1">{household.name}</span>
								{transaction.shared_with_household_id === household.id && "✓"}
							</button>
						))}
						{isShared && (
							<>
								<div className="my-1 h-px bg-border" />
								<button
									type="button"
									onClick={handleUnshare}
									disabled={isLoading}
									className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
								>
									<Lock className="h-4 w-4" />
									<span>Make Private</span>
								</button>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
