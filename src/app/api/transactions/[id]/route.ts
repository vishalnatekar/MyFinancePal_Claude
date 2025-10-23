import { config } from "@/lib/config";
import type { Database } from "@/types/database";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Transaction by ID API endpoints
 * GET /api/transactions/[id] - Get transaction details
 * PUT /api/transactions/[id] - Update transaction
 */

export const dynamic = "force-dynamic";

// Validation schema for transaction updates
const transactionUpdateSchema = z.object({
	merchant_name: z.string().min(1).max(100).optional(),
	category: z.string().min(1).max(100).optional(), // Accept any TrueLayer category
	description: z.string().max(500).optional(),
});

/**
 * GET single transaction by ID
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const cookieStore = cookies();
		const supabase = createServerClient<Database>(
			config.supabase.url,
			config.supabase.anonKey,
			{
				cookies: {
					get(name: string) {
						return cookieStore.get(name)?.value;
					},
					set(name: string, value: string, options: Record<string, unknown>) {
						cookieStore.set({ name, value, ...options });
					},
					remove(name: string, options: Record<string, unknown>) {
						cookieStore.set({ name, value: "", ...options });
					},
				},
			},
		);

		// Authenticate user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = params;

		// Fetch transaction
		const { data: transaction, error } = await supabase
			.from("transactions")
			.select("*")
			.eq("id", id)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Transaction not found" },
					{ status: 404 },
				);
			}
			console.error("Error fetching transaction:", error);
			return NextResponse.json(
				{ error: "Failed to fetch transaction" },
				{ status: 500 },
			);
		}

		// Verify user owns this transaction through account ownership
		const { data: account, error: accountError } = await supabase
			.from("financial_accounts")
			.select("user_id")
			.eq("id", transaction.account_id)
			.single();

		if (accountError || account?.user_id !== user.id) {
			return NextResponse.json(
				{ error: "Transaction not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(transaction);
	} catch (error) {
		console.error("Unexpected error in transaction GET:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

/**
 * PUT (update) transaction by ID
 */
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const cookieStore = cookies();
		const supabase = createServerClient<Database>(
			config.supabase.url,
			config.supabase.anonKey,
			{
				cookies: {
					get(name: string) {
						return cookieStore.get(name)?.value;
					},
					set(name: string, value: string, options: Record<string, unknown>) {
						cookieStore.set({ name, value, ...options });
					},
					remove(name: string, options: Record<string, unknown>) {
						cookieStore.set({ name, value: "", ...options });
					},
				},
			},
		);

		// Authenticate user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = params;

		// Parse and validate request body
		const body = await request.json();
		console.log("Transaction update body:", body);
		const validationResult = transactionUpdateSchema.safeParse(body);

		if (!validationResult.success) {
			console.error("Validation failed:", validationResult.error.errors);
			return NextResponse.json(
				{
					error: "Invalid request body",
					details: validationResult.error.errors,
				},
				{ status: 400 },
			);
		}

		const updates = validationResult.data;

		// Verify transaction exists and user owns it
		const { data: existingTransaction, error: fetchError } = await supabase
			.from("transactions")
			.select("account_id")
			.eq("id", id)
			.single();

		if (fetchError || !existingTransaction) {
			return NextResponse.json(
				{ error: "Transaction not found" },
				{ status: 404 },
			);
		}

		// Verify ownership through account
		const { data: account, error: accountError } = await supabase
			.from("financial_accounts")
			.select("user_id")
			.eq("id", existingTransaction.account_id)
			.single();

		if (accountError || account?.user_id !== user.id) {
			return NextResponse.json(
				{ error: "Transaction not found" },
				{ status: 404 },
			);
		}

		// Update transaction with manual_override flag
		const { data: updatedTransaction, error: updateError } = await supabase
			.from("transactions")
			.update({
				...updates,
				manual_override: true,
			})
			.eq("id", id)
			.select()
			.single();

		if (updateError) {
			console.error("Error updating transaction:", updateError);
			return NextResponse.json(
				{ error: "Failed to update transaction" },
				{ status: 500 },
			);
		}

		return NextResponse.json(updatedTransaction);
	} catch (error) {
		console.error("Unexpected error in transaction PUT:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
