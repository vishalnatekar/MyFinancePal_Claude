import { DataValidationService } from "@/services/data-validation-service";
import type { FinancialAccount } from "@/types/account";

describe("DataValidationService", () => {
	let service: DataValidationService;

	beforeEach(() => {
		service = new DataValidationService();
	});

	describe("validateAccount", () => {
		it("should validate correct account data", () => {
			const account: FinancialAccount = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				user_id: "550e8400-e29b-41d4-a716-446655440001",
				truelayer_account_id: "tl_acc_123",
				truelayer_connection_id: "tl_conn_123",
				account_type: "checking",
				account_name: "Current Account",
				institution_name: "Lloyds Bank",
				current_balance: 1500.5,
				is_shared: false,
				last_synced: "2025-10-01T10:00:00Z",
				is_manual: false,
				connection_status: "active",
				encrypted_access_token: "encrypted_token",
			};

			const result = service.validateAccount(account);

			expect(result.valid).toBe(true);
			expect(result.data).toEqual(account);
			expect(result.errors).toHaveLength(0);
		});

		it("should reject account with invalid UUID", () => {
			const account = {
				id: "invalid_uuid",
				user_id: "550e8400-e29b-41d4-a716-446655440001",
				account_type: "checking",
				account_name: "Test Account",
				institution_name: "Test Bank",
				current_balance: 100,
				is_shared: false,
				is_manual: false,
			};

			const result = service.validateAccount(account);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0].field).toBe("id");
		});

		it("should reject account with invalid account type", () => {
			const account = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				user_id: "550e8400-e29b-41d4-a716-446655440001",
				account_type: "invalid_type",
				account_name: "Test Account",
				institution_name: "Test Bank",
				current_balance: 100,
				is_shared: false,
				is_manual: false,
			};

			const result = service.validateAccount(account);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "account_type")).toBe(true);
		});

		it("should warn about negative balance in checking account", () => {
			const account: FinancialAccount = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				user_id: "550e8400-e29b-41d4-a716-446655440001",
				account_type: "checking",
				account_name: "Current Account",
				institution_name: "Test Bank",
				current_balance: -50,
				is_shared: false,
				is_manual: false,
				connection_status: "active",
			};

			const result = service.validateAccount(account);

			expect(result.valid).toBe(true);
			expect(result.warnings.length).toBeGreaterThan(0);
			expect(result.warnings[0].field).toBe("current_balance");
		});

		it("should reject account with extremely negative balance", () => {
			const account: FinancialAccount = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				user_id: "550e8400-e29b-41d4-a716-446655440001",
				account_type: "checking",
				account_name: "Current Account",
				institution_name: "Test Bank",
				current_balance: -15000,
				is_shared: false,
				is_manual: false,
				connection_status: "active",
			};

			const result = service.validateAccount(account);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === "INVALID_BALANCE")).toBe(
				true,
			);
		});
	});

	describe("validateTransaction", () => {
		it("should validate correct transaction data", () => {
			const transaction = {
				account_id: "550e8400-e29b-41d4-a716-446655440000",
				truelayer_transaction_id: "tx_123",
				amount: -25.5,
				merchant_name: "Tesco",
				category: "Groceries",
				date: "2025-10-01",
				description: "Grocery shopping",
				currency: "GBP",
				transaction_type: "DEBIT",
				is_shared_expense: false,
				manual_override: false,
			};

			const result = service.validateTransaction(transaction);

			expect(result.valid).toBe(true);
			expect(result.data).toEqual(transaction);
			expect(result.errors).toHaveLength(0);
		});

		it("should reject transaction with invalid date format", () => {
			const transaction = {
				account_id: "550e8400-e29b-41d4-a716-446655440000",
				amount: -25.5,
				date: "01-10-2025", // Wrong format
				currency: "GBP",
			};

			const result = service.validateTransaction(transaction);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "date")).toBe(true);
		});

		it("should reject transaction with invalid currency code", () => {
			const transaction = {
				account_id: "550e8400-e29b-41d4-a716-446655440000",
				amount: -25.5,
				date: "2025-10-01",
				currency: "GB", // Too short
			};

			const result = service.validateTransaction(transaction);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "currency")).toBe(true);
		});

		it("should reject transaction with non-finite amount", () => {
			const transaction = {
				account_id: "550e8400-e29b-41d4-a716-446655440000",
				amount: Number.POSITIVE_INFINITY,
				date: "2025-10-01",
				currency: "GBP",
			};

			const result = service.validateTransaction(transaction);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "amount")).toBe(true);
		});

		it("should reject transaction with date too far in past", () => {
			const transaction = {
				account_id: "550e8400-e29b-41d4-a716-446655440000",
				amount: -25.5,
				date: "2010-01-01", // More than 10 years ago
				currency: "GBP",
			};

			const result = service.validateTransaction(transaction);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === "INVALID_DATE")).toBe(true);
		});

		it("should reject transaction with excessive amount", () => {
			const transaction = {
				account_id: "550e8400-e29b-41d4-a716-446655440000",
				amount: -2000000, // Over £1M
				date: "2025-10-01",
				currency: "GBP",
			};

			const result = service.validateTransaction(transaction);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === "INVALID_AMOUNT")).toBe(true);
		});

		it("should warn about zero amount transaction", () => {
			const transaction = {
				account_id: "550e8400-e29b-41d4-a716-446655440000",
				amount: 0,
				date: "2025-10-01",
				currency: "GBP",
			};

			const result = service.validateTransaction(transaction);

			expect(result.valid).toBe(true);
			expect(result.warnings.length).toBeGreaterThan(0);
		});
	});

	describe("validateBalance", () => {
		it("should validate correct balance data", () => {
			const balance = {
				currency: "GBP",
				available: 1000,
				current: 1000,
				update_timestamp: "2025-10-01T10:00:00Z",
			};

			const result = service.validateBalance(balance);

			expect(result.valid).toBe(true);
			expect(result.data).toEqual(balance);
		});

		it("should reject balance with invalid currency", () => {
			const balance = {
				currency: "GBPP", // Too long
				available: 1000,
				current: 1000,
				update_timestamp: "2025-10-01T10:00:00Z",
			};

			const result = service.validateBalance(balance);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "currency")).toBe(true);
		});

		it("should reject balance with non-finite values", () => {
			const balance = {
				currency: "GBP",
				available: Number.NaN,
				current: 1000,
				update_timestamp: "2025-10-01T10:00:00Z",
			};

			const result = service.validateBalance(balance);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "available")).toBe(true);
		});

		it("should warn when available exceeds current without overdraft", () => {
			const balance = {
				currency: "GBP",
				available: 1500,
				current: 1000,
				update_timestamp: "2025-10-01T10:00:00Z",
			};

			const result = service.validateBalance(balance);

			expect(result.valid).toBe(true);
			expect(result.warnings.length).toBeGreaterThan(0);
		});
	});

	describe("validateTransactionBatch", () => {
		it("should validate batch of transactions", () => {
			const transactions = [
				{
					account_id: "550e8400-e29b-41d4-a716-446655440000",
					amount: -25.5,
					date: "2025-10-01",
					currency: "GBP",
				},
				{
					account_id: "550e8400-e29b-41d4-a716-446655440000",
					amount: 100,
					date: "2025-10-02",
					currency: "GBP",
				},
			];

			const result = service.validateTransactionBatch(transactions);

			expect(result.valid).toBe(true);
			expect(result.validTransactions).toHaveLength(2);
			expect(result.invalidTransactions).toHaveLength(0);
		});

		it("should separate valid and invalid transactions", () => {
			const transactions = [
				{
					account_id: "550e8400-e29b-41d4-a716-446655440000",
					amount: -25.5,
					date: "2025-10-01",
					currency: "GBP",
				},
				{
					account_id: "550e8400-e29b-41d4-a716-446655440000",
					amount: Number.POSITIVE_INFINITY, // Invalid
					date: "2025-10-02",
					currency: "GBP",
				},
			];

			const result = service.validateTransactionBatch(transactions);

			expect(result.valid).toBe(false);
			expect(result.validTransactions).toHaveLength(1);
			expect(result.invalidTransactions).toHaveLength(1);
			expect(result.invalidTransactions[0].index).toBe(1);
		});
	});

	describe("validateTrueLayerResponse", () => {
		it("should validate TrueLayer response with results array", () => {
			const response = {
				results: [
					{
						account_id: "acc_123",
						display_name: "Test Account",
					},
				],
			};

			const result = service.validateTrueLayerResponse(response, "account");

			expect(result.valid).toBe(true);
		});

		it("should validate TrueLayer response as direct array", () => {
			const response = [
				{
					account_id: "acc_123",
					display_name: "Test Account",
				},
			];

			const result = service.validateTrueLayerResponse(response, "account");

			expect(result.valid).toBe(true);
		});

		it("should detect TrueLayer error response", () => {
			const response = {
				error: "invalid_token",
				error_description: "The access token is invalid",
			};

			const result = service.validateTrueLayerResponse(response, "account");

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === "API_ERROR")).toBe(true);
		});

		it("should reject non-object response", () => {
			const response = "invalid";

			const result = service.validateTrueLayerResponse(response, "account");

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === "INVALID_RESPONSE")).toBe(
				true,
			);
		});
	});
});
