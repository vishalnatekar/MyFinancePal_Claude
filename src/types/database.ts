export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					email: string;
					full_name: string | null;
					avatar_url: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					email: string;
					full_name?: string | null;
					avatar_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					email?: string;
					full_name?: string | null;
					avatar_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "profiles_id_fkey";
						columns: ["id"];
						isOneToOne: true;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			households: {
				Row: {
					id: string;
					name: string;
					description: string | null;
					created_by: string;
					settlement_day: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					description?: string | null;
					created_by: string;
					settlement_day?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					description?: string | null;
					created_by?: string;
					settlement_day?: number;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "households_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			household_members: {
				Row: {
					id: string;
					household_id: string;
					user_id: string;
					role: string;
					joined_at: string;
				};
				Insert: {
					id?: string;
					household_id: string;
					user_id: string;
					role?: string;
					joined_at?: string;
				};
				Update: {
					id?: string;
					household_id?: string;
					user_id?: string;
					role?: string;
					joined_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "household_members_household_id_fkey";
						columns: ["household_id"];
						isOneToOne: false;
						referencedRelation: "households";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "household_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			categories: {
				Row: {
					id: string;
					name: string;
					icon: string | null;
					color: string | null;
					household_id: string;
					created_by: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					icon?: string | null;
					color?: string | null;
					household_id: string;
					created_by: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					icon?: string | null;
					color?: string | null;
					household_id?: string;
					created_by?: string;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "categories_household_id_fkey";
						columns: ["household_id"];
						isOneToOne: false;
						referencedRelation: "households";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "categories_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			expenses: {
				Row: {
					id: string;
					household_id: string;
					paid_by: string;
					amount: number;
					description: string;
					category_id: string | null;
					date: string;
					receipt_url: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					household_id: string;
					paid_by: string;
					amount: number;
					description: string;
					category_id?: string | null;
					date?: string;
					receipt_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					household_id?: string;
					paid_by?: string;
					amount?: number;
					description?: string;
					category_id?: string | null;
					date?: string;
					receipt_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "expenses_household_id_fkey";
						columns: ["household_id"];
						isOneToOne: false;
						referencedRelation: "households";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "expenses_paid_by_fkey";
						columns: ["paid_by"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "expenses_category_id_fkey";
						columns: ["category_id"];
						isOneToOne: false;
						referencedRelation: "categories";
						referencedColumns: ["id"];
					},
				];
			};
			expense_splits: {
				Row: {
					id: string;
					expense_id: string;
					user_id: string;
					amount: number;
					created_at: string;
				};
				Insert: {
					id?: string;
					expense_id: string;
					user_id: string;
					amount: number;
					created_at?: string;
				};
				Update: {
					id?: string;
					expense_id?: string;
					user_id?: string;
					amount?: number;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "expense_splits_expense_id_fkey";
						columns: ["expense_id"];
						isOneToOne: false;
						referencedRelation: "expenses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "expense_splits_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			settlements: {
				Row: {
					id: string;
					household_id: string;
					from_user: string;
					to_user: string;
					amount: number;
					description: string | null;
					settled_at: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					household_id: string;
					from_user: string;
					to_user: string;
					amount: number;
					description?: string | null;
					settled_at?: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					household_id?: string;
					from_user?: string;
					to_user?: string;
					amount?: number;
					description?: string | null;
					settled_at?: string;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "settlements_household_id_fkey";
						columns: ["household_id"];
						isOneToOne: false;
						referencedRelation: "households";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "settlements_from_user_fkey";
						columns: ["from_user"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "settlements_to_user_fkey";
						columns: ["to_user"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			financial_accounts: {
				Row: {
					id: string;
					user_id: string;
					truelayer_account_id: string | null;
					truelayer_connection_id: string | null;
					account_type: "checking" | "savings" | "investment" | "credit";
					account_name: string;
					institution_name: string;
					current_balance: number;
					is_shared: boolean;
					last_synced: string | null;
					is_manual: boolean;
					connection_status: "active" | "expired" | "failed";
					encrypted_access_token: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					truelayer_account_id?: string | null;
					truelayer_connection_id?: string | null;
					account_type: "checking" | "savings" | "investment" | "credit";
					account_name: string;
					institution_name: string;
					current_balance?: number;
					is_shared?: boolean;
					last_synced?: string | null;
					is_manual?: boolean;
					connection_status?: "active" | "expired" | "failed";
					encrypted_access_token?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					truelayer_account_id?: string | null;
					truelayer_connection_id?: string | null;
					account_type?: "checking" | "savings" | "investment" | "credit";
					account_name?: string;
					institution_name?: string;
					current_balance?: number;
					is_shared?: boolean;
					last_synced?: string | null;
					is_manual?: boolean;
					connection_status?: "active" | "expired" | "failed";
					encrypted_access_token?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "financial_accounts_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			account_sync_history: {
				Row: {
					id: string;
					account_id: string;
					sync_status: "success" | "failed" | "in_progress";
					synced_at: string;
					error_message: string | null;
				};
				Insert: {
					id?: string;
					account_id: string;
					sync_status: "success" | "failed" | "in_progress";
					synced_at?: string;
					error_message?: string | null;
				};
				Update: {
					id?: string;
					account_id?: string;
					sync_status?: "success" | "failed" | "in_progress";
					synced_at?: string;
					error_message?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "account_sync_history_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "financial_accounts";
						referencedColumns: ["id"];
					},
				];
			};
			account_balance_history: {
				Row: {
					id: string;
					account_id: string;
					balance: number;
					recorded_at: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					account_id: string;
					balance: number;
					recorded_at?: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					account_id?: string;
					balance?: number;
					recorded_at?: string;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "account_balance_history_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "financial_accounts";
						referencedColumns: ["id"];
					},
				];
			};
			transactions: {
				Row: {
					id: string;
					account_id: string;
					amount: number;
					description: string;
					transaction_date: string;
					category: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					account_id: string;
					amount: number;
					description: string;
					transaction_date: string;
					category?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					account_id?: string;
					amount?: number;
					description?: string;
					transaction_date?: string;
					category?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "transactions_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "financial_accounts";
						referencedColumns: ["id"];
					},
				];
			};
			oauth_states: {
				Row: {
					id: string;
					state_token: string;
					user_id: string;
					provider_id: string;
					expires_at: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					state_token: string;
					user_id: string;
					provider_id: string;
					expires_at: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					state_token?: string;
					user_id?: string;
					provider_id?: string;
					expires_at?: string;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "oauth_states_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			household_invitations: {
				Row: {
					id: string;
					household_id: string;
					invited_by: string;
					email: string;
					token: string;
					status: "pending" | "accepted" | "declined" | "expired";
					resend_count: number;
					expires_at: string;
					created_at: string;
					accepted_at: string | null;
				};
				Insert: {
					id?: string;
					household_id: string;
					invited_by: string;
					email: string;
					token: string;
					status?: "pending" | "accepted" | "declined" | "expired";
					resend_count?: number;
					expires_at: string;
					created_at?: string;
					accepted_at?: string | null;
				};
				Update: {
					id?: string;
					household_id?: string;
					invited_by?: string;
					email?: string;
					token?: string;
					status?: "pending" | "accepted" | "declined" | "expired";
					resend_count?: number;
					expires_at?: string;
					created_at?: string;
					accepted_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "household_invitations_household_id_fkey";
						columns: ["household_id"];
						isOneToOne: false;
						referencedRelation: "households";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "household_invitations_invited_by_fkey";
						columns: ["invited_by"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};
