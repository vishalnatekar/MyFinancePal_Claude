export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					extensions?: Json;
					operationName?: string;
					query?: string;
					variables?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
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
			expense_splitting_rules: {
				Row: {
					apply_to_existing_transactions: boolean | null;
					category_match: string | null;
					created_at: string | null;
					created_by: string;
					household_id: string;
					id: string;
					is_active: boolean;
					max_amount: number | null;
					merchant_pattern: string | null;
					min_amount: number | null;
					priority: number;
					rule_name: string;
					rule_type: string;
					split_percentage: Json;
					updated_at: string | null;
				};
				Insert: {
					apply_to_existing_transactions?: boolean | null;
					category_match?: string | null;
					created_at?: string | null;
					created_by: string;
					household_id: string;
					id?: string;
					is_active?: boolean;
					max_amount?: number | null;
					merchant_pattern?: string | null;
					min_amount?: number | null;
					priority?: number;
					rule_name: string;
					rule_type?: string;
					split_percentage?: Json;
					updated_at?: string | null;
				};
				Update: {
					apply_to_existing_transactions?: boolean | null;
					category_match?: string | null;
					created_at?: string | null;
					created_by?: string;
					household_id?: string;
					id?: string;
					is_active?: boolean;
					max_amount?: number | null;
					merchant_pattern?: string | null;
					min_amount?: number | null;
					priority?: number;
					rule_name?: string;
					rule_type?: string;
					split_percentage?: Json;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "expense_splitting_rules_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "expense_splitting_rules_household_id_fkey";
						columns: ["household_id"];
						isOneToOne: false;
						referencedRelation: "households";
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
	storage: {
		Tables: {
			buckets: {
				Row: {
					allowed_mime_types: string[] | null;
					avif_autodetection: boolean | null;
					created_at: string | null;
					file_size_limit: number | null;
					id: string;
					name: string;
					owner: string | null;
					owner_id: string | null;
					public: boolean | null;
					type: Database["storage"]["Enums"]["buckettype"];
					updated_at: string | null;
				};
				Insert: {
					allowed_mime_types?: string[] | null;
					avif_autodetection?: boolean | null;
					created_at?: string | null;
					file_size_limit?: number | null;
					id: string;
					name: string;
					owner?: string | null;
					owner_id?: string | null;
					public?: boolean | null;
					type?: Database["storage"]["Enums"]["buckettype"];
					updated_at?: string | null;
				};
				Update: {
					allowed_mime_types?: string[] | null;
					avif_autodetection?: boolean | null;
					created_at?: string | null;
					file_size_limit?: number | null;
					id?: string;
					name?: string;
					owner?: string | null;
					owner_id?: string | null;
					public?: boolean | null;
					type?: Database["storage"]["Enums"]["buckettype"];
					updated_at?: string | null;
				};
				Relationships: [];
			};
			buckets_analytics: {
				Row: {
					created_at: string;
					format: string;
					id: string;
					type: Database["storage"]["Enums"]["buckettype"];
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					format?: string;
					id: string;
					type?: Database["storage"]["Enums"]["buckettype"];
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					format?: string;
					id?: string;
					type?: Database["storage"]["Enums"]["buckettype"];
					updated_at?: string;
				};
				Relationships: [];
			};
			iceberg_namespaces: {
				Row: {
					bucket_id: string;
					created_at: string;
					id: string;
					name: string;
					updated_at: string;
				};
				Insert: {
					bucket_id: string;
					created_at?: string;
					id?: string;
					name: string;
					updated_at?: string;
				};
				Update: {
					bucket_id?: string;
					created_at?: string;
					id?: string;
					name?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "iceberg_namespaces_bucket_id_fkey";
						columns: ["bucket_id"];
						isOneToOne: false;
						referencedRelation: "buckets_analytics";
						referencedColumns: ["id"];
					},
				];
			};
			iceberg_tables: {
				Row: {
					bucket_id: string;
					created_at: string;
					id: string;
					location: string;
					name: string;
					namespace_id: string;
					updated_at: string;
				};
				Insert: {
					bucket_id: string;
					created_at?: string;
					id?: string;
					location: string;
					name: string;
					namespace_id: string;
					updated_at?: string;
				};
				Update: {
					bucket_id?: string;
					created_at?: string;
					id?: string;
					location?: string;
					name?: string;
					namespace_id?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "iceberg_tables_bucket_id_fkey";
						columns: ["bucket_id"];
						isOneToOne: false;
						referencedRelation: "buckets_analytics";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "iceberg_tables_namespace_id_fkey";
						columns: ["namespace_id"];
						isOneToOne: false;
						referencedRelation: "iceberg_namespaces";
						referencedColumns: ["id"];
					},
				];
			};
			migrations: {
				Row: {
					executed_at: string | null;
					hash: string;
					id: number;
					name: string;
				};
				Insert: {
					executed_at?: string | null;
					hash: string;
					id: number;
					name: string;
				};
				Update: {
					executed_at?: string | null;
					hash?: string;
					id?: number;
					name?: string;
				};
				Relationships: [];
			};
			objects: {
				Row: {
					bucket_id: string | null;
					created_at: string | null;
					id: string;
					last_accessed_at: string | null;
					level: number | null;
					metadata: Json | null;
					name: string | null;
					owner: string | null;
					owner_id: string | null;
					path_tokens: string[] | null;
					updated_at: string | null;
					user_metadata: Json | null;
					version: string | null;
				};
				Insert: {
					bucket_id?: string | null;
					created_at?: string | null;
					id?: string;
					last_accessed_at?: string | null;
					level?: number | null;
					metadata?: Json | null;
					name?: string | null;
					owner?: string | null;
					owner_id?: string | null;
					path_tokens?: string[] | null;
					updated_at?: string | null;
					user_metadata?: Json | null;
					version?: string | null;
				};
				Update: {
					bucket_id?: string | null;
					created_at?: string | null;
					id?: string;
					last_accessed_at?: string | null;
					level?: number | null;
					metadata?: Json | null;
					name?: string | null;
					owner?: string | null;
					owner_id?: string | null;
					path_tokens?: string[] | null;
					updated_at?: string | null;
					user_metadata?: Json | null;
					version?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "objects_bucketId_fkey";
						columns: ["bucket_id"];
						isOneToOne: false;
						referencedRelation: "buckets";
						referencedColumns: ["id"];
					},
				];
			};
			prefixes: {
				Row: {
					bucket_id: string;
					created_at: string | null;
					level: number;
					name: string;
					updated_at: string | null;
				};
				Insert: {
					bucket_id: string;
					created_at?: string | null;
					level?: number;
					name: string;
					updated_at?: string | null;
				};
				Update: {
					bucket_id?: string;
					created_at?: string | null;
					level?: number;
					name?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "prefixes_bucketId_fkey";
						columns: ["bucket_id"];
						isOneToOne: false;
						referencedRelation: "buckets";
						referencedColumns: ["id"];
					},
				];
			};
			s3_multipart_uploads: {
				Row: {
					bucket_id: string;
					created_at: string;
					id: string;
					in_progress_size: number;
					key: string;
					owner_id: string | null;
					upload_signature: string;
					user_metadata: Json | null;
					version: string;
				};
				Insert: {
					bucket_id: string;
					created_at?: string;
					id: string;
					in_progress_size?: number;
					key: string;
					owner_id?: string | null;
					upload_signature: string;
					user_metadata?: Json | null;
					version: string;
				};
				Update: {
					bucket_id?: string;
					created_at?: string;
					id?: string;
					in_progress_size?: number;
					key?: string;
					owner_id?: string | null;
					upload_signature?: string;
					user_metadata?: Json | null;
					version?: string;
				};
				Relationships: [
					{
						foreignKeyName: "s3_multipart_uploads_bucket_id_fkey";
						columns: ["bucket_id"];
						isOneToOne: false;
						referencedRelation: "buckets";
						referencedColumns: ["id"];
					},
				];
			};
			s3_multipart_uploads_parts: {
				Row: {
					bucket_id: string;
					created_at: string;
					etag: string;
					id: string;
					key: string;
					owner_id: string | null;
					part_number: number;
					size: number;
					upload_id: string;
					version: string;
				};
				Insert: {
					bucket_id: string;
					created_at?: string;
					etag: string;
					id?: string;
					key: string;
					owner_id?: string | null;
					part_number: number;
					size?: number;
					upload_id: string;
					version: string;
				};
				Update: {
					bucket_id?: string;
					created_at?: string;
					etag?: string;
					id?: string;
					key?: string;
					owner_id?: string | null;
					part_number?: number;
					size?: number;
					upload_id?: string;
					version?: string;
				};
				Relationships: [
					{
						foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey";
						columns: ["bucket_id"];
						isOneToOne: false;
						referencedRelation: "buckets";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey";
						columns: ["upload_id"];
						isOneToOne: false;
						referencedRelation: "s3_multipart_uploads";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			add_prefixes: {
				Args: { _bucket_id: string; _name: string };
				Returns: undefined;
			};
			can_insert_object: {
				Args: { bucketid: string; metadata: Json; name: string; owner: string };
				Returns: undefined;
			};
			delete_leaf_prefixes: {
				Args: { bucket_ids: string[]; names: string[] };
				Returns: undefined;
			};
			delete_prefix: {
				Args: { _bucket_id: string; _name: string };
				Returns: boolean;
			};
			extension: { Args: { name: string }; Returns: string };
			filename: { Args: { name: string }; Returns: string };
			foldername: { Args: { name: string }; Returns: string[] };
			get_level: { Args: { name: string }; Returns: number };
			get_prefix: { Args: { name: string }; Returns: string };
			get_prefixes: { Args: { name: string }; Returns: string[] };
			get_size_by_bucket: {
				Args: never;
				Returns: {
					bucket_id: string;
					size: number;
				}[];
			};
			list_multipart_uploads_with_delimiter: {
				Args: {
					bucket_id: string;
					delimiter_param: string;
					max_keys?: number;
					next_key_token?: string;
					next_upload_token?: string;
					prefix_param: string;
				};
				Returns: {
					created_at: string;
					id: string;
					key: string;
				}[];
			};
			list_objects_with_delimiter: {
				Args: {
					bucket_id: string;
					delimiter_param: string;
					max_keys?: number;
					next_token?: string;
					prefix_param: string;
					start_after?: string;
				};
				Returns: {
					id: string;
					metadata: Json;
					name: string;
					updated_at: string;
				}[];
			};
			lock_top_prefixes: {
				Args: { bucket_ids: string[]; names: string[] };
				Returns: undefined;
			};
			operation: { Args: never; Returns: string };
			search: {
				Args: {
					bucketname: string;
					levels?: number;
					limits?: number;
					offsets?: number;
					prefix: string;
					search?: string;
					sortcolumn?: string;
					sortorder?: string;
				};
				Returns: {
					created_at: string;
					id: string;
					last_accessed_at: string;
					metadata: Json;
					name: string;
					updated_at: string;
				}[];
			};
			search_legacy_v1: {
				Args: {
					bucketname: string;
					levels?: number;
					limits?: number;
					offsets?: number;
					prefix: string;
					search?: string;
					sortcolumn?: string;
					sortorder?: string;
				};
				Returns: {
					created_at: string;
					id: string;
					last_accessed_at: string;
					metadata: Json;
					name: string;
					updated_at: string;
				}[];
			};
			search_v1_optimised: {
				Args: {
					bucketname: string;
					levels?: number;
					limits?: number;
					offsets?: number;
					prefix: string;
					search?: string;
					sortcolumn?: string;
					sortorder?: string;
				};
				Returns: {
					created_at: string;
					id: string;
					last_accessed_at: string;
					metadata: Json;
					name: string;
					updated_at: string;
				}[];
			};
			search_v2: {
				Args: {
					bucket_name: string;
					levels?: number;
					limits?: number;
					prefix: string;
					sort_column?: string;
					sort_column_after?: string;
					sort_order?: string;
					start_after?: string;
				};
				Returns: {
					created_at: string;
					id: string;
					key: string;
					last_accessed_at: string;
					metadata: Json;
					name: string;
					updated_at: string;
				}[];
			};
		};
		Enums: {
			buckettype: "STANDARD" | "ANALYTICS";
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
	graphql_public: {
		Enums: {},
	},
	public: {
		Enums: {},
	},
	storage: {
		Enums: {
			buckettype: ["STANDARD", "ANALYTICS"],
		},
	},
} as const;
