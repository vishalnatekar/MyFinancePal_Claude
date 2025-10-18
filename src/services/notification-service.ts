/**
 * Notification Service
 * Handles creation of in-app notifications and email notifications for household events
 * Story: 3.4 Household Notification System
 */

import { sendTransactionSharedEmail } from "@/lib/email-service";
import { supabaseAdmin } from "@/lib/supabase";
import type {
	Notification,
	NotificationPreferences,
	NotificationType,
	WeeklySummary,
} from "@/types/notification";

interface NotificationMetadata {
	transaction_id?: string;
	transaction_ids?: string[];
	amount?: number;
	total_amount?: number;
	count?: number;
	merchant_name?: string;
	member_name?: string;
}

/**
 * Generate notification title and message based on type and metadata
 */
function generateNotificationContent(
	type: NotificationType,
	metadata: NotificationMetadata,
): { title: string; message: string } {
	switch (type) {
		case "transaction_shared": {
			const { member_name, amount, merchant_name, count, total_amount } =
				metadata;
			if (count && count > 1) {
				// Batched notification for bulk sharing
				return {
					title: "Transactions Shared",
					message: `${member_name} shared ${count} transactions totaling £${total_amount?.toFixed(2)}`,
				};
			}
			return {
				title: "Transaction Shared",
				message: `${member_name} shared £${amount?.toFixed(2)}${merchant_name ? ` at ${merchant_name}` : ""}`,
			};
		}
		case "large_transaction": {
			const { member_name, amount, merchant_name } = metadata;
			return {
				title: "Large Transaction Alert",
				message: `${member_name} shared a large transaction: £${amount?.toFixed(2)}${merchant_name ? ` at ${merchant_name}` : ""}`,
			};
		}
		case "member_joined": {
			const { member_name } = metadata;
			return {
				title: "New Member Joined",
				message: `${member_name} accepted your invitation and joined the household`,
			};
		}
		case "member_left": {
			const { member_name } = metadata;
			return {
				title: "Member Left Household",
				message: `${member_name} left the household`,
			};
		}
		default:
			return {
				title: "Household Update",
				message: "A new household event occurred",
			};
	}
}

/**
 * Get or create notification preferences for a user in a household
 * Returns default preferences if none exist
 */
export async function getNotificationPreferences(
	userId: string,
	householdId: string,
): Promise<NotificationPreferences | null> {
	try {
		// Try to get existing preferences
		const { data: existing, error } = await supabaseAdmin
			.from("notification_preferences")
			.select("*")
			.eq("user_id", userId)
			.eq("household_id", householdId)
			.single();

		if (error && error.code !== "PGRST116") {
			// PGRST116 is "no rows returned" - that's okay
			console.error("Error fetching notification preferences:", error);
			return null;
		}

		// If preferences exist, return them
		if (existing) {
			return existing;
		}

		// Create default preferences
		const { data: created, error: createError } = await supabaseAdmin
			.from("notification_preferences")
			.insert({
				user_id: userId,
				household_id: householdId,
				email_notifications: true,
				in_app_notifications: true,
				large_transaction_threshold: 100.0,
				weekly_digest_enabled: true,
			})
			.select()
			.single();

		if (createError) {
			console.error("Error creating notification preferences:", createError);
			return null;
		}

		return created;
	} catch (error) {
		console.error("Error in getNotificationPreferences:", error);
		return null;
	}
}

/**
 * Create in-app notifications and send email notifications for specified recipients
 * Respects user's in-app and email notification preferences
 */
