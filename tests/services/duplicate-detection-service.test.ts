import {
	DuplicateDetectionService,
	type DuplicateCluster,
} from "@/services/duplicate-detection-service";
import type { ProcessedTransaction } from "@/services/truelayer-data-processor";

describe("DuplicateDetectionService", () => {
	let service: DuplicateDetectionService;

	beforeEach(() => {
		service = new DuplicateDetectionService();
	});

	const createMockTransaction = (
		overrides: Partial<ProcessedTransaction> = {},
	): ProcessedTransaction => ({
		account_id: "acc_123",
		truelayer_transaction_id: `tx_${Date.now()}_${Math.random()}`,
		amount: -25.5,
		merchant_name: "Tesco",
		category: "Groceries",
		date: "2025-10-01",
		description: "Grocery shopping",
		currency: "GBP",
		transaction_type: "DEBIT",
		is_shared_expense: false,
		manual_override: false,
		...overrides,
	});

	describe("generateFingerprint", () => {
		it("should generate consistent fingerprint for same transaction", () => {
			const tx1 = createMockTransaction();
			const tx2 = { ...tx1 };

			const fp1 = service.generateFingerprint(tx1);
			const fp2 = service.generateFingerprint(tx2);

			expect(fp1).toBe(fp2);
		});

		it("should generate different fingerprints for different transactions", () => {
			const tx1 = createMockTransaction({ amount: -25.5 });
			const tx2 = createMockTransaction({ amount: -30.0 });

			const fp1 = service.generateFingerprint(tx1);
			const fp2 = service.generateFingerprint(tx2);

			expect(fp1).not.toBe(fp2);
		});

		it("should normalize amount for fingerprint", () => {
			const tx1 = createMockTransaction({ amount: -25.5 });
			const tx2 = createMockTransaction({ amount: 25.5 }); // Same absolute value

			const fp1 = service.generateFingerprint(tx1);
			const fp2 = service.generateFingerprint(tx2);

			expect(fp1).toBe(fp2);
		});
	});

	describe("generateFuzzyFingerprint", () => {
		it("should match similar amounts", () => {
			const tx1 = createMockTransaction({ amount: -25.3 });
			const tx2 = createMockTransaction({ amount: -25.4 });

			const fp1 = service.generateFuzzyFingerprint(tx1);
			const fp2 = service.generateFuzzyFingerprint(tx2);

			expect(fp1).toBe(fp2); // Should round to same amount (25)
		});

		it("should simplify merchant names", () => {
			const tx1 = createMockTransaction({ merchant_name: "Tesco PLC" });
			const tx2 = createMockTransaction({ merchant_name: "Tesco Ltd" });

			const fp1 = service.generateFuzzyFingerprint(tx1);
			const fp2 = service.generateFuzzyFingerprint(tx2);

			// Should be similar due to merchant name simplification
			expect(fp1).toBe(fp2);
		});
	});

	describe("detectDuplicate", () => {
		it("should detect exact duplicate", async () => {
			const tx1 = createMockTransaction({
				truelayer_transaction_id: "tx_original",
			});
			const tx2 = createMockTransaction({
				truelayer_transaction_id: "tx_duplicate",
			});

			const result = await service.detectDuplicate(tx2, [tx1]);

			expect(result.isDuplicate).toBe(true);
			expect(result.duplicateOf).toBe("tx_original");
			expect(result.similarityScore).toBe(1.0);
		});

		it("should not detect non-duplicate", async () => {
			const tx1 = createMockTransaction({
				amount: -25.5,
				date: "2025-10-01",
			});
			const tx2 = createMockTransaction({
				amount: -50.0,
				date: "2025-10-15",
			});

			const result = await service.detectDuplicate(tx2, [tx1]);

			expect(result.isDuplicate).toBe(false);
		});

		it("should detect fuzzy duplicate with similar amounts", async () => {
			const tx1 = createMockTransaction({
				truelayer_transaction_id: "tx_original",
				amount: -25.4,
				merchant_name: "Tesco Store",
			});
			const tx2 = createMockTransaction({
				truelayer_transaction_id: "tx_duplicate",
				amount: -25.6,
				merchant_name: "Tesco Store",
			});

			const result = await service.detectDuplicate(tx2, [tx1]);

			expect(result.isDuplicate).toBe(true);
			expect(result.similarityScore).toBeGreaterThan(0.85);
		});

		it("should detect duplicates within date window", async () => {
			const tx1 = createMockTransaction({
				truelayer_transaction_id: "tx_original",
				date: "2025-10-01",
				amount: -25.5,
				merchant_name: "Tesco",
			});
			const tx2 = createMockTransaction({
				truelayer_transaction_id: "tx_duplicate",
				date: "2025-10-02", // 1 day later
				amount: -25.5,
				merchant_name: "Tesco",
			});

			const result = await service.detectDuplicate(tx2, [tx1]);

			expect(result.isDuplicate).toBe(true);
			expect(result.similarityScore).toBeGreaterThan(0.9);
		});
	});

	describe("findDuplicatesInBatch", () => {
		it("should find duplicate clusters in batch", async () => {
			const tx1 = createMockTransaction({
				truelayer_transaction_id: "tx_1",
				amount: -25.5,
			});
			const tx2 = createMockTransaction({
				truelayer_transaction_id: "tx_2",
				amount: -25.5,
			});
			const tx3 = createMockTransaction({
				truelayer_transaction_id: "tx_3",
				amount: -50.0, // Different amount
			});

			const clusters = await service.findDuplicatesInBatch([tx1, tx2, tx3]);

			expect(clusters.length).toBeGreaterThan(0);
			const duplicateCluster = clusters.find(
				(c) => c.transactions.length === 2,
			);
			expect(duplicateCluster).toBeDefined();
			expect(duplicateCluster?.confidence).toBe("high");
		});

		it("should return empty array when no duplicates", async () => {
			const tx1 = createMockTransaction({
				amount: -25.5,
				date: "2025-10-01",
			});
			const tx2 = createMockTransaction({
				amount: -50.0,
				date: "2025-10-15",
			});

			const clusters = await service.findDuplicatesInBatch([tx1, tx2]);

			expect(clusters).toHaveLength(0);
		});

		it("should handle large batches efficiently", async () => {
			const transactions = Array.from({ length: 100 }, (_, i) =>
				createMockTransaction({
					truelayer_transaction_id: `tx_${i}`,
					amount: -(i % 10) * 10, // Create some duplicates
				}),
			);

			const clusters = await service.findDuplicatesInBatch(transactions);

			expect(clusters).toBeDefined();
			expect(Array.isArray(clusters)).toBe(true);
		});
	});

	describe("resolveDuplicates", () => {
		it("should keep latest transaction", async () => {
			const cluster: DuplicateCluster = {
				clusterId: "cluster_1",
				transactions: [
					{
						transactionId: "tx_old",
						fingerprint: "fp_old",
						data: createMockTransaction({ date: "2025-09-01" }),
					},
					{
						transactionId: "tx_new",
						fingerprint: "fp_new",
						data: createMockTransaction({ date: "2025-10-01" }),
					},
				],
				confidence: "high",
			};

			const result = await service.resolveDuplicates(cluster, "keep_latest");

			expect(result.keep).toContain("tx_new");
			expect(result.remove).toContain("tx_old");
			expect(result.flag).toHaveLength(0);
		});

		it("should keep oldest transaction", async () => {
			const cluster: DuplicateCluster = {
				clusterId: "cluster_1",
				transactions: [
					{
						transactionId: "tx_old",
						fingerprint: "fp_old",
						data: createMockTransaction({ date: "2025-09-01" }),
					},
					{
						transactionId: "tx_new",
						fingerprint: "fp_new",
						data: createMockTransaction({ date: "2025-10-01" }),
					},
				],
				confidence: "high",
			};

			const result = await service.resolveDuplicates(cluster, "keep_oldest");

			expect(result.keep).toContain("tx_old");
			expect(result.remove).toContain("tx_new");
		});

		it("should flag for manual review", async () => {
			const cluster: DuplicateCluster = {
				clusterId: "cluster_1",
				transactions: [
					{
						transactionId: "tx_1",
						fingerprint: "fp_1",
						data: createMockTransaction(),
					},
					{
						transactionId: "tx_2",
						fingerprint: "fp_2",
						data: createMockTransaction(),
					},
				],
				confidence: "low",
			};

			const result = await service.resolveDuplicates(cluster, "flag");

			expect(result.keep).toHaveLength(0);
			expect(result.remove).toHaveLength(0);
			expect(result.flag).toContain("tx_1");
			expect(result.flag).toContain("tx_2");
		});

		it("should merge by keeping most complete transaction", async () => {
			const cluster: DuplicateCluster = {
				clusterId: "cluster_1",
				transactions: [
					{
						transactionId: "tx_incomplete",
						fingerprint: "fp_1",
						data: createMockTransaction({
							merchant_name: null,
							category: "Uncategorized",
							description: "",
						}),
					},
					{
						transactionId: "tx_complete",
						fingerprint: "fp_2",
						data: createMockTransaction({
							merchant_name: "Tesco",
							category: "Groceries",
							description: "Weekly shopping",
						}),
					},
				],
				confidence: "high",
			};

			const result = await service.resolveDuplicates(cluster, "merge");

			expect(result.keep).toContain("tx_complete");
			expect(result.remove).toContain("tx_incomplete");
		});
	});
});
