import { HistoricalDataService } from "@/services/historical-data-service";

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: jest.fn(),
	},
}));

describe("HistoricalDataService", () => {
	const mockAccountId = "acc-123";
	const mockBalance = 1000.50;
	const mockCurrency = "GBP";

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("recordBalanceSnapshot", () => {
		it("should record a balance snapshot", async () => {
			const mockInsert = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					single: jest.fn().mockResolvedValue({
						data: {
							id: "snapshot-1",
							account_id: mockAccountId,
							balance: mockBalance,
							currency: mockCurrency,
							recorded_at: "2025-10-02T12:00:00Z",
						},
						error: null,
					}),
				}),
			});

			const mockFrom = jest.fn().mockReturnValue({
				insert: mockInsert,
			});

			(require("@/lib/supabase").supabaseAdmin.from as jest.Mock) = mockFrom;

			const result = await HistoricalDataService.recordBalanceSnapshot(
				mockAccountId,
				mockBalance,
				mockCurrency,
			);

			expect(result.account_id).toBe(mockAccountId);
			expect(result.balance).toBe(mockBalance);
			expect(result.currency).toBe(mockCurrency);
			expect(mockFrom).toHaveBeenCalledWith("account_balance_history");
		});

		it("should throw error on database failure", async () => {
			const mockInsert = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					single: jest.fn().mockResolvedValue({
						data: null,
						error: { message: "Database error" },
					}),
				}),
			});

			const mockFrom = jest.fn().mockReturnValue({
				insert: mockInsert,
			});

			(require("@/lib/supabase").supabaseAdmin.from as jest.Mock) = mockFrom;

			await expect(
				HistoricalDataService.recordBalanceSnapshot(
					mockAccountId,
					mockBalance,
					mockCurrency,
				),
			).rejects.toThrow("Failed to record balance snapshot");
		});
	});

	describe("hasBalanceChanged", () => {
		it("should return true when no history exists", async () => {
			const mockSingle = jest.fn().mockResolvedValue({
				data: null,
				error: { message: "No rows found" },
			});

			const mockFrom = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							limit: jest.fn().mockReturnValue({
								single: mockSingle,
							}),
						}),
					}),
				}),
			});

			(require("@/lib/supabase").supabaseAdmin.from as jest.Mock) = mockFrom;

			const result = await HistoricalDataService.hasBalanceChanged(
				mockAccountId,
				mockBalance,
			);

			expect(result).toBe(true);
		});

		it("should return false when balance changed below threshold", async () => {
			const mockSingle = jest.fn().mockResolvedValue({
				data: {
					balance: 1000.50,
					recorded_at: "2025-10-02T12:00:00Z",
				},
				error: null,
			});

			const mockFrom = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							limit: jest.fn().mockReturnValue({
								single: mockSingle,
							}),
						}),
					}),
				}),
			});

			(require("@/lib/supabase").supabaseAdmin.from as jest.Mock) = mockFrom;

			const result = await HistoricalDataService.hasBalanceChanged(
				mockAccountId,
				1000.50, // Same balance
				0.01, // Threshold
			);

			expect(result).toBe(false);
		});

		it("should return true when balance changed above threshold", async () => {
			const mockSingle = jest.fn().mockResolvedValue({
				data: {
					balance: 1000.00,
					recorded_at: "2025-10-02T12:00:00Z",
				},
				error: null,
			});

			const mockFrom = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							limit: jest.fn().mockReturnValue({
								single: mockSingle,
							}),
						}),
					}),
				}),
			});

			(require("@/lib/supabase").supabaseAdmin.from as jest.Mock) = mockFrom;

			const result = await HistoricalDataService.hasBalanceChanged(
				mockAccountId,
				1050.00, // Changed by 50
				0.01, // Threshold
			);

			expect(result).toBe(true);
		});
	});

	describe("getAccountStatistics", () => {
		it("should return zero statistics when no history", async () => {
			const mockFrom = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							gte: jest.fn().mockResolvedValue({
								data: [],
								error: null,
							}),
						}),
					}),
				}),
			});

			(require("@/lib/supabase").supabaseAdmin.from as jest.Mock) = mockFrom;

			const stats = await HistoricalDataService.getAccountStatistics(
				mockAccountId,
				30,
			);

			expect(stats.currentBalance).toBe(0);
			expect(stats.changeAmount).toBe(0);
			expect(stats.changePercent).toBe(0);
		});

		it("should calculate statistics correctly", async () => {
			const mockHistory = [
				{ balance: 1100, recorded_at: "2025-10-02T12:00:00Z" }, // Newest
				{ balance: 1050, recorded_at: "2025-10-01T12:00:00Z" },
				{ balance: 1000, recorded_at: "2025-09-30T12:00:00Z" }, // Oldest
			];

			const mockFrom = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							gte: jest.fn().mockResolvedValue({
								data: mockHistory,
								error: null,
							}),
						}),
					}),
				}),
			});

			(require("@/lib/supabase").supabaseAdmin.from as jest.Mock) = mockFrom;

			const stats = await HistoricalDataService.getAccountStatistics(
				mockAccountId,
				30,
			);

			expect(stats.currentBalance).toBe(1100);
			expect(stats.changeAmount).toBe(100); // 1100 - 1000
			expect(stats.changePercent).toBe(10); // 100/1000 * 100
			expect(stats.highestBalance).toBe(1100);
			expect(stats.lowestBalance).toBe(1000);
			expect(stats.averageBalance).toBe(1050); // (1100+1050+1000)/3
		});
	});

	describe("exportAccountHistory", () => {
		it("should export data in JSON format", async () => {
			const mockHistory = [
				{
					balance: 1000,
					currency: "GBP",
					recorded_at: "2025-10-02T12:00:00Z",
				},
			];

			const mockFrom = jest.fn((table: string) => {
				if (table === "account_balance_history") {
					return {
						select: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								order: jest.fn().mockResolvedValue({
									data: mockHistory,
									error: null,
								}),
							}),
						}),
					};
				}
				return {
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							order: jest.fn().mockResolvedValue({
								data: [],
								error: null,
							}),
						}),
					}),
				};
			});

			(require("@/lib/supabase").supabaseAdmin.from as jest.Mock) = mockFrom;

			const result = await HistoricalDataService.exportAccountHistory(
				mockAccountId,
				{ format: "json" },
			);

			const parsed = JSON.parse(result);
			expect(parsed.accountId).toBe(mockAccountId);
			expect(parsed.balanceHistory).toEqual(mockHistory);
		});

		it("should export data in CSV format", async () => {
			const mockHistory = [
				{
					balance: 1000,
					currency: "GBP",
					recorded_at: "2025-10-02T12:00:00Z",
				},
			];

			const mockFrom = jest.fn((table: string) => {
				if (table === "account_balance_history") {
					return {
						select: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								order: jest.fn().mockResolvedValue({
									data: mockHistory,
									error: null,
								}),
							}),
						}),
					};
				}
				return {
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							order: jest.fn().mockResolvedValue({
								data: [],
								error: null,
							}),
						}),
					}),
				};
			});

			(require("@/lib/supabase").supabaseAdmin.from as jest.Mock) = mockFrom;

			const result = await HistoricalDataService.exportAccountHistory(
				mockAccountId,
				{ format: "csv" },
			);

			expect(result).toContain("Balance History");
			expect(result).toContain("Date,Balance,Currency");
			expect(result).toContain("2025-10-02T12:00:00Z,1000,GBP");
		});
	});
});
