import { TrueLayerDataProcessor } from "@/services/truelayer-data-processor";
import type {
	TrueLayerAccount,
	TrueLayerBalance,
	TrueLayerTransaction,
} from "@/types/truelayer";

describe("TrueLayerDataProcessor", () => {
	let processor: TrueLayerDataProcessor;

	beforeEach(() => {
		processor = new TrueLayerDataProcessor();
	});

	describe("processAccountData", () => {
		it("should transform TrueLayer account to internal model", async () => {
			const rawAccount: TrueLayerAccount = {
				account_id: "tl_acc_123",
				account_type: "TRANSACTION",
				display_name: "Current Account",
				currency: "GBP",
				account_number: {
					sort_code: "123456",
					number: "12345678",
				},
				provider: {
					display_name: "Lloyds Bank",
					provider_id: "lloyds",
					logo_uri: "https://example.com/logo.png",
				},
			};

			const balance: TrueLayerBalance = {
				currency: "GBP",
				available: 1500.5,
				current: 1500.5,
				update_timestamp: "2025-10-01T10:00:00Z",
			};

			const result = await processor.processAccountData(
				rawAccount,
				balance,
				"user_123",
				"conn_123",
				"encrypted_token",
			);

			expect(result.user_id).toBe("user_123");
			expect(result.truelayer_account_id).toBe("tl_acc_123");
			expect(result.truelayer_connection_id).toBe("conn_123");
			expect(result.account_type).toBe("checking");
			expect(result.account_name).toBe("Current Account");
			expect(result.institution_name).toBe("Lloyds Bank");
			expect(result.current_balance).toBe(1500.5);
			expect(result.is_manual).toBe(false);
			expect(result.connection_status).toBe("active");
		});

		it("should normalize account types correctly", async () => {
			const createAccount = (
				type: TrueLayerAccount["account_type"],
			): TrueLayerAccount => ({
				account_id: "test",
				account_type: type,
				display_name: "Test Account",
				currency: "GBP",
				account_number: {},
				provider: {
					display_name: "Test Bank",
					provider_id: "test",
					logo_uri: "test.png",
				},
			});

			const balance: TrueLayerBalance = {
				currency: "GBP",
				available: 100,
				current: 100,
				update_timestamp: "2025-10-01T10:00:00Z",
			};

			const checkingResult = await processor.processAccountData(
				createAccount("TRANSACTION"),
				balance,
				"user_123",
				"conn_123",
				"token",
			);
			expect(checkingResult.account_type).toBe("checking");

			const savingsResult = await processor.processAccountData(
				createAccount("SAVINGS"),
				balance,
				"user_123",
				"conn_123",
				"token",
			);
			expect(savingsResult.account_type).toBe("savings");

			const creditResult = await processor.processAccountData(
				createAccount("CREDIT_CARD"),
				balance,
				"user_123",
				"conn_123",
				"token",
			);
			expect(creditResult.account_type).toBe("credit");
		});
	});

	describe("processTransactionData", () => {
		it("should transform TrueLayer transaction to internal model", async () => {
			const rawTransaction: TrueLayerTransaction = {
				transaction_id: "tx_123",
				timestamp: "2025-10-01T10:00:00Z",
				description: "Tesco Store Purchase",
				amount: 25.5,
				currency: "GBP",
				transaction_type: "DEBIT",
				transaction_category: "GROCERIES",
				transaction_classification: ["shopping", "groceries"],
				account_id: "acc_123",
				merchant_name: "Tesco",
			};

			const result = await processor.processTransactionData(
				rawTransaction,
				"internal_acc_123",
			);

			expect(result.account_id).toBe("internal_acc_123");
			expect(result.truelayer_transaction_id).toBe("tx_123");
			expect(result.amount).toBe(-25.5); // Negative for debit
			expect(result.merchant_name).toBe("Tesco");
			expect(result.category).toBe("Groceries");
			expect(result.date).toBe("2025-10-01");
			expect(result.description).toBe("Tesco Store Purchase");
		});

		it("should handle DEBIT transactions as negative amounts", async () => {
			const debitTransaction: TrueLayerTransaction = {
				transaction_id: "tx_debit",
				timestamp: "2025-10-01T10:00:00Z",
				description: "Test Debit",
				amount: 50,
				currency: "GBP",
				transaction_type: "DEBIT",
				transaction_category: "TEST",
				transaction_classification: [],
				account_id: "acc_123",
			};

			const result = await processor.processTransactionData(
				debitTransaction,
				"internal_acc_123",
			);

			expect(result.amount).toBe(-50);
		});

		it("should handle CREDIT transactions as positive amounts", async () => {
			const creditTransaction: TrueLayerTransaction = {
				transaction_id: "tx_credit",
				timestamp: "2025-10-01T10:00:00Z",
				description: "Test Credit",
				amount: 100,
				currency: "GBP",
				transaction_type: "CREDIT",
				transaction_category: "TEST",
				transaction_classification: [],
				account_id: "acc_123",
			};

			const result = await processor.processTransactionData(
				creditTransaction,
				"internal_acc_123",
			);

			expect(result.amount).toBe(100);
		});

		it("should handle missing merchant name", async () => {
			const transaction: TrueLayerTransaction = {
				transaction_id: "tx_no_merchant",
				timestamp: "2025-10-01T10:00:00Z",
				description: "Direct Debit",
				amount: 30,
				currency: "GBP",
				transaction_type: "DEBIT",
				transaction_category: "BILLS",
				transaction_classification: [],
				account_id: "acc_123",
			};

			const result = await processor.processTransactionData(
				transaction,
				"internal_acc_123",
			);

			expect(result.merchant_name).toBeNull();
		});

		it("should normalize category names", async () => {
			const transaction: TrueLayerTransaction = {
				transaction_id: "tx_cat",
				timestamp: "2025-10-01T10:00:00Z",
				description: "Test",
				amount: 10,
				currency: "GBP",
				transaction_type: "DEBIT",
				transaction_category: "RESTAURANTS_AND_CAFES",
				transaction_classification: [],
				account_id: "acc_123",
			};

			const result = await processor.processTransactionData(
				transaction,
				"internal_acc_123",
			);

			expect(result.category).toBe("Restaurants And Cafes");
		});
	});

	describe("processTransactionBatch", () => {
		it("should process multiple transactions", async () => {
			const rawTransactions: TrueLayerTransaction[] = [
				{
					transaction_id: "tx_1",
					timestamp: "2025-10-01T10:00:00Z",
					description: "Transaction 1",
					amount: 10,
					currency: "GBP",
					transaction_type: "DEBIT",
					transaction_category: "TEST",
					transaction_classification: [],
					account_id: "acc_123",
				},
				{
					transaction_id: "tx_2",
					timestamp: "2025-10-02T10:00:00Z",
					description: "Transaction 2",
					amount: 20,
					currency: "GBP",
					transaction_type: "CREDIT",
					transaction_category: "TEST",
					transaction_classification: [],
					account_id: "acc_123",
				},
			];

			const results = await processor.processTransactionBatch(
				rawTransactions,
				"internal_acc_123",
			);

			expect(results).toHaveLength(2);
			expect(results[0].truelayer_transaction_id).toBe("tx_1");
			expect(results[1].truelayer_transaction_id).toBe("tx_2");
		});
	});

	describe("validateBalanceData", () => {
		it("should validate correct balance data", () => {
			const balance: TrueLayerBalance = {
				currency: "GBP",
				available: 100,
				current: 100,
				update_timestamp: "2025-10-01T10:00:00Z",
			};

			expect(processor.validateBalanceData(balance)).toBe(true);
		});

		it("should reject invalid currency code", () => {
			const balance: TrueLayerBalance = {
				currency: "GB", // Invalid - should be 3 characters
				available: 100,
				current: 100,
				update_timestamp: "2025-10-01T10:00:00Z",
			};

			expect(processor.validateBalanceData(balance)).toBe(false);
		});

		it("should reject non-finite balance", () => {
			const balance: TrueLayerBalance = {
				currency: "GBP",
				available: Number.POSITIVE_INFINITY,
				current: Number.POSITIVE_INFINITY,
				update_timestamp: "2025-10-01T10:00:00Z",
			};

			expect(processor.validateBalanceData(balance)).toBe(false);
		});
	});

	describe("validateTransactionData", () => {
		it("should validate correct transaction data", () => {
			const transaction: TrueLayerTransaction = {
				transaction_id: "tx_123",
				timestamp: "2025-10-01T10:00:00Z",
				description: "Test",
				amount: 100,
				currency: "GBP",
				transaction_type: "DEBIT",
				transaction_category: "TEST",
				transaction_classification: [],
				account_id: "acc_123",
			};

			expect(processor.validateTransactionData(transaction)).toBe(true);
		});

		it("should reject missing transaction ID", () => {
			const transaction = {
				timestamp: "2025-10-01T10:00:00Z",
				description: "Test",
				amount: 100,
				currency: "GBP",
				transaction_type: "DEBIT",
				transaction_category: "TEST",
				transaction_classification: [],
				account_id: "acc_123",
			} as TrueLayerTransaction;

			expect(processor.validateTransactionData(transaction)).toBe(false);
		});

		it("should reject invalid amount", () => {
			const transaction: TrueLayerTransaction = {
				transaction_id: "tx_123",
				timestamp: "2025-10-01T10:00:00Z",
				description: "Test",
				amount: Number.NaN,
				currency: "GBP",
				transaction_type: "DEBIT",
				transaction_category: "TEST",
				transaction_classification: [],
				account_id: "acc_123",
			};

			expect(processor.validateTransactionData(transaction)).toBe(false);
		});

		it("should reject invalid currency code", () => {
			const transaction: TrueLayerTransaction = {
				transaction_id: "tx_123",
				timestamp: "2025-10-01T10:00:00Z",
				description: "Test",
				amount: 100,
				currency: "GB",
				transaction_type: "DEBIT",
				transaction_category: "TEST",
				transaction_classification: [],
				account_id: "acc_123",
			};

			expect(processor.validateTransactionData(transaction)).toBe(false);
		});

		it("should reject invalid transaction type", () => {
			const transaction = {
				transaction_id: "tx_123",
				timestamp: "2025-10-01T10:00:00Z",
				description: "Test",
				amount: 100,
				currency: "GBP",
				transaction_type: "INVALID",
				transaction_category: "TEST",
				transaction_classification: [],
				account_id: "acc_123",
			} as unknown as TrueLayerTransaction;

			expect(processor.validateTransactionData(transaction)).toBe(false);
		});
	});
});
