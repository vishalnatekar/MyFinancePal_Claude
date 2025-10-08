"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HouseholdService } from "@/services/household-service";
import { AlertCircle, Loader2, Mail, UserPlus } from "lucide-react";
import { useState } from "react";

interface InviteMemberModalProps {
	householdId: string;
	householdName: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onInviteSent?: () => void;
}

export function InviteMemberModal({
	householdId,
	householdName,
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
	onInviteSent,
}: InviteMemberModalProps) {
	const [internalOpen, setInternalOpen] = useState(false);
	const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
	const setOpen = controlledOnOpenChange || setInternalOpen;
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email.trim()) {
			setError("Email address is required");
			return;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError("Please enter a valid email address");
			return;
		}

		setIsLoading(true);
		setError(null);
		setSuccess(false);

		try {
			await HouseholdService.sendInvitation(householdId, email);
			setSuccess(true);
			setEmail("");

			// Close modal after success
			setTimeout(() => {
				setOpen(false);
				setSuccess(false);
				if (onInviteSent) {
					onInviteSent();
				}
			}, 1500);
		} catch (err) {
			console.error("Error sending invitation:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Failed to send invitation";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!isLoading) {
			setOpen(newOpen);
			if (!newOpen) {
				// Reset form when closing
				setEmail("");
				setError(null);
				setSuccess(false);
			}
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			{controlledOpen === undefined && (
				<DialogTrigger asChild>
					<Button>
						<UserPlus className="mr-2 h-4 w-4" />
						Invite Member
					</Button>
				</DialogTrigger>
			)}
			<DialogContent className="sm:max-w-[500px]">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Invite Member to Household</DialogTitle>
						<DialogDescription>
							Send an invitation to join <strong>{householdName}</strong>. The
							recipient will receive an email with an invitation link.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{success && (
							<Alert>
								<Mail className="h-4 w-4" />
								<AlertDescription>
									Invitation sent successfully! The recipient will receive an
									email shortly.
								</AlertDescription>
							</Alert>
						)}

						<div className="space-y-2">
							<Label htmlFor="email">
								Email Address <span className="text-destructive">*</span>
							</Label>
							<Input
								id="email"
								type="email"
								placeholder="colleague@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={isLoading || success}
								required
							/>
							<p className="text-sm text-muted-foreground">
								An invitation link will be sent to this email address.
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={isLoading || success}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading || success}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Sending...
								</>
							) : (
								<>
									<Mail className="mr-2 h-4 w-4" />
									Send Invitation
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
