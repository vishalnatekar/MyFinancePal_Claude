import {
	AccountCategorizationService,
	type AccountType,
} from "@/services/account-categorization-service";
import type { TrueLayerAccount } from "@/types/truelayer";

describe("AccountCategorizationService", () => {
	let service: AccountCategorizationService;

	beforeEach(() => {
		service = new AccountCategorizationService();
	});

	const createMockAccount = (
		overrides: Partial<TrueLayerAccount> = {},
	): TrueLayerAccount => ({
		account_id: "acc_123",
		account_type: "TRANSACTION",
		display_name: "Test Account",
		currency: "GBP",
		account_number: {},
		provider: {
			display_name: "Test Bank",
			provider_id: "test_bank",
			logo_uri: "test.png",
		},
		...overrides,
	});

	describe("detectAccountType", () => {
		it("should detect checking account from TRANSACTION type", () => {
			const account = createMockAccount({
				account_type: "TRANSACTION",
			});

			const type = service.detectAccountType(account);
			expect(type).toBe("checking");
		});

		it("should detect savings account from SAVINGS type", () => {
			const account = createMockAccount({
				account_type: "SAVINGS",
			});

			const type = service.detectAccountType(account);
			expect(type).toBe("savings");
		});

		it("should detect credit card from CREDIT_CARD type", () => {
			const account = createMockAccount({
				account_type: "CREDIT_CARD",
			});

			const type = service.detectAccountType(account);
			expect(type).toBe("credit");
		});

		it("should detect savings from account name", () => {
			const account = createMockAccount({
				account_type: "TRANSACTION",
				display_name: "Easy Access Saver",
			});

			const type = service.detectAccountType(account);
			expect(type).toBe("savings");
		});

		it("should detect savings from ISA in name", () => {
			const account = createMockAccount({
				display_name: "Cash ISA",
			});

			const type = service.detectAccountType(account);
			expect(type).toBe("savings");
		});

		it("should apply Lloyds specific rules", () => {
			const account = createMockAccount({
				display_name: "Club Lloyds",
				provider: {
					display_name: "Lloyds Bank",
					provider_id: "lloyds",
					logo_uri: "test.png",
				},
			});

			const type = service.detectAccountType(account);
			expect(type).toBe("savings");
		});

		it("should apply Monzo pot rules", () => {
			const account = createMockAccount({
				display_name: "Holiday Pot",
				provider: {
					display_name: "Monzo",
					provider_id: "monzo",
					logo_uri: "test.png",
				},
			});

			const type = service.detectAccountType(account);
			expect(type).toBe("savings");
		});
	});

	describe("validateAccountType", () => {
		it("should validate checking account", () => {
			const result = service.validateAccountType("checking", {
				balance: 500,
				hasOverdraft: true,
				hasTransactions: true,
			});

			expect(result.valid).toBe(true);
			expect(result.confidence).toBe("high");
		});

		it("should validate savings account without overdraft", () => {
			const result = service.validateAccountType("savings", {
				balance: 5000,
				hasOverdraft: false,
				hasTransactions: true,
			});

			expect(result.valid).toBe(true);
			expect(result.confidence).toBe("high");
		});

		it("should invalidate savings account with overdraft", () => {
			const result = service.validateAccountType("savings", {
				balance: 500,
				hasOverdraft: true,
				hasTransactions: true,
			});

			expect(result.valid).toBe(false);
			expect(result.suggestedType).toBe("checking");
		});

		it("should validate credit card", () => {
			const result = service.validateAccountType("credit", {
				balance: -500,
				hasOverdraft: false,
				hasTransactions: true,
			});

			expect(result.valid).toBe(true);
			expect(result.confidence).toBe("high");
		});

		it("should suggest reclassification for credit card with high balance", () => {
			const result = service.validateAccountType("credit", {
				balance: 5000,
				hasOverdraft: false,
				hasTransactions: true,
			});

			expect(result.valid).toBe(false);
			expect(result.suggestedType).toBe("checking");
		});
	});

	describe("getAccountTypeDisplayName", () => {
		it("should return correct display names", () => {
			expect(service.getAccountTypeDisplayName("checking")).toBe(
				"Current Account",
			);
			expect(service.getAccountTypeDisplayName("savings")).toBe(
				"Savings Account",
			);
			expect(service.getAccountTypeDisplayName("credit")).toBe("Credit Card");
			expect(service.getAccountTypeDisplayName("investment")).toBe(
				"Investment Account",
			);
		});
	});

	describe("getAccountTypeIcon", () => {
		it("should return icons for account types", () => {
			expect(service.getAccountTypeIcon("checking")).toBeTruthy();
			expect(service.getAccountTypeIcon("savings")).toBeTruthy();
			expect(service.getAccountTypeIcon("credit")).toBeTruthy();
			expect(service.getAccountTypeIcon("investment")).toBeTruthy();
		});
	});

	describe("getSupportedAccountTypes", () => {
		it("should return all supported account types", () => {
			const types = service.getSupportedAccountTypes();

			expect(types).toContain("checking");
			expect(types).toContain("savings");
			expect(types).toContain("credit");
			expect(types).toContain("investment");
			expect(types.length).toBe(4);
		});
	});

	describe("suggestAccountTypeFromUsage", () => {
		it("should suggest checking for high transaction count", () => {
			const type = service.suggestAccountTypeFromUsage({
				transactionCount: 50,
				averageBalance: 500,
				withdrawalCount: 30,
				depositCount: 20,
			});

			expect(type).toBe("checking");
		});

		it("should suggest savings for low transactions and high balance", () => {
			const type = service.suggestAccountTypeFromUsage({
				transactionCount: 2,
				averageBalance: 5000,
				withdrawalCount: 1,
				depositCount: 1,
			});

			expect(type).toBe("savings");
		});

		it("should suggest checking for mostly withdrawals", () => {
			const type = service.suggestAccountTypeFromUsage({
				transactionCount: 15,
				averageBalance: 500,
				withdrawalCount: 12,
				depositCount: 3,
			});

			expect(type).toBe("checking");
		});

		it("should default to checking", () => {
			const type = service.suggestAccountTypeFromUsage({
				transactionCount: 10,
				averageBalance: 500,
				withdrawalCount: 5,
				depositCount: 5,
			});

			expect(type).toBe("checking");
		});
	});
});
