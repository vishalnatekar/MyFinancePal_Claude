export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "13.0.5";
	};
	public: {
		Tables: {
			account_balance_history: {
				Row: {
					account_id: string;
					balance: number;
					currency: string;
					id: string;
					recorded_at: string | null;
				};
				Insert: {
					account_id: string;
					balance: number;
					currency: string;
					id?: string;
					recorded_at?: string | null;
				};
				Update: {
					account_id?: string;
					balance?: number;
					currency?: string;
					id?: string;
					recorded_at?: string | null;
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
			account_sharing_history: {
				Row: {
					account_id: string;
					action: string;
					changed_at: string | null;
					changed_by: string;
					household_id: string;
					id: string;
					sharing_level: string | null;
				};
				Insert: {
					account_id: string;
					action: string;
					changed_at?: string | null;
					changed_by: string;
					household_id: string;
					id?: string;
					sharing_level?: string | null;
				};
				Update: {
					account_id?: string;
					action?: string;
					changed_at?: string | null;
					changed_by?: string;
					household_id?: string;
					id?: string;
					sharing_level?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "account_sharing_history_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "financial_accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "account_sharing_history_household_id_fkey";
						columns: ["household_id"];
						isOneToOne: false;
						referencedRelation: "households";
						referencedColumns: ["id"];
					},
				];
			};
			account_sync_history: {
				Row: {
					account_id: string;
					error_message: string | null;
					id: string;
					sync_status: string;
					synced_at: string | null;
				};
				Insert: {
					account_id: string;
					error_message?: string | null;
					id?: string;
					sync_status: string;
					synced_at?: string | null;
				};
				Update: {
					account_id?: string;
					error_message?: string | null;
					id?: string;
					sync_status?: string;
					synced_at?: string | null;
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
			categories: {
				Row: {
					color: string | null;
					created_at: string | null;
					created_by: string;
					household_id: string;
					icon: string | null;
					id: string;
					name: string;
				};
				Insert: {
					color?: string | null;
					created_at?: string | null;
					created_by: string;
					household_id: string;
					icon?: string | null;
					id?: string;
					name: string;
				};
				Update: {
					color?: string | null;
					created_at?: string | null;
					created_by?: string;
					household_id?: string;
					icon?: string | null;
					id?: string;
					name?: string;
				};
				Relationships: [
					{
						foreignKeyName: "categories_household_id_fkey";
						columns: ["household_id"];
						isOneToOne: false;
						referencedRelation: "households";
						referencedColumns: ["id"];
					},
				];
			};
			data_sync_logs: {
				Row: {
					account_id: string;
					completed_at: string | null;
					duplicates_found: number | null;
					errors_encountered: string[] | null;
					id: string;
					started_at: string | null;
					status: string | null;
					sync_type: string | null;
					transactions_processed: number | null;
				};
				Insert: {
					account_id: string;
					completed_at?: string | null;
					duplicates_found?: number | null;
					errors_encountered?: string[] | null;
					id?: string;
					started_at?: string | null;
					status?: string | null;
					sync_type?: string | null;
					transactions_processed?: number | null;
				};
				Update: {
					account_id?: string;
					completed_at?: string | null;
					duplicates_found?: number | null;
					errors_encountered?: string[] | null;
					id?: string;
					started_at?: string | null;
					status?: string | null;
					sync_type?: string | null;
					transactions_processed?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: "data_sync_logs_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "financial_accounts";
						referencedColumns: ["id"];
					},
				];
			};
			expense_splits: {
				Row: {
					amount: number;
					created_at: string | null;
					expense_id: string;
					id: string;
					user_id: string;
				};
				Insert: {
					amount: number;
					created_at?: string | null;
					expense_id: string;
					id?: string;
					user_id: string;
				};
				Update: {
					amount?: number;
					created_at?: string | null;
					expense_id?: string;
					id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "expense_splits_expense_id_fkey";
						columns: ["expense_id"];
						isOneToOne: false;
						referencedRelation: "expenses";
						referencedColumns: ["id"];
					},
				];
			};
			expenses: {
				Row: {
					amount: number;
					category_id: string | null;
					created_at: string | null;
					date: string;
					description: string;
					household_id: string;
					id: string;
					paid_by: string;
					receipt_url: string | null;
					updated_at: string | null;
				};
				Insert: {
					amount: number;
					category_id?: string | null;
					created_at?: string | null;
					date?: string;
					description: string;
					household_id: string;
					id?: string;
					paid_by: string;
					receipt_url?: string | null;
					updated_at?: string | null;
				};
				Update: {
					amount?: number;
					category_id?: string | null;
					created_at?: string | null;
					date?: string;
					description?: string;
					household_id?: string;
					id?: string;
					paid_by?: string;
					receipt_url?: string | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "expenses_category_id_fkey";
						columns: ["category_id"];
						isOneToOne: false;
						referencedRelation: "categories";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "expenses_household_id_fkey";
						columns: ["household_id"];
						isOneToOne: false;
						referencedRelation: "households";
						referencedColumns: ["id"];
					},
				];
			};
			financial_accounts: {
				Row: {
					account_name: string;
					account_type: string;
					connection_status: string | null;
					created_at: string | null;
					currency: string | null;
					current_balance: number;
					encrypted_access_token: string | null;
					id: string;
					institution_name: string;
					is_manual: boolean;
					is_shared: boolean;
					last_synced: string | null;
					shared_households: Json | null;
					sharing_level: string | null;
					truelayer_account_id: string | null;
					truelayer_connection_id: string | null;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					account_name: string;
					account_type: string;
					connection_status?: string | null;
					created_at?: string | null;
					currency?: string | null;
					current_balance?: number;
					encrypted_access_token?: string | null;
					id?: string;
					institution_name: string;
					is_manual?: boolean;
					is_shared?: boolean;
					last_synced?: string | null;
					shared_households?: Json | null;
					sharing_level?: string | null;
					truelayer_account_id?: string | null;
					truelayer_connection_id?: string | null;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					account_name?: string;
					account_type?: string;
					connection_status?: string | null;
					created_at?: string | null;
					currency?: string | null;
					current_balance?: number;
					encrypted_access_token?: string | null;
					id?: string;
					institution_name?: string;
					is_manual?: boolean;
					is_shared?: boolean;
					last_synced?: string | null;
					shared_households?: Json | null;
					sharing_level?: string | null;
					truelayer_account_id?: string | null;
					truelayer_connection_id?: string | null;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [];
			};
			household_invitations: {
				Row: {
					accepted_at: string | null;
					created_at: string | null;
					email: string;
					expires_at: string;
					household_id: string;
					id: string;
					invited_by: string;
					resend_count: number;
					status: string;
					token: string;
				};
				Insert: {
					accepted_at?: string | null;
					created_at?: string | null;
					email: string;
					expires_at: string;
					household_id: string;
					id?: string;
					invited_by: string;
					resend_count?: number;
					status?: string;
					token: string;
				};
				Update: {
					accepted_at?: string | null;
					created_at?: string | null;
					email?: string;
					expires_at?: string;
					household_id?: string;
					id?: string;
					invited_by?: string;
					resend_count?: number;
					status?: string;
					token?: string;
				};
				Relationships: [
					{
						foreignKeyName: "household_invitations_household_id_fkey";
						columns: ["household_id"];
						isOneToOne: false;
						referencedRelation: "households";
						referencedColumns: ["id"];
					},
				];
			};
			household_members: {
				Row: {
					household_id: string;
					id: string;
					joined_at: string | null;
					role: string;
					user_id: string;
				};
				Insert: {
					household_id: string;
					id?: string;
					joined_at?: string | null;
					role?: string;
					user_id: string;
				};
				Update: {
					household_id?: string;
					id?: string;
					joined_at?: string | null;
					role?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "household_members_household_id_fkey";
						columns: ["household_id"];
						isOneToOne: false;
						referencedRelation: "households";
						referencedColumns: ["id"];
					},
				];
			};
			households: {
				Row: {
					created_at: string | null;
					created_by: string;
					description: string | null;
					id: string;
					name: string;
					settlement_day: number | null;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					created_by: string;
					description?: string | null;
					id?: string;
					name: string;
					settlement_day?: number | null;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					created_by?: string;
					description?: string | null;
					id?: string;
					name?: string;
					settlement_day?: number | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			notification_preferences: {
				Row: {
					created_at: string;
					email_notifications: boolean;
					household_id: string;
					id: string;
					in_app_notifications: boolean;
					large_transaction_threshold: number;
					updated_at: string;
					user_id: string;
					weekly_digest_enabled: boolean;
				};
				Insert: {
					created_at?: string;
					email_notifications?: boolean;
					household_id: string;
					id?: string;
					in_app_notifications?: boolean;
					large_transaction_threshold?: number;
					updated_at?: string;
					user_id: string;
					weekly_digest_enabled?: boolean;
				};
				Update: {
					created_at?: string;
					email_notifications?: boolean;
					household_id?: string;
					id?: string;
					in_app_notifications?: boolean;
					large_transaction_threshold?: number;
					updated_at?: string;
					user_id?: string;
					weekly_digest_enabled?: boolean;
				};
				Relationships: [
					{
						foreignKeyName: "notification_preferences_household_id_fkey";
						columns: ["household_id"];
						isOneToOne: false;
						referencedRelation: "households";
						referencedColumns: ["id"];
					},
				];
			};
			notifications: {
				Row: {
					actor_id: string | null;
					created_at: string;
					household_id: string;
					id: string;
					is_read: boolean;
					message: string;
					metadata: Json | null;
					read_at: string | null;
					recipient_id: string;
					title: string;
					type: string;
				};
				Insert: {
					actor_id?: string | null;
					created_at?: string;
					household_id: string;
					id?: string;
					is_read?: boolean;
					message: string;
					metadata?: Json | null;
					read_at?: string | null;
					recipient_id: string;
					title: string;
					type: string;
				};
				Update: {
					actor_id?: string | null;
					created_at?: string;
					household_id?: string;
					id?: string;
					is_read?: boolean;
					message?: string;
					metadata?: Json | null;
					read_at?: string | null;
					recipient_id?: string;
					title?: string;
					type?: string;
				};
				Relationships: [
					{
						foreignKeyName: "notifications_household_id_fkey";
						columns: ["household_id"];
						isOneToOne: false;
						referencedRelation: "households";
						referencedColumns: ["id"];
					},
				];
			};
			oauth_states: {
				Row: {
					created_at: string | null;
					expires_at: string;
					id: string;
					provider_id: string;
					state_token: string;
					user_id: string;
				};
				Insert: {
					created_at?: string | null;
					expires_at: string;
					id?: string;
					provider_id: string;
					state_token: string;
					user_id: string;
				};
				Update: {
					created_at?: string | null;
					expires_at?: string;
					id?: string;
					provider_id?: string;
					state_token?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			profiles: {
				Row: {
					avatar_url: string | null;
					created_at: string | null;
					email: string;
					full_name: string | null;
					id: string;
					notification_preferences: Json | null;
					updated_at: string | null;
				};
				Insert: {
					avatar_url?: string | null;
					created_at?: string | null;
					email: string;
					full_name?: string | null;
					id: string;
					notification_preferences?: Json | null;
					updated_at?: string | null;
				};
				Update: {
					avatar_url?: string | null;
					created_at?: string | null;
					email?: string;
					full_name?: string | null;
					id?: string;
					notification_preferences?: Json | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			settlements: {
				Row: {
					amount: number;
					created_at: string | null;
					description: string | null;
					from_user: string;
					household_id: string;
					id: string;
					settled_at: string | null;
					to_user: string;
				};
				Insert: {
					amount: number;
					created_at?: string | null;
					description?: string | null;
					from_user: string;
					household_id: string;
					id?: string;
					settled_at?: string | null;
					to_user: string;
				};
				Update: {
					amount?: number;
					created_at?: string | null;
					description?: string | null;
					from_user?: string;
					household_id?: string;
					id?: string;
					settled_at?: string | null;
					to_user?: string;
				};
				Relationships: [
					{
						foreignKeyName: "settlements_household_id_fkey";
						columns: ["household_id"];
						isOneToOne: false;
						referencedRelation: "households";
						referencedColumns: ["id"];
					},
				];
			};
			transaction_processing_metadata: {
				Row: {
					duplicate_cluster_id: string | null;
					fingerprint: string;
					id: string;
					processed_at: string | null;
					processing_status: string | null;
					transaction_id: string;
				};
				Insert: {
					duplicate_cluster_id?: string | null;
					fingerprint: string;
					id?: string;
					processed_at?: string | null;
					processing_status?: string | null;
					transaction_id: string;
				};
				Update: {
					duplicate_cluster_id?: string | null;
					fingerprint?: string;
					id?: string;
					processed_at?: string | null;
					processing_status?: string | null;
					transaction_id?: string;
				};
				Relationships: [];
			};
			transaction_sharing_history: {
				Row: {
					action: string;
					changed_at: string | null;
					changed_by: string;
					household_id: string;
					id: string;
					transaction_id: string;
				};
				Insert: {
					action: string;
					changed_at?: string | null;
					changed_by: string;
					household_id: string;
					id?: string;
					transaction_id: string;
				};
				Update: {
					action?: string;
					changed_at?: string | null;
					changed_by?: string;
					household_id?: string;
					id?: string;
					transaction_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "transaction_sharing_history_household_id_fkey";
						columns: ["household_id"];
						isOneToOne: false;
						referencedRelation: "households";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "transaction_sharing_history_transaction_id_fkey";
						columns: ["transaction_id"];
						isOneToOne: false;
						referencedRelation: "transactions";
						referencedColumns: ["id"];
					},
				];
			};
			transactions: {
				Row: {
					account_id: string;
					amount: number;
					category: string | null;
					created_at: string | null;
					currency: string;
					date: string;
					description: string | null;
					id: string;
					is_shared_expense: boolean | null;
					manual_override: boolean | null;
					merchant_name: string | null;
					shared_at: string | null;
					shared_by: string | null;
					shared_with_household_id: string | null;
					transaction_type: string | null;
					truelayer_transaction_id: string | null;
					updated_at: string | null;
				};
				Insert: {
					account_id: string;
					amount: number;
					category?: string | null;
					created_at?: string | null;
					currency: string;
					date: string;
					description?: string | null;
					id?: string;
					is_shared_expense?: boolean | null;
					manual_override?: boolean | null;
					merchant_name?: string | null;
					shared_at?: string | null;
					shared_by?: string | null;
					shared_with_household_id?: string | null;
					transaction_type?: string | null;
					truelayer_transaction_id?: string | null;
					updated_at?: string | null;
				};
				Update: {
					account_id?: string;
					amount?: number;
					category?: string | null;
					created_at?: string | null;
					currency?: string;
					date?: string;
					description?: string | null;
					id?: string;
					is_shared_expense?: boolean | null;
					manual_override?: boolean | null;
					merchant_name?: string | null;
					shared_at?: string | null;
					shared_by?: string | null;
					shared_with_household_id?: string | null;
					transaction_type?: string | null;
					truelayer_transaction_id?: string | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "transactions_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "financial_accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "transactions_shared_with_household_id_fkey";
						columns: ["shared_with_household_id"];
						isOneToOne: false;
						referencedRelation: "households";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			bulk_update_transaction_sharing: {
				Args: {
					p_changed_by: string;
					p_household_id: string;
					p_is_shared: boolean;
					p_transaction_ids: string[];
				};
				Returns: {
					error_message: string;
					success: boolean;
					transaction_id: string;
				}[];
			};
			is_household_member: {
				Args: { household_id_param: string; user_id_param: string };
				Returns: boolean;
			};
			update_transaction_sharing: {
				Args: {
					p_changed_by: string;
					p_household_id: string;
					p_is_shared: boolean;
					p_transaction_id: string;
				};
				Returns: boolean;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
	keyof Database,
	"public"
>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
				DefaultSchema["Views"])
		? (DefaultSchema["Tables"] &
				DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {},
	},
} as const;
