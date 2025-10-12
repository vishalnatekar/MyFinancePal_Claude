/**
 * Integration tests for Row Level Security policies with transaction sharing
 * Tests that RLS policies correctly enforce transaction-level privacy
 */

import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";

// Test environment configuration
const supabaseUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseAnonKey =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "test-anon-key";

describe("RLS Policies: Transaction Sharing", () => {
	let adminClient: ReturnType<typeof createClient<Database>>;
	let user1Client: ReturnType<typeof createClient<Database>>;
	let user2Client: ReturnType<typeof createClient<Database>>;

	let user1Id: string;
	let user2Id: string;
	let householdId: string;
	let account1Id: string;
	let account2Id: string;
	let sharedTransactionId: string;
	let privateTransactionId: string;

	beforeAll(async () => {
		// Create admin client
		adminClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

		// Create test users
		const { data: user1 } = await adminClient.auth.signUp({
			email: "user1-sharing-test@example.com",
			password: "password123",
		});
		user1Id = user1?.user?.id || "";

		const { data: user2 } = await adminClient.auth.signUp({
			email: "user2-sharing-test@example.com",
			password: "password123",
		});
		user2Id = user2?.user?.id || "";

		// Create authenticated clients for each user
		user1Client = createClient<Database>(supabaseUrl, supabaseAnonKey);
		await user1Client.auth.signInWithPassword({
			email: "user1-sharing-test@example.com",
			password: "password123",
		});

		user2Client = createClient<Database>(supabaseUrl, supabaseAnonKey);
		await user2Client.auth.signInWithPassword({
			email: "user2-sharing-test@example.com",
			password: "password123",
		});

		// Create a household
		const { data: household } = await user1Client
			.from("households")
			.insert({
				name: "Test Family",
				created_by: user1Id,
			})
			.select()
			.single();
		householdId = household?.id || "";

		// Add both users to household
		await user1Client.from("household_members").insert([
			{ household_id: householdId, user_id: user1Id, role: "admin" },
			{ household_id: householdId, user_id: user2Id, role: "member" },
		]);

		// Create financial accounts for each user
		const { data: account1 } = await user1Client
			.from("financial_accounts")
			.insert({
				user_id: user1Id,
				account_name: "User 1 Checking",
				account_type: "checking",
				provider: "manual",
			})
			.select()
			.single();
		account1Id = account1?.id || "";

		const { data: account2 } = await user2Client
			.from("financial_accounts")
			.insert({
				user_id: user2Id,
				account_name: "User 2 Checking",
				account_type: "checking",
				provider: "manual",
			})
			.select()
			.single();
		account2Id = account2?.id || "";

		// Create shared transaction
		const { data: sharedTx } = await user1Client
			.from("transactions")
			.insert({
				account_id: account1Id,
				amount: -50.0,
				merchant_name: "Tesco",
				category: "groceries",
				date: "2025-01-15",
				is_shared_expense: true,
				shared_with_household_id: householdId,
				shared_by: user1Id,
				shared_at: new Date().toISOString(),
			})
			.select()
			.single();
		sharedTransactionId = sharedTx?.id || "";

		// Create private transaction
		const { data: privateTx } = await user1Client
			.from("transactions")
			.insert({
				account_id: account1Id,
				amount: -25.0,
				merchant_name: "Bar",
				category: "entertainment",
				date: "2025-01-16",
				is_shared_expense: false,
				shared_with_household_id: null,
			})
			.select()
			.single();
		privateTransactionId = privateTx?.id || "";
	});

	afterAll(async () => {
		// Clean up test data
		await adminClient
			.from("transactions")
			.delete()
			.in("id", [sharedTransactionId, privateTransactionId]);
		await adminClient
			.from("household_members")
			.delete()
			.eq("household_id", householdId);
		await adminClient.from("households").delete().eq("id", householdId);
		await adminClient
			.from("financial_accounts")
			.delete()
			.in("id", [account1Id, account2Id]);

		// Note: In real tests, you might want to delete users too, but Supabase
		// requires admin privileges for that
	});

	describe("Own Transactions", () => {
		it("should allow user to view their own private transactions", async () => {
			const { data, error } = await user1Client
				.from("transactions")
				.select("*")
				.eq("id", privateTransactionId)
				.single();

			expect(error).toBeNull();
			expect(data).not.toBeNull();
			expect(data?.id).toBe(privateTransactionId);
			expect(data?.merchant_name).toBe("Bar");
		});

		it("should allow user to view their own shared transactions", async () => {
			const { data, error } = await user1Client
				.from("transactions")
				.select("*")
				.eq("id", sharedTransactionId)
				.single();

			expect(error).toBeNull();
			expect(data).not.toBeNull();
			expect(data?.id).toBe(sharedTransactionId);
			expect(data?.merchant_name).toBe("Tesco");
		});

		it("should allow user to update their own transactions", async () => {
			const { error } = await user1Client
				.from("transactions")
				.update({ category: "shopping" })
				.eq("id", privateTransactionId);

			expect(error).toBeNull();

			// Verify the update
			const { data } = await user1Client
				.from("transactions")
				.select("category")
				.eq("id", privateTransactionId)
				.single();

			expect(data?.category).toBe("shopping");
		});
	});

	describe("Shared Transactions", () => {
		it("should allow household member to view shared transactions", async () => {
			const { data, error } = await user2Client
				.from("transactions")
				.select("*")
				.eq("id", sharedTransactionId)
				.single();

			expect(error).toBeNull();
			expect(data).not.toBeNull();
			expect(data?.id).toBe(sharedTransactionId);
			expect(data?.is_shared_expense).toBe(true);
			expect(data?.shared_with_household_id).toBe(householdId);
		});

		it("should prevent household member from viewing private transactions", async () => {
			const { data, error } = await user2Client
				.from("transactions")
				.select("*")
				.eq("id", privateTransactionId)
				.single();

			// Should either get null data or a permission error
			expect(data).toBeNull();
		});

		it("should prevent household member from modifying others' transactions", async () => {
			const { error } = await user2Client
				.from("transactions")
				.update({ category: "modified" })
				.eq("id", sharedTransactionId);

			// Update should fail due to RLS policy
			expect(error).not.toBeNull();
		});

		it("should allow filtering transactions by household", async () => {
			const { data, error } = await user2Client
				.from("transactions")
				.select("*")
				.eq("shared_with_household_id", householdId);

			expect(error).toBeNull();
			expect(data).not.toBeNull();
			expect(data?.length).toBeGreaterThan(0);
			expect(
				data?.every((tx) => tx.shared_with_household_id === householdId),
			).toBe(true);
		});
	});

	describe("Transaction Sharing History", () => {
		it("should allow transaction owner to view sharing history", async () => {
			// Create a sharing history entry
			const { data: historyEntry } = await user1Client
				.from("transaction_sharing_history")
				.insert({
					transaction_id: sharedTransactionId,
					household_id: householdId,
					action: "shared",
					changed_by: user1Id,
				})
				.select()
				.single();

			// Owner should be able to view it
			const { data, error } = await user1Client
				.from("transaction_sharing_history")
				.select("*")
				.eq("transaction_id", sharedTransactionId);

			expect(error).toBeNull();
			expect(data).not.toBeNull();
			expect(data?.length).toBeGreaterThan(0);
		});

		it("should allow household members to view sharing history", async () => {
			const { data, error } = await user2Client
				.from("transaction_sharing_history")
				.select("*")
				.eq("household_id", householdId);

			expect(error).toBeNull();
			expect(data).not.toBeNull();
		});

		it("should prevent non-owners from inserting sharing history for others' transactions", async () => {
			const { error } = await user2Client
				.from("transaction_sharing_history")
				.insert({
					transaction_id: privateTransactionId, // User 2 doesn't own this
					household_id: householdId,
					action: "shared",
					changed_by: user2Id,
				});

			expect(error).not.toBeNull();
		});
	});

	describe("Cross-Household Privacy", () => {
		let otherHouseholdId: string;
		let otherHouseholdTransactionId: string;

		beforeAll(async () => {
			// Create another household without user2
			const { data: otherHousehold } = await user1Client
				.from("households")
				.insert({
					name: "Other Family",
					created_by: user1Id,
				})
				.select()
				.single();
			otherHouseholdId = otherHousehold?.id || "";

			await user1Client.from("household_members").insert({
				household_id: otherHouseholdId,
				user_id: user1Id,
				role: "admin",
			});

			// Create transaction shared with other household
			const { data: otherTx } = await user1Client
				.from("transactions")
				.insert({
					account_id: account1Id,
					amount: -100.0,
					merchant_name: "Sainsbury's",
					category: "groceries",
					date: "2025-01-17",
					is_shared_expense: true,
					shared_with_household_id: otherHouseholdId,
					shared_by: user1Id,
				})
				.select()
				.single();
			otherHouseholdTransactionId = otherTx?.id || "";
		});

		afterAll(async () => {
			await adminClient
				.from("transactions")
				.delete()
				.eq("id", otherHouseholdTransactionId);
			await adminClient
				.from("household_members")
				.delete()
				.eq("household_id", otherHouseholdId);
			await adminClient.from("households").delete().eq("id", otherHouseholdId);
		});

		it("should prevent user from viewing transactions from households they don't belong to", async () => {
			const { data, error } = await user2Client
				.from("transactions")
				.select("*")
				.eq("id", otherHouseholdTransactionId)
				.single();

			// User 2 is not in otherHousehold, so should not see this transaction
			expect(data).toBeNull();
		});

		it("should only return transactions from user's households", async () => {
			const { data: user2Transactions } = await user2Client
				.from("transactions")
				.select("*")
				.eq("is_shared_expense", true);

			// Should only see transactions from householdId (not otherHouseholdId)
			const householdIds = user2Transactions?.map(
				(tx) => tx.shared_with_household_id,
			);
			expect(householdIds).not.toContain(otherHouseholdId);
			expect(householdIds).toContain(householdId);
		});
	});

	describe("Unsharing Transactions", () => {
		let testTransactionId: string;

		beforeAll(async () => {
			// Create a transaction that will be unshared
			const { data } = await user1Client
				.from("transactions")
				.insert({
					account_id: account1Id,
					amount: -30.0,
					merchant_name: "Test Merchant",
					category: "other",
					date: "2025-01-18",
					is_shared_expense: true,
					shared_with_household_id: householdId,
					shared_by: user1Id,
				})
				.select()
				.single();
			testTransactionId = data?.id || "";
		});

		afterAll(async () => {
			await adminClient
				.from("transactions")
				.delete()
				.eq("id", testTransactionId);
		});

		it("should hide transaction from household members after unsharing", async () => {
			// User 2 should initially see the transaction
			const { data: beforeData } = await user2Client
				.from("transactions")
				.select("*")
				.eq("id", testTransactionId)
				.single();

			expect(beforeData).not.toBeNull();

			// Unshare the transaction
			await user1Client
				.from("transactions")
				.update({
					is_shared_expense: false,
					shared_with_household_id: null,
					shared_by: null,
				})
				.eq("id", testTransactionId);

			// User 2 should no longer see it
			const { data: afterData } = await user2Client
				.from("transactions")
				.select("*")
				.eq("id", testTransactionId)
				.single();

			expect(afterData).toBeNull();
		});
	});

	describe("Account Deletion Cascade", () => {
		it("should cascade sharing history deletion when account is deleted", async () => {
			// Create a test account and transaction
			const { data: testAccount } = await user1Client
				.from("financial_accounts")
				.insert({
					user_id: user1Id,
					account_name: "Temp Account",
					account_type: "checking",
					provider: "manual",
				})
				.select()
				.single();

			const { data: testTx } = await user1Client
				.from("transactions")
				.insert({
					account_id: testAccount?.id,
					amount: -10.0,
					merchant_name: "Test",
					category: "other",
					date: "2025-01-19",
					is_shared_expense: true,
					shared_with_household_id: householdId,
				})
				.select()
				.single();

			// Create sharing history
			await user1Client.from("transaction_sharing_history").insert({
				transaction_id: testTx?.id,
				household_id: householdId,
				action: "shared",
				changed_by: user1Id,
			});

			// Delete the account
			await adminClient
				.from("financial_accounts")
				.delete()
				.eq("id", testAccount?.id);

			// Verify sharing history is also deleted (CASCADE)
			const { data: historyData } = await user1Client
				.from("transaction_sharing_history")
				.select("*")
				.eq("transaction_id", testTx?.id);

			expect(historyData?.length).toBe(0);
		});
	});
});
