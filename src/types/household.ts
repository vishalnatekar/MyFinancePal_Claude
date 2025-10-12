import type { Database } from "./database";

// Database types for households
export type Household = Database["public"]["Tables"]["households"]["Row"];
export type HouseholdInsert =
	Database["public"]["Tables"]["households"]["Insert"];
export type HouseholdUpdate =
	Database["public"]["Tables"]["households"]["Update"];

export type HouseholdMember =
	Database["public"]["Tables"]["household_members"]["Row"];
export type HouseholdMemberInsert =
	Database["public"]["Tables"]["household_members"]["Insert"];

// Extended types with relationships
export interface HouseholdWithMembers extends Household {
	household_members: (HouseholdMember & {
		profiles: {
			email: string;
			full_name: string | null;
			avatar_url: string | null;
		} | null;
	})[];
}

export interface HouseholdMemberWithProfile extends HouseholdMember {
	profiles: {
		email: string;
		full_name: string | null;
		avatar_url: string | null;
	} | null;
}

// Form types
export interface CreateHouseholdData {
	name: string;
	description?: string;
	settlement_day?: number;
}

export interface UpdateHouseholdData {
	name?: string;
	description?: string;
	settlement_day?: number;
}

// API response types
export interface HouseholdsResponse {
	households: HouseholdWithMembers[];
}

export interface HouseholdResponse {
	household: HouseholdWithMembers;
}

// Household role enum
export type HouseholdRole = "creator" | "member";

// Database types for household invitations
export type HouseholdInvitation =
	Database["public"]["Tables"]["household_invitations"]["Row"];
export type HouseholdInvitationInsert =
	Database["public"]["Tables"]["household_invitations"]["Insert"];
export type HouseholdInvitationUpdate =
	Database["public"]["Tables"]["household_invitations"]["Update"];

// Extended types with relationships
export interface HouseholdInvitationWithDetails extends HouseholdInvitation {
	households: {
		name: string;
	} | null;
	inviter: {
		email: string;
		full_name: string | null;
	} | null;
}

// Invitation status enum
export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";

// Invitation form types
export interface SendInvitationData {
	email: string;
}

export interface InvitationResponse {
	invitation: HouseholdInvitation;
}

export interface InvitationsResponse {
	invitations: HouseholdInvitationWithDetails[];
}

// Story 3.3: Household Dashboard Types

export interface HouseholdDashboardData {
	household: {
		id: string;
		name: string;
		description?: string;
		settlement_day: number;
	};
	members: HouseholdMemberWithStats[];
	shared_net_worth: number;
	shared_accounts: SharedAccountWithOwner[];
	recent_shared_transactions: SharedTransactionWithOwner[];
	activity_feed: HouseholdActivityEvent[];
	last_sync: string; // ISO timestamp of most recent account sync
}

export interface HouseholdMemberWithStats {
	id: string;
	user_id: string;
	name: string;
	email: string;
	avatar_url?: string;
	role: "creator" | "member";
	joined_at: string;
	shared_accounts_count: number;
	shared_transactions_count: number;
	total_contribution: number; // sum of shared transaction amounts
}

export interface SharedAccountWithOwner {
	id: string;
	account_name: string;
	account_type: "checking" | "savings" | "investment" | "credit" | "loan";
	institution_name: string;
	current_balance: number;
	currency: string;
	last_synced?: string;
	owner_id: string;
	owner_name: string;
	owner_avatar?: string;
	sharing_level?: string;
}

export interface SharedTransactionWithOwner {
	id: string;
	amount: number;
	merchant_name: string;
	category: string;
	date: string;
	shared_at: string;
	owner_id: string;
	owner_name: string;
	owner_avatar?: string;
	account_id: string;
}

export interface HouseholdActivityEvent {
	id: string;
	type:
		| "member_joined"
		| "account_shared"
		| "transaction_shared"
		| "large_transaction";
	description: string;
	actor_id: string;
	actor_name: string;
	timestamp: string;
	metadata?: Record<string, any>;
}

// Household sync response
export interface HouseholdSyncResponse {
	success: boolean;
	syncing_accounts: number;
	message: string;
}
