"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, CreditCard, Plus } from "lucide-react";
import { useState } from "react";
import { InstitutionSelector } from "./InstitutionSelector";
import { ManualAccountForm } from "./ManualAccountForm";

interface ConnectAccountButtonProps {
	className?: string;
	variant?:
		| "default"
		| "outline"
		| "secondary"
		| "ghost"
		| "link"
		| "destructive";
	size?: "default" | "sm" | "lg" | "icon";
}

export function ConnectAccountButton({
	className,
	variant = "default",
	size = "default",
}: ConnectAccountButtonProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [view, setView] = useState<"selection" | "connect" | "manual">(
		"selection",
	);

	console.log(
		"ConnectAccountButton render - isDialogOpen:",
		isDialogOpen,
		"view:",
		view,
	);

	const handleConnectionSuccess = () => {
		setIsDialogOpen(false);
		setView("selection");
		// Optionally trigger a refresh of the accounts list
		window.location.reload();
	};

	const handleConnectionError = (error: string) => {
		console.error("Connection error:", error);
		// Handle error (show toast, etc.)
	};

	const handleDialogClose = () => {
		setIsDialogOpen(false);
		setTimeout(() => setView("selection"), 200); // Delay to prevent flickering
	};

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<Button
					variant={variant}
					size={size}
					className={className}
					onClick={() => {
						console.log("Add Account button clicked!");
					}}
				>
					<Plus className="h-4 w-4 mr-2" />
					Add Account
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px]">
				{view === "selection" && (
					<>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<Plus className="h-5 w-5" />
								Add an Account
							</DialogTitle>
							<DialogDescription>
								Choose how you'd like to add your account. You can connect
								automatically or add it manually.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<Button
									variant="outline"
									className="h-24 flex flex-col items-center justify-center space-y-2"
									onClick={() => setView("connect")}
								>
									<CreditCard className="h-8 w-8" />
									<div className="text-center">
										<div className="font-medium">Connect Bank</div>
										<div className="text-xs text-muted-foreground">
											Automatic sync
										</div>
									</div>
								</Button>
								<Button
									variant="outline"
									className="h-24 flex flex-col items-center justify-center space-y-2"
									onClick={() => setView("manual")}
								>
									<Building2 className="h-8 w-8" />
									<div className="text-center">
										<div className="font-medium">Add Manually</div>
										<div className="text-xs text-muted-foreground">
											Manual entry
										</div>
									</div>
								</Button>
							</div>
							<div className="text-xs text-muted-foreground text-center pt-2">
								🔒 All account data is encrypted and secure
							</div>
						</div>
					</>
				)}

				{view === "connect" && (
					<>
						<DialogHeader>
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setView("selection")}
								>
									← Back
								</Button>
							</div>
							<DialogTitle className="flex items-center gap-2">
								<CreditCard className="h-5 w-5" />
								Connect Your Bank Account
							</DialogTitle>
							<DialogDescription>
								Connect your bank or investment account to automatically import
								your financial data. Your data is encrypted and secure.
							</DialogDescription>
						</DialogHeader>
						<InstitutionSelector
							onConnectionSuccess={handleConnectionSuccess}
							onConnectionError={handleConnectionError}
						/>
					</>
				)}

				{view === "manual" && (
					<>
						<DialogHeader>
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setView("selection")}
								>
									← Back
								</Button>
							</div>
						</DialogHeader>
						<ManualAccountForm
							onSuccess={handleConnectionSuccess}
							onCancel={() => setView("selection")}
						/>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
