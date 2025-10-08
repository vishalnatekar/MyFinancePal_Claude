/**
 * Email Service using Resend API
 * Handles sending emails for household invitations and notifications
 */

import {
	generateAcceptanceNotificationEmail,
	generateInvitationEmail,
} from "./email-templates";

// Resend API configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = "https://api.resend.com/emails";

const FROM_EMAIL =
	process.env.RESEND_FROM_EMAIL || "MyFinancePal <noreply@myfinancepal.com>";

interface SendInvitationEmailParams {
	to: string;
	householdName: string;
	inviterName: string;
	invitationToken: string;
	expiresAt: Date;
}

interface SendAcceptanceNotificationParams {
	to: string;
	householdName: string;
	acceptedUserName: string;
	acceptedUserEmail: string;
}

/**
 * Send household invitation email
 */
export async function sendInvitationEmail(
	params: SendInvitationEmailParams,
): Promise<{ success: boolean; error?: string }> {
	try {
		const { to, householdName, inviterName, invitationToken, expiresAt } =
			params;

		// Generate invitation link
		const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		const invitationLink = `${appUrl}/household/invite/${invitationToken}`;

		// Format expiry date
		const expiryDate = expiresAt.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

		// Generate email content
		const { subject, html, text } = generateInvitationEmail({
			householdName,
			inviterName,
			invitationLink,
			expiryDate,
		});

		// Send email via Resend API
		const response = await fetch(RESEND_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${RESEND_API_KEY}`,
			},
			body: JSON.stringify({
				from: FROM_EMAIL,
				to,
				subject,
				html,
				text,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error("Resend API error:", errorData);
			return {
				success: false,
				error: errorData.message || "Failed to send email",
			};
		}

		const data = await response.json();
		console.log("Invitation email sent successfully:", data);
		return { success: true };
	} catch (error) {
		console.error("Error sending invitation email:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Send invitation acceptance notification email to household members
 */
export async function sendAcceptanceNotificationEmail(
	params: SendAcceptanceNotificationParams,
): Promise<{ success: boolean; error?: string }> {
	try {
		const { to, householdName, acceptedUserName, acceptedUserEmail } = params;

		// Generate email content
		const { subject, html, text } = generateAcceptanceNotificationEmail({
			householdName,
			acceptedUserName,
			acceptedUserEmail,
		});

		// Send email via Resend API
		const response = await fetch(RESEND_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${RESEND_API_KEY}`,
			},
			body: JSON.stringify({
				from: FROM_EMAIL,
				to,
				subject,
				html,
				text,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error("Resend API error:", errorData);
			return {
				success: false,
				error: errorData.message || "Failed to send email",
			};
		}

		const data = await response.json();
		console.log("Acceptance notification email sent successfully:", data);
		return { success: true };
	} catch (error) {
		console.error("Error sending acceptance notification email:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Send invitation emails to multiple recipients (batch operation)
 */
export async function sendBatchInvitationEmails(
	invitations: SendInvitationEmailParams[],
): Promise<{ success: boolean; sent: number; failed: number }> {
	let sent = 0;
	let failed = 0;

	for (const invitation of invitations) {
		const result = await sendInvitationEmail(invitation);
		if (result.success) {
			sent++;
		} else {
			failed++;
		}
	}

	return {
		success: failed === 0,
		sent,
		failed,
	};
}
