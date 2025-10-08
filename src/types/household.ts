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
