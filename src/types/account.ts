export interface FinancialAccount {
	id: string;
	user_id: string;
	truelayer_account_id?: string;
	truelayer_connection_id?: string;
	account_type: "checking" | "savings" | "investment" | "credit";
	account_name: string;
	institution_name: string;
	current_balance: number;
	currency?: string;
	is_shared: boolean;
	last_synced?: string;
	is_manual: boolean;
	connection_status?: "active" | "expired" | "failed";
	encrypted_access_token?: string;
	created_at?: string;
	updated_at?: string;
}

export interface AccountConnectionStatus {
	id: string;
	status: "active" | "expired" | "failed" | "connecting";
	last_synced?: string;
	sync_in_progress?: boolean;
	error_message?: string;
}

export interface AccountSyncHistory {
	id: string;
	account_id: string;
	sync_status: "success" | "failed" | "in_progress";
	synced_at: string;
	error_message?: string;
}

export interface ManualAccountInput {
	account_type: "checking" | "savings" | "investment" | "credit";
	account_name: string;
	institution_name: string;
	current_balance: number;
	is_shared?: boolean;
}

export interface ConnectedAccountInput {
	truelayer_account_id: string;
	truelayer_connection_id: string;
	account_type: "checking" | "savings" | "investment" | "credit";
	account_name: string;
	institution_name: string;
	current_balance: number;
	encrypted_access_token: string;
}

export type CreateAccountInput = ManualAccountInput | ConnectedAccountInput;
