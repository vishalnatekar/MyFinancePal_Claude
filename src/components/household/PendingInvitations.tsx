"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, Mail, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Invitation {
	id: string;
	email: string;
	status: string;
	expires_at: string;
	created_at: string;
	resend_count: number;
}

interface PendingInvitationsProps {
	householdId: string;
}

export function PendingInvitations({ householdId }: PendingInvitationsProps) {
	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	const loadInvitations = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`/api/households/${householdId}/invite`, {
				method: "GET",
			});

			if (!response.ok) {
				throw new Error("Failed to fetch invitations");
			}

			const data = await response.json();
			setInvitations(data.invitations || []);
		} catch (err) {
			console.error("Error loading invitations:", err);
			setError(
				err instanceof Error ? err.message : "Failed to load invitations",
			);
		} finally {
			setLoading(false);
		}
	}, [householdId]);

	useEffect(() => {
		void loadInvitations();
	}, [loadInvitations]);

	const handleResend = async (invitationId: string) => {
		try {
			setActionLoading(invitationId);
			setError(null);

			const response = await fetch(
				`/api/households/${householdId}/invite/${invitationId}/resend`,
				{
					method: "POST",
				},
			);

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to resend invitation");
			}

			// Reload invitations to update resend count
			await loadInvitations();
		} catch (err) {
			console.error("Error resending invitation:", err);
			setError(
				err instanceof Error ? err.message : "Failed to resend invitation",
			);
		} finally {
			setActionLoading(null);
		}
	};

	const handleDelete = async (invitationId: string) => {
		if (!confirm("Are you sure you want to cancel this invitation?")) {
			return;
		}

		try {
			setActionLoading(invitationId);
			setError(null);

			const response = await fetch(
				`/api/households/${householdId}/invite/${invitationId}`,
				{
					method: "DELETE",
				},
			);

			if (!response.ok) {
				let errorMessage = "Failed to delete invitation";
				try {
					const data = await response.json();
					errorMessage = data.error || errorMessage;
				} catch (e) {
					// Response body is empty or not JSON
				}
				throw new Error(errorMessage);
			}

			// Reload invitations to remove deleted item
			await loadInvitations();
		} catch (err) {
			console.error("Error deleting invitation:", err);
			setError(
				err instanceof Error ? err.message : "Failed to delete invitation",
			);
		} finally {
			setActionLoading(null);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Pending Invitations</CardTitle>
					<CardDescription>
						Manage invitations sent to join this household
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex justify-center py-4">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Pending Invitations</CardTitle>
				<CardDescription>
					Manage invitations sent to join this household
				</CardDescription>
			</CardHeader>
			<CardContent>
				{error && (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{invitations.length === 0 ? (
					<p className="text-sm text-muted-foreground text-center py-4">
						No pending invitations
					</p>
				) : (
					<div className="space-y-3">
						{invitations.map((invitation) => (
							<div
								key={invitation.id}
								className="flex items-center justify-between p-3 border rounded-lg"
							>
								<div className="flex-1">
									<p className="font-medium">{invitation.email}</p>
									<div className="flex items-center gap-2 mt-1">
										<p className="text-xs text-muted-foreground">
											Sent {formatDate(invitation.created_at)}
										</p>
										{invitation.resend_count > 0 && (
											<Badge variant="secondary" className="text-xs">
												Resent {invitation.resend_count}x
											</Badge>
										)}
									</div>
									<p className="text-xs text-muted-foreground">
										Expires {formatDate(invitation.expires_at)}
									</p>
								</div>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => handleResend(invitation.id)}
										disabled={
											actionLoading === invitation.id ||
											invitation.resend_count >= 3
										}
										title={
											invitation.resend_count >= 3
												? "Maximum resend limit reached"
												: "Resend invitation email"
										}
									>
										{actionLoading === invitation.id ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Mail className="h-4 w-4" />
										)}
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => handleDelete(invitation.id)}
										disabled={actionLoading === invitation.id}
										title="Cancel invitation"
									>
										{actionLoading === invitation.id ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Trash2 className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
