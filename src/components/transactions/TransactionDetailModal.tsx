"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/currency-utils";
import { TransactionService } from "@/services/transaction-service";
import type {
	Transaction,
	TransactionCategory,
	TransactionUpdateData,
} from "@/types/transaction";
import { format } from "date-fns";
import { Pencil, Save, X } from "lucide-react";
import { useState } from "react";

interface TransactionDetailModalProps {
	transaction: Transaction | null;
	open: boolean;
	onClose: () => void;
	onUpdate: (transaction: Transaction) => void;
}

const CATEGORIES: TransactionCategory[] = [
	"groceries",
	"utilities",
	"entertainment",
	"transport",
	"dining",
	"shopping",
	"healthcare",
	"housing",
	"income",
	"transfer",
	"other",
];

/**
 * Modal for viewing and editing transaction details
 */
export function TransactionDetailModal({
	transaction,
	open,
	onClose,
	onUpdate,
}: TransactionDetailModalProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedData, setEditedData] = useState<TransactionUpdateData>({});
	const [error, setError] = useState<string | null>(null);

	if (!transaction) return null;

	const handleEdit = () => {
		setIsEditing(true);
		setEditedData({
			merchant_name: transaction.merchant_name,
			category: transaction.category as TransactionCategory,
			description: transaction.description || "",
		});
		setError(null);
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditedData({});
		setError(null);
	};

	const handleSave = async () => {
		try {
			setIsSaving(true);
			setError(null);

			const updatedTransaction = await TransactionService.updateTransaction(
				transaction.id,
				editedData,
			);

			onUpdate(updatedTransaction);
			setIsEditing(false);
			setEditedData({});
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to update transaction",
			);
		} finally {
			setIsSaving(false);
		}
	};

	const isIncome = transaction.amount > 0;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Transaction Details</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Amount */}
					<div>
						<Label className="text-sm text-gray-600">Amount</Label>
						<div
							className={`text-3xl font-bold ${
								isIncome ? "text-green-600" : "text-gray-900"
							}`}
						>
							{isIncome ? "+" : ""}
							{formatCurrency(Math.abs(transaction.amount), "GBP")}
						</div>
					</div>

					{/* Merchant Name */}
					<div>
						<Label htmlFor="merchant_name">Merchant</Label>
						{isEditing ? (
							<Input
								id="merchant_name"
								value={editedData.merchant_name || ""}
								onChange={(e) =>
									setEditedData({
										...editedData,
										merchant_name: e.target.value,
									})
								}
								placeholder="Merchant name"
							/>
						) : (
							<div className="text-lg font-medium mt-1">
								{transaction.merchant_name || "Unknown"}
							</div>
						)}
					</div>

					{/* Category */}
					<div>
						<Label htmlFor="category">Category</Label>
						{isEditing ? (
							<Select
								value={editedData.category}
								onValueChange={(value) =>
									setEditedData({
										...editedData,
										category: value as TransactionCategory,
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									{CATEGORIES.map((category) => (
										<SelectItem key={category} value={category}>
											<span className="capitalize">{category}</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<div className="mt-1">
								<span className="inline-block px-3 py-1 text-sm rounded-full capitalize bg-gray-100 text-gray-800">
									{transaction.category}
								</span>
							</div>
						)}
					</div>

					{/* Description */}
					<div>
						<Label htmlFor="description">Description</Label>
						{isEditing ? (
							<Textarea
								id="description"
								value={editedData.description || ""}
								onChange={(e) =>
									setEditedData({ ...editedData, description: e.target.value })
								}
								placeholder="Add a note about this transaction"
								rows={3}
							/>
						) : (
							<div className="text-gray-700 mt-1">
								{transaction.description || "No description"}
							</div>
						)}
					</div>

					{/* Date */}
					<div>
						<Label className="text-sm text-gray-600">Date</Label>
						<div className="text-gray-900 mt-1">
							{format(new Date(transaction.date), "EEEE, MMMM dd, yyyy")}
						</div>
					</div>

					{/* Manual Override Badge */}
					{transaction.manual_override && (
						<div className="flex items-center gap-2 text-sm text-blue-600">
							<Pencil className="h-4 w-4" />
							<span>This transaction has been manually edited</span>
						</div>
					)}

					{/* Error message */}
					{error && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
							{error}
						</div>
					)}
				</div>

				<DialogFooter>
					{isEditing ? (
						<>
							<Button
								variant="outline"
								onClick={handleCancel}
								disabled={isSaving}
							>
								<X className="h-4 w-4 mr-2" />
								Cancel
							</Button>
							<Button onClick={handleSave} disabled={isSaving}>
								<Save className="h-4 w-4 mr-2" />
								{isSaving ? "Saving..." : "Save Changes"}
							</Button>
						</>
					) : (
						<>
							<Button variant="outline" onClick={onClose}>
								Close
							</Button>
							<Button onClick={handleEdit}>
								<Pencil className="h-4 w-4 mr-2" />
								Edit
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