export async function createNotification(
	type: NotificationType,
	householdId: string,
	recipientIds: string[],
	actorId: string,
	metadata: NotificationMetadata,
): Promise<void> {
	try {
		// Generate title and message
		const { title, message } = generateNotificationContent(type, metadata);

		// Get household details for emails
		const { data: household } = await supabaseAdmin
			.from("households")
			.select("name")
			.eq("id", householdId)
			.single();

		const householdName = household?.name || "your household";

		// Get actor details for emails
		const { data: actor } = await supabaseAdmin
			.from("profiles")
			.select("full_name")
			.eq("id", actorId)
			.single();

		const actorName = actor?.full_name || "A member";

		// Filter recipients based on their notification preferences
		const notificationsToCreate: Array<{
			type: NotificationType;
			title: string;
			message: string;
			household_id: string;
			recipient_id: string;
			actor_id: string;
			metadata: NotificationMetadata;
		}> = [];

		const emailsToSend: Array<{
			recipientId: string;
			recipientEmail: string;
			recipientName: string;
		}> = [];

		for (const recipientId of recipientIds) {
			// Skip actor (don't notify yourself)
			if (recipientId === actorId) {
				continue;
			}

			// Check user's preferences
			const prefs = await getNotificationPreferences(recipientId, householdId);

			// Get recipient details
			const { data: recipient } = await supabaseAdmin
				.from("profiles")
				.select("email, full_name")
				.eq("id", recipientId)
				.single();

			if (!recipient) continue;

			// Add in-app notification if enabled
			if (!prefs || prefs.in_app_notifications) {
				notificationsToCreate.push({
					type,
					title,
					message,
					household_id: householdId,
					recipient_id: recipientId,
					actor_id: actorId,
					metadata,
				});
			}

			// Add email notification if enabled
			if (!prefs || prefs.email_notifications) {
				emailsToSend.push({
					recipientId,
					recipientEmail: recipient.email,
					recipientName: recipient.full_name || recipient.email,
				});
			}
		}

		// Bulk insert in-app notifications
		if (notificationsToCreate.length > 0) {
			const { error } = await supabaseAdmin
				.from("notifications")
				.insert(notificationsToCreate);

			if (error) {
				console.error("Error creating notifications:", error);
			} else {
				console.log(
					`Created ${notificationsToCreate.length} in-app notifications for household ${householdId}`,
				);
			}
		}

		// Send email notifications for transaction_shared type
		if (emailsToSend.length > 0 && type === "transaction_shared") {
			// Check if this is a large transaction that should trigger email
			const shouldSendEmail = await Promise.all(
				emailsToSend.map(async (emailRecipient) => {
					const prefs = await getNotificationPreferences(
						emailRecipient.recipientId,
						householdId,
					);

					// Get the transaction amount (single or total for batch)
					const transactionAmount = metadata.count
						? metadata.total_amount || 0
						: metadata.amount || 0;

					// Check if amount exceeds user's threshold
					const threshold = prefs?.large_transaction_threshold || 100;
					const isLargeTransaction = transactionAmount >= threshold;

					return { emailRecipient, isLargeTransaction };
				}),
			);

			// Send emails only to users where transaction exceeds their threshold
			Promise.all(
				shouldSendEmail
					.filter((item) => item.isLargeTransaction)
					.map(async ({ emailRecipient }) => {
						try {
							await sendTransactionSharedEmail({
								to: emailRecipient.recipientEmail,
								recipientName: emailRecipient.recipientName,
								householdName,
								householdId,
								actorName,
								amount: metadata.amount,
								merchant: metadata.merchant_name,
								count: metadata.count,
								totalAmount: metadata.total_amount,
							});
						} catch (emailError) {
							console.error(
								`Failed to send email to ${emailRecipient.recipientEmail}:`,
								emailError,
							);
						}
					}),
			).catch((error) => {
				console.error("Error sending email notifications:", error);
			});

			const largeTransactionRecipients = shouldSendEmail.filter(
				(item) => item.isLargeTransaction,
			).length;

			if (largeTransactionRecipients > 0) {
				console.log(
					`Sending ${largeTransactionRecipients} email notifications for large transaction in household ${householdId}`,
				);
			}
		}
	} catch (error) {
		// Log but don't throw - notification failures should not break main operations
		console.error("Error in createNotification:", error);
	}
}

/**
 * Generate weekly summary data for a household
 */
