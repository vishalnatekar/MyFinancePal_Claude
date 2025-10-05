import {
	SyncPriority,
	SyncSchedulerService,
} from "@/services/sync-scheduler-service";

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: jest.fn(),
	},
}));

describe("SyncSchedulerService", () => {
	const mockUserId = "user-123";
	const mockAccountId = "account-456";

	beforeEach(() => {
		jest.clearAllMocks();
		SyncSchedulerService.clearSyncHistory();
	});

	describe("canSync", () => {
		it("should allow sync when within limits", () => {
			const result = SyncSchedulerService.canSync(mockUserId, mockAccountId);
			expect(result.allowed).toBe(true);
		});

		it("should prevent sync when already in progress", () => {
			SyncSchedulerService.startSync(mockUserId, mockAccountId);
			const result = SyncSchedulerService.canSync(mockUserId, mockAccountId);

			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("already in progress");
		});

		it("should prevent sync when concurrent limit reached", () => {
			// Start 3 syncs (default concurrent limit)
			SyncSchedulerService.startSync(mockUserId, "account-1");
			SyncSchedulerService.startSync(mockUserId, "account-2");
			SyncSchedulerService.startSync(mockUserId, "account-3");

			const result = SyncSchedulerService.canSync(mockUserId, "account-4", {
				maxSyncsPerHour: 100,
				maxConcurrentSyncs: 3,
				cooldownPeriodMinutes: 5,
			});

			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("concurrent syncs");
		});

		it("should prevent sync when hourly rate limit exceeded", () => {
			// Simulate 60 syncs in the last hour
			for (let i = 0; i < 60; i++) {
				SyncSchedulerService.startSync(mockUserId, `account-${i}`);
				SyncSchedulerService.completeSync(`account-${i}`);
			}

			const result = SyncSchedulerService.canSync(mockUserId, mockAccountId, {
				maxSyncsPerHour: 60,
				maxConcurrentSyncs: 3,
				cooldownPeriodMinutes: 5,
			});

			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("Rate limit exceeded");
			expect(result.retryAfter).toBeDefined();
		});
	});

	describe("determineSyncPriority", () => {
		it("should return HIGH priority when never synced", async () => {
			const priority = await SyncSchedulerService.determineSyncPriority(
				mockAccountId,
			);
			expect(priority).toBe(SyncPriority.HIGH);
		});

		it("should return HIGH priority for recent transactions", async () => {
			const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
			const lastSync = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

			const priority = await SyncSchedulerService.determineSyncPriority(
				mockAccountId,
				recentDate,
				lastSync,
			);
			expect(priority).toBe(SyncPriority.HIGH);
		});

		it("should return LOW priority for recently synced account", async () => {
			const lastSync = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours ago

			const priority = await SyncSchedulerService.determineSyncPriority(
				mockAccountId,
				undefined,
				lastSync,
			);
			expect(priority).toBe(SyncPriority.LOW);
		});

		it("should return NORMAL priority otherwise", async () => {
			const oldTransactionDate = new Date(
				Date.now() - 30 * 24 * 60 * 60 * 1000,
			); // 30 days ago
			const lastSync = new Date(Date.now() - 20 * 60 * 60 * 1000); // 20 hours ago

			const priority = await SyncSchedulerService.determineSyncPriority(
				mockAccountId,
				oldTransactionDate,
				lastSync,
			);
			expect(priority).toBe(SyncPriority.NORMAL);
		});
	});

	describe("calculateNextSyncTime", () => {
		it("should calculate next sync for HIGH priority (30 min)", () => {
			const now = new Date();
			const nextSync = SyncSchedulerService.calculateNextSyncTime(
				SyncPriority.HIGH,
				now,
			);

			const diff = nextSync.getTime() - now.getTime();
			const minutes = diff / (1000 * 60);

			expect(minutes).toBe(30);
		});

		it("should calculate next sync for NORMAL priority (6 hours)", () => {
			const now = new Date();
			const nextSync = SyncSchedulerService.calculateNextSyncTime(
				SyncPriority.NORMAL,
				now,
			);

			const diff = nextSync.getTime() - now.getTime();
			const hours = diff / (1000 * 60 * 60);

			expect(hours).toBe(6);
		});

		it("should calculate next sync for LOW priority (24 hours)", () => {
			const now = new Date();
			const nextSync = SyncSchedulerService.calculateNextSyncTime(
				SyncPriority.LOW,
				now,
			);

			const diff = nextSync.getTime() - now.getTime();
			const hours = diff / (1000 * 60 * 60);

			expect(hours).toBe(24);
		});
	});

	describe("resolveSyncConflict", () => {
		it("should use remote when remote is newer", () => {
			const local = new Date("2025-10-01T12:00:00Z");
			const remote = new Date("2025-10-02T12:00:00Z");

			const resolution = SyncSchedulerService.resolveSyncConflict(
				mockAccountId,
				local,
				remote,
			);

			expect(resolution).toBe("use_remote");
		});

		it("should use local when local is newer", () => {
			const local = new Date("2025-10-02T12:00:00Z");
			const remote = new Date("2025-10-01T12:00:00Z");

			const resolution = SyncSchedulerService.resolveSyncConflict(
				mockAccountId,
				local,
				remote,
			);

			expect(resolution).toBe("use_local");
		});

		it("should merge when timestamps are equal", () => {
			const timestamp = new Date("2025-10-01T12:00:00Z");

			const resolution = SyncSchedulerService.resolveSyncConflict(
				mockAccountId,
				timestamp,
				timestamp,
			);

			expect(resolution).toBe("merge");
		});
	});

	describe("recordSyncStart and recordSyncComplete", () => {
		it("should record sync start", async () => {
			const mockInsert = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					single: jest.fn().mockResolvedValue({
						data: { id: "log-123" },
						error: null,
					}),
				}),
			});

			const mockFrom = jest.fn().mockReturnValue({
				insert: mockInsert,
			});

			(require("@/lib/supabase").supabaseAdmin.from as jest.Mock) = mockFrom;

			const logId = await SyncSchedulerService.recordSyncStart(
				mockAccountId,
				"manual",
			);

			expect(logId).toBe("log-123");
			expect(mockFrom).toHaveBeenCalledWith("data_sync_logs");
		});

		it("should record sync completion", async () => {
			const mockUpdate = jest.fn().mockReturnValue({
				eq: jest.fn().mockResolvedValue({
					error: null,
				}),
			});

			const mockFrom = jest.fn().mockReturnValue({
				update: mockUpdate,
			});

			(require("@/lib/supabase").supabaseAdmin.from as jest.Mock) = mockFrom;

			await SyncSchedulerService.recordSyncComplete("log-123", "completed", 50, 5, []);

			expect(mockFrom).toHaveBeenCalledWith("data_sync_logs");
			expect(mockUpdate).toHaveBeenCalled();
		});
	});

	describe("startSync and completeSync", () => {
		it("should track active syncs", () => {
			SyncSchedulerService.startSync(mockUserId, mockAccountId);

			// Should prevent duplicate sync
			const result = SyncSchedulerService.canSync(mockUserId, mockAccountId);
			expect(result.allowed).toBe(false);

			// Complete sync
			SyncSchedulerService.completeSync(mockAccountId);

			// Should allow sync after completion
			const result2 = SyncSchedulerService.canSync(mockUserId, mockAccountId);
			expect(result2.allowed).toBe(true);
		});
	});
});
