export interface TrueLayerCredentials {
	client_id: string;
	client_secret: string;
	api_url: string;
	environment: string;
}

export interface TrueLayerAccessToken {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
	refresh_token?: string;
}

export interface TrueLayerProvider {
	provider_id: string;
	display_name: string;
	logo_url?: string; // TrueLayer uses logo_url, not logo_uri
	logo_uri?: string; // Keep for backward compatibility
	icon_uri?: string;
	country: string; // TrueLayer uses country, not country_code
	country_code?: string; // Keep for backward compatibility
	provider_type?: string;
	release_status?: string;
	supported_products?: string[];
	auth_type?: string;
	scopes: string[]; // TrueLayer uses scopes array instead of capabilities object
	provider_scope_mappings?: Record<string, string[]>;
	// Legacy capabilities field for backward compatibility
	capabilities?: {
		accounts?: boolean;
		transactions?: boolean;
		balance?: boolean;
		cards?: boolean;
		identity?: boolean;
	};
}

export interface TrueLayerAccount {
	account_id: string;
	account_type: "TRANSACTION" | "SAVINGS" | "CREDIT_CARD";
	display_name: string;
	currency: string;
	account_number: {
		iban?: string;
		number?: string;
		sort_code?: string;
	};
	provider: {
		display_name: string;
		provider_id: string;
		logo_uri: string;
	};
}

export interface TrueLayerBalance {
	currency: string;
	available: number;
	current: number;
	overdraft?: number;
	update_timestamp: string;
}

export interface TrueLayerConnectionRequest {
	provider_id: string;
	redirect_uri: string;
	state?: string;
	enable_mock?: boolean;
	enable_credentials_sharing?: boolean;
}

export interface TrueLayerConnectionResponse {
	auth_uri: string;
}

export interface TrueLayerConnectionCallback {
	code: string;
	state?: string;
	scope?: string;
	error?: string;
	error_description?: string;
}

export interface TrueLayerError {
	error: string;
	error_description: string;
	error_uri?: string;
}

export interface TrueLayerTransaction {
	transaction_id: string;
	timestamp: string;
	description: string;
	amount: number;
	currency: string;
	transaction_type: "DEBIT" | "CREDIT";
	transaction_category: string;
	transaction_classification: string[];
	account_id: string;
	merchant_name?: string;
	running_balance?: {
		currency: string;
		amount: number;
	};
}

export interface TrueLayerCard {
	account_id: string; // TrueLayer uses account_id for cards too
	card_id?: string; // Legacy field name
	card_type: "CREDIT" | "DEBIT";
	display_name: string;
	currency: string;
	partial_card_number: string;
	name_on_card?: string;
	valid_from?: string;
	valid_to?: string;
	provider: {
		display_name: string;
		provider_id: string;
		logo_uri: string;
	};
}

export interface TrueLayerCardBalance {
	currency: string;
	available: number;
	current: number;
	credit_limit?: number;
	last_statement_balance?: number;
	last_statement_date?: string;
	payment_due?: number;
	payment_due_date?: string;
	update_timestamp: string;
}

export interface TrueLayerCardTransaction {
	transaction_id: string;
	timestamp: string;
	description: string;
	amount: number;
	currency: string;
	transaction_type: "DEBIT" | "CREDIT";
	card_id: string;
	merchant_name?: string;
}

// API Response types
export interface TrueLayerAccountsResponse {
	results: TrueLayerAccount[];
}

export interface TrueLayerBalanceResponse {
	results: TrueLayerBalance[];
}

export interface TrueLayerTransactionsResponse {
	results: TrueLayerTransaction[];
}

export interface TrueLayerProvidersResponse {
	results: TrueLayerProvider[];
}

export interface TrueLayerCardsResponse {
	results: TrueLayerCard[];
}

export interface TrueLayerCardBalanceResponse {
	results: TrueLayerCardBalance[];
}

export interface TrueLayerCardTransactionsResponse {
	results: TrueLayerCardTransaction[];
}
