"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Loader2, Lock, Users, X } from "lucide-react";
import { useState } from "react";

interface BulkTransactionSharingControlsProps {
	selectedTransactionIds: string[];
	households: Array<{ id: string; name: string }>;
	onClearSelection: () => void;
	onComplete: () => void;
}

export function BulkTransactionSharingControls({
	selectedTransactionIds,
	households,
	onClearSelection,
	onComplete,
}: BulkTransactionSharingControlsProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [pendingAction, setPendingAction] = useState<{
		householdId: string | null;
		householdName: string;
		isShared: boolean;
	} | null>(null);

	const handleBulkShare = async (
		householdId: string,
		householdName: string,
	) => {
		setPendingAction({
			householdId,
			householdName,
			isShared: true,
		});
		setShowConfirmDialog(true);
	};

	const handleBulkUnshare = () => {
		setPendingAction({
			householdId: null,
			householdName: "",
			isShared: false,
		});
		setShowConfirmDialog(true);
	};

	const executeAction = async () => {
		if (!pendingAction) return;

		setIsLoading(true);
		setShowConfirmDialog(false);

		try {
			const result = await transactionSharingService.bulkUpdateSharing({
				transaction_ids: selectedTransactionIds,
				household_id: pendingAction.householdId,
				is_shared: pendingAction.isShared,
			});

			if (result.failed_count > 0) {
				console.error("Some transactions failed:", result.errors);
				alert(
					`Completed with ${result.success_count} successful and ${result.failed_count} failed. Check console for details.`,
				);
			} else {
				alert(`Successfully updated ${result.success_count} transactions!`);
			}

			onComplete();
			onClearSelection();
		} catch (error) {
			console.error("Bulk sharing operation failed:", error);
			alert(
				`Failed to update transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			setIsLoading(false);
			setPendingAction(null);
		}
	};

	const cancelAction = () => {
		setShowConfirmDialog(false);
		setPendingAction(null);
	};

	if (selectedTransactionIds.length === 0) {
		return null;
	}

	return (
		<>
			<div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg px-4 py-3 flex items-center gap-4 z-50">
				<span className="text-sm font-medium">
					{selectedTransactionIds.length} transaction
					{selectedTransactionIds.length > 1 ? "s" : ""} selected
				</span>

				{households.length > 0 && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button size="sm" disabled={isLoading}>
								{isLoading ? (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								) : (
									<Users className="h-4 w-4 mr-2" />
								)}
								Share with...
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>Select Household</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{households.map((household) => (
								<DropdownMenuItem
									key={household.id}
									onClick={() => handleBulkShare(household.id, household.name)}
									disabled={isLoading}
								>
									<Users className="h-4 w-4 mr-2" />
									{household.name}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				)}

				<Button
					variant="outline"
					size="sm"
					onClick={handleBulkUnshare}
					disabled={isLoading}
				>
					{isLoading ? (
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
					) : (
						<Lock className="h-4 w-4 mr-2" />
					)}
					Make Private
				</Button>

				<Button
					variant="ghost"
					size="sm"
					onClick={onClearSelection}
					disabled={isLoading}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{pendingAction?.isShared ? "Share Transactions" : "Make Private"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingAction?.isShared
								? `Share ${selectedTransactionIds.length} transaction${selectedTransactionIds.length > 1 ? "s" : ""} with ${pendingAction.householdName}?`
								: `Make ${selectedTransactionIds.length} transaction${selectedTransactionIds.length > 1 ? "s" : ""} private?`}
							<br />
							<br />
							This action will update the sharing status for all selected
							transactions.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={cancelAction}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={executeAction}>
							Confirm
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