export async function generateWeeklySummary(
	householdId: string,
): Promise<WeeklySummary | null> {
	try {
		// Calculate date range (last 7 days)
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 7);

		// Get household details
		const { data: household, error: householdError } = await supabaseAdmin
			.from("households")
			.select("name")
			.eq("id", householdId)
			.single();

		if (householdError || !household) {
			console.error("Error fetching household:", householdError);
			return null;
		}

		// Get shared transactions from the past week
		const { data: transactions, error: transactionsError } = await supabaseAdmin
			.from("transactions")
			.select(
				`
        id,
        amount,
        merchant_name,
        category,
        account_id,
        financial_accounts!inner (
          user_id,
          profiles:user_id (
            full_name
          )
        )
      `,
			)
			.eq("shared_with_household_id", householdId)
			.gte("date", startDate.toISOString())
			.lte("date", endDate.toISOString());

		if (transactionsError) {
			console.error("Error fetching transactions:", transactionsError);
			return null;
		}

		if (!transactions || transactions.length === 0) {
			// No activity this week
			return {
				household_id: householdId,
				household_name: household.name,
				start_date: startDate.toISOString(),
				end_date: endDate.toISOString(),
				total_shared_spending: 0,
				transaction_count: 0,
				member_contributions: [],
				top_categories: [],
			};
		}

		// Calculate total spending
		const totalSpending = transactions.reduce(
			(sum, tx) => sum + Math.abs(Number(tx.amount)),
			0,
		);

		// Calculate member contributions
		const memberContributionsMap = new Map<
			string,
			{ name: string; amount: number; count: number }
		>();

		for (const tx of transactions) {
			const financialAccount = tx.financial_accounts as {
				user_id: string;
				profiles: { full_name: string | null } | null;
			} | null;

			if (!financialAccount) continue;

			const userId = financialAccount.user_id;
			const userName = financialAccount.profiles?.full_name || "Unknown";
			const amount = Math.abs(Number(tx.amount));

			if (memberContributionsMap.has(userId)) {
				const existing = memberContributionsMap.get(userId)!;
				existing.amount += amount;
				existing.count += 1;
			} else {
				memberContributionsMap.set(userId, {
					name: userName,
					amount,
					count: 1,
				});
			}
		}

		const memberContributions = Array.from(memberContributionsMap.values()).map(
			(contrib) => ({
				member_name: contrib.name,
				amount: contrib.amount,
				transaction_count: contrib.count,
			}),
		);

		// Calculate top categories
		const categoryMap = new Map<string, number>();
		for (const tx of transactions) {
			const category = tx.category || "Uncategorized";
			const amount = Math.abs(Number(tx.amount));
			categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
		}

		const topCategories = Array.from(categoryMap.entries())
			.map(([category, amount]) => ({
				category,
				amount,
				percentage: (amount / totalSpending) * 100,
			}))
			.sort((a, b) => b.amount - a.amount)
			.slice(0, 5); // Top 5 categories

		return {
			household_id: householdId,
			household_name: household.name,
			start_date: startDate.toISOString(),
			end_date: endDate.toISOString(),
			total_shared_spending: totalSpending,
			transaction_count: transactions.length,
			member_contributions: memberContributions,
			top_categories: topCategories,
		};
	} catch (error) {
		console.error("Error generating weekly summary:", error);
		return null;
	}
}

/**
 * Get all household members who should receive a notification
 * Excludes the actor and inactive members
 */
export async function getHouseholdRecipients(
	householdId: string,
	actorId?: string,
): Promise<string[]> {
	try {
		const { data: members, error } = await supabaseAdmin
			.from("household_members")
			.select("user_id")
			.eq("household_id", householdId);

		if (error) {
			console.error("Error fetching household members:", error);
			return [];
		}

		// Filter out the actor if provided
		return members
			.map((m) => m.user_id)
			.filter((userId) => !actorId || userId !== actorId);
	} catch (error) {
		console.error("Error in getHouseholdRecipients:", error);
		return [];
	}
}
