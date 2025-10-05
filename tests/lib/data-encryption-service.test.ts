import { DataEncryptionService } from "@/lib/data-encryption-service";

describe("DataEncryptionService", () => {
	describe("encryptTransactionFields", () => {
		it("should encrypt merchant_name", () => {
			const transaction = {
				merchant_name: "Tesco Store",
				amount: 50.0,
			};

			const encrypted = DataEncryptionService.encryptTransactionFields(transaction);

			expect(encrypted.merchant_name).not.toBe("Tesco Store");
			expect(encrypted.merchant_name).toBeTruthy();
			expect(encrypted.amount).toBe(50.0);
		});

		it("should encrypt description", () => {
			const transaction = {
				description: "Weekly grocery shopping",
				amount: 75.5,
			};

			const encrypted = DataEncryptionService.encryptTransactionFields(transaction);

			expect(encrypted.description).not.toBe("Weekly grocery shopping");
			expect(encrypted.description).toBeTruthy();
			expect(encrypted.amount).toBe(75.5);
		});

		it("should encrypt both merchant_name and description", () => {
			const transaction = {
				merchant_name: "Sainsbury's",
				description: "Groceries",
				amount: 100.0,
			};

			const encrypted = DataEncryptionService.encryptTransactionFields(transaction);

			expect(encrypted.merchant_name).not.toBe("Sainsbury's");
			expect(encrypted.description).not.toBe("Groceries");
			expect(encrypted.amount).toBe(100.0);
		});

		it("should handle null merchant_name", () => {
			const transaction = {
				merchant_name: null as unknown as string,
				description: "Test",
			};

			const encrypted = DataEncryptionService.encryptTransactionFields(transaction);

			expect(encrypted.merchant_name).toBe(null);
			expect(encrypted.description).not.toBe("Test");
		});

		it("should handle undefined fields", () => {
			const transaction = {
				amount: 50.0,
			};

			const encrypted = DataEncryptionService.encryptTransactionFields(transaction);

			expect(encrypted).toEqual({ amount: 50.0 });
		});
	});

	describe("decryptTransactionFields", () => {
		it("should decrypt merchant_name", () => {
			const original = { merchant_name: "Tesco Store" };
			const encrypted = DataEncryptionService.encryptTransactionFields(original);
			const decrypted = DataEncryptionService.decryptTransactionFields(encrypted);

			expect(decrypted.merchant_name).toBe("Tesco Store");
		});

		it("should decrypt description", () => {
			const original = { description: "Weekly grocery shopping" };
			const encrypted = DataEncryptionService.encryptTransactionFields(original);
			const decrypted = DataEncryptionService.decryptTransactionFields(encrypted);

			expect(decrypted.description).toBe("Weekly grocery shopping");
		});

		it("should handle decryption errors gracefully", () => {
			const corrupted = {
				merchant_name: "invalid-encrypted-data",
				description: "also-invalid",
			};

			const decrypted = DataEncryptionService.decryptTransactionFields(corrupted);

			expect(decrypted.merchant_name).toBe("[Encrypted]");
			expect(decrypted.description).toBe("[Encrypted]");
		});

		it("should handle null values", () => {
			const transaction = {
				merchant_name: null as unknown as string,
			};

			const decrypted = DataEncryptionService.decryptTransactionFields(transaction);

			expect(decrypted.merchant_name).toBe(null);
		});
	});

	describe("encryptAccountFields", () => {
		it("should encrypt account_number", () => {
			const account = {
				account_number: "12345678",
				sort_code: "10-20-30",
			};

			const encrypted = DataEncryptionService.encryptAccountFields(account);

			expect(encrypted.account_number).not.toBe("12345678");
			expect(encrypted.sort_code).not.toBe("10-20-30");
		});

		it("should encrypt IBAN", () => {
			const account = {
				iban: "GB82WEST12345698765432",
			};

			const encrypted = DataEncryptionService.encryptAccountFields(account);

			expect(encrypted.iban).not.toBe("GB82WEST12345698765432");
			expect(encrypted.iban).toBeTruthy();
		});

		it("should handle undefined fields", () => {
			const account = {
				balance: 1000,
			};

			const encrypted = DataEncryptionService.encryptAccountFields(account);

			expect(encrypted).toEqual({ balance: 1000 });
		});
	});

	describe("decryptAccountFields", () => {
		it("should decrypt account_number", () => {
			const original = { account_number: "12345678" };
			const encrypted = DataEncryptionService.encryptAccountFields(original);
			const decrypted = DataEncryptionService.decryptAccountFields(encrypted);

			expect(decrypted.account_number).toBe("12345678");
		});

		it("should decrypt IBAN", () => {
			const original = { iban: "GB82WEST12345698765432" };
			const encrypted = DataEncryptionService.encryptAccountFields(original);
			const decrypted = DataEncryptionService.decryptAccountFields(encrypted);

			expect(decrypted.iban).toBe("GB82WEST12345698765432");
		});

		it("should handle decryption errors with masked values", () => {
			const corrupted = {
				account_number: "invalid",
				sort_code: "bad-data",
				iban: "also-bad",
			};

			const decrypted = DataEncryptionService.decryptAccountFields(corrupted);

			expect(decrypted.account_number).toBe("****");
			expect(decrypted.sort_code).toBe("**-**-**");
			expect(decrypted.iban).toBe("****");
		});
	});

	describe("encryptTransactionBatch", () => {
		it("should encrypt multiple transactions", () => {
			const transactions = [
				{ merchant_name: "Tesco", amount: 50 },
				{ merchant_name: "Sainsbury's", amount: 75 },
				{ merchant_name: "Asda", amount: 100 },
			];

			const encrypted = DataEncryptionService.encryptTransactionBatch(transactions);

			expect(encrypted).toHaveLength(3);
			expect(encrypted[0].merchant_name).not.toBe("Tesco");
			expect(encrypted[1].merchant_name).not.toBe("Sainsbury's");
			expect(encrypted[2].merchant_name).not.toBe("Asda");
			expect(encrypted[0].amount).toBe(50);
		});

		it("should handle empty array", () => {
			const encrypted = DataEncryptionService.encryptTransactionBatch([]);
			expect(encrypted).toEqual([]);
		});
	});

	describe("decryptTransactionBatch", () => {
		it("should decrypt multiple transactions", () => {
			const original = [
				{ merchant_name: "Tesco", amount: 50 },
				{ merchant_name: "Sainsbury's", amount: 75 },
			];

			const encrypted = DataEncryptionService.encryptTransactionBatch(original);
			const decrypted = DataEncryptionService.decryptTransactionBatch(encrypted);

			expect(decrypted[0].merchant_name).toBe("Tesco");
			expect(decrypted[1].merchant_name).toBe("Sainsbury's");
			expect(decrypted[0].amount).toBe(50);
		});
	});

	describe("isEncrypted", () => {
		it("should detect encrypted strings", () => {
			const encrypted = DataEncryptionService.encryptString("test data");
			expect(DataEncryptionService.isEncrypted(encrypted)).toBe(true);
		});

		it("should return false for plain text", () => {
			expect(DataEncryptionService.isEncrypted("plain text")).toBe(false);
		});

		it("should return false for null", () => {
			expect(DataEncryptionService.isEncrypted(null)).toBe(false);
		});

		it("should return false for undefined", () => {
			expect(DataEncryptionService.isEncrypted(undefined)).toBe(false);
		});

		it("should return false for short base64", () => {
			expect(DataEncryptionService.isEncrypted("dGVzdA==")).toBe(false);
		});
	});

	describe("encryptString and decryptString", () => {
		it("should encrypt and decrypt a string", () => {
			const original = "sensitive data";
			const encrypted = DataEncryptionService.encryptString(original);
			const decrypted = DataEncryptionService.decryptString(encrypted);

			expect(encrypted).not.toBe(original);
			expect(encrypted).toBeTruthy();
			expect(decrypted).toBe(original);
		});

		it("should handle null values", () => {
			expect(DataEncryptionService.encryptString(null)).toBe(null);
			expect(DataEncryptionService.decryptString(null)).toBe(null);
		});

		it("should handle undefined values", () => {
			expect(DataEncryptionService.encryptString(undefined)).toBe(null);
			expect(DataEncryptionService.decryptString(undefined)).toBe(null);
		});

		it("should handle decryption errors", () => {
			const decrypted = DataEncryptionService.decryptString("invalid-data");
			expect(decrypted).toBe("[Encrypted]");
		});
	});

	describe("round-trip encryption", () => {
		it("should maintain data integrity through encrypt/decrypt cycle", () => {
			const transaction = {
				id: "123",
				merchant_name: "Test Merchant Ltd.",
				description: "Payment for services rendered",
				amount: 150.75,
				date: "2025-10-02",
			};

			const encrypted = DataEncryptionService.encryptTransactionFields(transaction);
			const decrypted = DataEncryptionService.decryptTransactionFields(encrypted);

			expect(decrypted).toEqual(transaction);
		});

		it("should produce different ciphertexts for same plaintext", () => {
			const transaction1 = { merchant_name: "Same Merchant" };
			const transaction2 = { merchant_name: "Same Merchant" };

			const encrypted1 = DataEncryptionService.encryptTransactionFields(transaction1);
			const encrypted2 = DataEncryptionService.encryptTransactionFields(transaction2);

			// Different IVs should produce different ciphertexts
			expect(encrypted1.merchant_name).not.toBe(encrypted2.merchant_name);
		});
	});
});
