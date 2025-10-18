// Notification types and interfaces for household notification system
// Story: 3.4 Household Notification System

export type NotificationType =
	| "transaction_shared"
	| "large_transaction"
	| "member_joined"
	| "member_left";

export interface Notification {
	id: string;
	type: NotificationType;
	title: string;
	message: string;
	household_id: string;
	recipient_id: string;
	actor_id?: string;
	is_read: boolean;
	metadata?: {
		transaction_id?: string;
		transaction_ids?: string[];
		amount?: number;
		total_amount?: number;
		count?: number;
		merchant_name?: string;
		member_name?: string;
	};
	created_at: string;
	read_at?: string;
}

export interface NotificationWithActor extends Notification {
	actor?: {
		id: string;
		full_name: string;
		avatar_url?: string;
	};
}

export interface NotificationPreferences {
	id: string;
	user_id: string;
	household_id: string;
	email_notifications: boolean;
	in_app_notifications: boolean;
	large_transaction_threshold: number;
	weekly_digest_enabled: boolean;
	created_at: string;
	updated_at: string;
}

export interface NotificationPreferencesUpdate {
	email_notifications?: boolean;
	in_app_notifications?: boolean;
	large_transaction_threshold?: number;
	weekly_digest_enabled?: boolean;
}

export interface MemberContribution {
	member_name: string;
	amount: number;
	transaction_count: number;
}

export interface CategorySummary {
	category: string;
	amount: number;
	percentage: number;
}

export interface WeeklySummary {
	household_id: string;
	household_name: string;
	start_date: string;
	end_date: string;
	total_shared_spending: number;
	transaction_count: number;
	member_contributions: MemberContribution[];
	top_categories: CategorySummary[];
}

export interface NotificationListParams {
	household_id?: string;
	unread_only?: boolean;
	limit?: number;
	offset?: number;
}
