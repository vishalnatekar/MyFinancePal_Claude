import { supabaseAdmin } from "@/lib/supabase";
import { getValidAccessToken } from "@/lib/token-refresh-utils";
import { AccountSyncService } from "@/services/account-sync-service";
import { dataValidationService } from "@/services/data-validation-service";
import { trueLayerDataProcessor } from "@/services/truelayer-data-processor";
import { trueLayerService } from "@/services/truelayer-service";

// Mock dependencies
jest.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: jest.fn(),
	},
}));

jest.mock("@/services/truelayer-service", () => ({
	trueLayerService: {
		getAccountBalance: jest.fn(),
		refreshToken: jest.fn(),
	},
}));

jest.mock("@/lib/token-refresh-utils", () => ({
	getValidAccessToken: jest.fn(),
}));

jest.mock("@/services/data-validation-service", () => ({
	dataValidationService: {
		validateBalance: jest.fn(),
	},
}));

jest.mock("@/services/truelayer-data-processor", () => ({
	trueLayerDataProcessor: {
		normalizeAmount: jest.fn(),
	},
}));

describe("AccountSyncService", () => {
	beforeEach(() => {
		jest.resetAllMocks();

		(getValidAccessToken as jest.Mock).mockResolvedValue("test-access-token");
		(dataValidationService.validateBalance as jest.Mock).mockReturnValue({
			valid: true,
			errors: [],
		});
		(trueLayerDataProcessor.normalizeAmount as jest.Mock).mockImplementation(
			(amount: number) => amount,
		);
		(trueLayerService.getAccountBalance as jest.Mock).mockResolvedValue({
			current: 1250.75,
		});
	});

	describe("syncAccount", () => {
		const mockAccount = {
			id: "account-123",
			user_id: "user-123",
			truelayer_account_id: "tl-account-123",
			truelayer_connection_id: "tl-connection-123",
			encrypted_access_token: "encrypted-token",
			account_type: "checking",
			account_name: "Test Account",
			institution_name: "Test Bank",
			current_balance: 1000.5,
			is_manual: false,
			connection_status: "active",
		};

		it("should sync account successfully", async () => {
			// Mock database responses
			const mockSelect = jest.fn().mockReturnThis();
			const mockEq = jest.fn().mockReturnThis();
			const mockSingle = jest
				.fn()
				.mockResolvedValueOnce({ data: mockAccount, error: null }) // Account fetch
				.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } }) // No in-progress sync
				.mockResolvedValueOnce({
					// Sync history creation
					data: {
						id: "sync-123",
						account_id: "account-123",
						sync_status: "in_progress",
					},
					error: null,
				});

			const mockInsert = jest.fn().mockReturnThis();
			const mockUpdate = jest.fn().mockReturnThis();

			(supabaseAdmin.from as jest.Mock)
				.mockReturnValueOnce({
					select: mockSelect,
				})
				.mockReturnValueOnce({
					select: mockSelect,
				})
				.mockReturnValueOnce({
					insert: mockInsert,
				})
				.mockReturnValueOnce({
					update: mockUpdate,
				})
				.mockReturnValueOnce({
					update: mockUpdate,
				});

			mockSelect
				.mockReturnValueOnce({
					eq: mockEq,
				})
				.mockReturnValueOnce({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							limit: jest.fn().mockReturnValue({
								single: mockSingle,
							}),
						}),
					}),
				});

			mockEq.mockReturnValue({
				single: mockSingle,
			});

			mockInsert.mockReturnValue({
				select: jest.fn().mockReturnValue({
					single: mockSingle,
				}),
			});

			mockUpdate
				.mockReturnValueOnce({
					eq: jest.fn().mockResolvedValue({ error: null }),
				})
				.mockReturnValueOnce({
					eq: jest.fn().mockResolvedValue({ error: null }),
				});

			const result = await AccountSyncService.syncAccount("account-123");

			expect(result.success).toBe(true);
			expect(result.accountId).toBe("account-123");
			expect(result.balanceUpdated).toBe(true);
			expect(result.oldBalance).toBe(1000.5);
			expect(result.newBalance).toBe(1250.75);
		});

		it("should handle account not found", async () => {
			const mockSelect = jest.fn().mockReturnThis();
			const mockEq = jest.fn().mockReturnThis();
			const mockSingle = jest
				.fn()
				.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

			(supabaseAdmin.from as jest.Mock).mockReturnValue({
				select: mockSelect,
			});

			mockSelect.mockReturnValue({
				eq: mockEq,
			});

			mockEq.mockReturnValue({
				single: mockSingle,
			});

			const result = await AccountSyncService.syncAccount(
				"nonexistent-account",
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Account not found");
		});

		it("should skip manual accounts", async () => {
			const manualAccount = { ...mockAccount, is_manual: true };

			const mockSelect = jest.fn().mockReturnThis();
			const mockEq = jest.fn().mockReturnThis();
			const mockSingle = jest
				.fn()
				.mockResolvedValue({ data: manualAccount, error: null });

			(supabaseAdmin.from as jest.Mock).mockReturnValue({
				select: mockSelect,
			});

			mockSelect.mockReturnValue({
				eq: mockEq,
			});

			mockEq.mockReturnValue({
				single: mockSingle,
			});

			const result = await AccountSyncService.syncAccount("account-123");

			expect(result.success).toBe(false);
			expect(result.error).toBe("Cannot sync manual accounts");
		});

		it("should handle sync already in progress", async () => {
			const mockSelect = jest.fn().mockReturnThis();
			const mockEq = jest.fn().mockReturnThis();
			const mockSingle = jest
				.fn()
				.mockResolvedValueOnce({ data: mockAccount, error: null }) // Account fetch
				.mockResolvedValueOnce({
					// In-progress sync found
					data: { id: "existing-sync" },
					error: null,
				});

			(supabaseAdmin.from as jest.Mock)
				.mockReturnValueOnce({
					select: mockSelect,
				})
				.mockReturnValueOnce({
					select: mockSelect,
				});

			mockSelect
				.mockReturnValueOnce({
					eq: mockEq,
				})
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								limit: jest.fn().mockReturnValue({
									single: mockSingle,
								}),
							}),
						}),
					}),
				});

			mockEq.mockReturnValue({
				single: mockSingle,
			});

			const result = await AccountSyncService.syncAccount("account-123");

			expect(result.success).toBe(false);
			expect(result.error).toBe("Sync already in progress");
		});

		it("should handle TrueLayer service errors gracefully", async () => {
			// Setup successful account fetch and sync history creation
			const mockSelect = jest.fn().mockReturnThis();
			const mockEq = jest.fn().mockReturnThis();
			const mockSingle = jest
				.fn()
				.mockResolvedValueOnce({ data: mockAccount, error: null })
				.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })
				.mockResolvedValueOnce({
					data: { id: "sync-123" },
					error: null,
				});

			const mockInsert = jest.fn().mockReturnThis();
			const mockUpdate = jest.fn().mockReturnThis();

			(supabaseAdmin.from as jest.Mock)
				.mockReturnValueOnce({ select: mockSelect })
				.mockReturnValueOnce({ select: mockSelect })
				.mockReturnValueOnce({ insert: mockInsert })
				.mockReturnValueOnce({ update: mockUpdate })
				.mockReturnValueOnce({ update: mockUpdate });

			mockSelect.mockReturnValueOnce({ eq: mockEq }).mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							limit: jest.fn().mockReturnValue({
								single: mockSingle,
							}),
						}),
					}),
				}),
			});

			mockEq.mockReturnValue({ single: mockSingle });

			mockInsert.mockReturnValue({
				select: jest.fn().mockReturnValue({
					single: mockSingle,
				}),
			});

			mockUpdate
				.mockReturnValueOnce({
					eq: jest.fn().mockResolvedValue({ error: null }),
				})
				.mockReturnValueOnce({
					eq: jest.fn().mockResolvedValue({ error: null }),
				});

			(trueLayerService.getAccountBalance as jest.Mock).mockRejectedValueOnce(
				new Error("Account not found"),
			);

			const result = await AccountSyncService.syncAccount("account-123");

			expect(result.success).toBe(false);
			expect(result.error).toBe("Failed to sync with TrueLayer");
		});
	});

	describe("syncUserAccounts", () => {
		it("should sync all user accounts", async () => {
			const mockAccounts = [
				{ id: "account-1", truelayer_connection_id: "connection-1" },
				{ id: "account-2", truelayer_connection_id: "connection-2" },
			];

			const mockSelect = jest.fn().mockReturnThis();
			const mockEq = jest.fn().mockReturnThis();
			const mockNot = jest
				.fn()
				.mockResolvedValue({ data: mockAccounts, error: null });

			(supabaseAdmin.from as jest.Mock).mockReturnValue({
				select: mockSelect,
			});

			mockSelect.mockReturnValue({
				eq: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						not: mockNot,
					}),
				}),
			});

			// Mock individual account syncs
			jest
				.spyOn(AccountSyncService, "syncAccount")
				.mockResolvedValueOnce({ accountId: "account-1", success: true })
				.mockResolvedValueOnce({
					accountId: "account-2",
					success: false,
					error: "Sync failed",
				});

			const result = await AccountSyncService.syncUserAccounts("user-123");

			expect(result.totalAccounts).toBe(2);
			expect(result.successCount).toBe(1);
			expect(result.failureCount).toBe(1);
			expect(result.results).toHaveLength(2);
		});

		it("should handle no accounts", async () => {
			const mockSelect = jest.fn().mockReturnThis();
			const mockNot = jest.fn().mockResolvedValue({ data: [], error: null });

			(supabaseAdmin.from as jest.Mock).mockReturnValue({
				select: mockSelect,
			});

			mockSelect.mockReturnValue({
				eq: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						not: mockNot,
					}),
				}),
			});

			const result = await AccountSyncService.syncUserAccounts("user-123");

			expect(result.totalAccounts).toBe(0);
			expect(result.successCount).toBe(0);
			expect(result.failureCount).toBe(0);
			expect(result.results).toHaveLength(0);
		});
	});

	describe("syncAllAccounts", () => {
		it("should sync accounts for all users", async () => {
			const mockUsersWithAccounts = [
				{ user_id: "user-1" },
				{ user_id: "user-1" }, // Duplicate to test deduplication
				{ user_id: "user-2" },
			];

			const mockSelect = jest.fn().mockReturnThis();
			const mockEq = jest.fn().mockReturnThis();
			const mockNot = jest.fn().mockResolvedValue({
				data: mockUsersWithAccounts,
				error: null,
			});

			(supabaseAdmin.from as jest.Mock).mockReturnValue({
				select: mockSelect,
			});

			mockSelect.mockReturnValue({
				eq: mockEq,
			});

			mockEq.mockReturnValue({
				not: mockNot,
			});

			// Mock user sync results
			jest
				.spyOn(AccountSyncService, "syncUserAccounts")
				.mockResolvedValueOnce({
					totalAccounts: 2,
					successCount: 2,
					failureCount: 0,
					results: [],
					duration: 1000,
				})
				.mockResolvedValueOnce({
					totalAccounts: 1,
					successCount: 0,
					failureCount: 1,
					results: [],
					duration: 500,
				});

			const result = await AccountSyncService.syncAllAccounts();

			expect(result.totalUsers).toBe(2); // Deduplicated
			expect(result.results).toHaveLength(2);
			expect(AccountSyncService.syncUserAccounts).toHaveBeenCalledTimes(2);
		});

		it("should handle no users with accounts", async () => {
			const mockSelect = jest.fn().mockReturnThis();
			const mockEq = jest.fn().mockReturnThis();
			const mockNot = jest.fn().mockResolvedValue({ data: [], error: null });

			(supabaseAdmin.from as jest.Mock).mockReturnValue({
				select: mockSelect,
			});

			mockSelect.mockReturnValue({
				eq: mockEq,
			});

			mockEq.mockReturnValue({
				not: mockNot,
			});

			const result = await AccountSyncService.syncAllAccounts();

			expect(result.totalUsers).toBe(0);
			expect(result.results).toHaveLength(0);
		});
	});
});
