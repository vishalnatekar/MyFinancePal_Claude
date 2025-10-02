import { authenticateRequest } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Authenticate the user
		const authResult = await authenticateRequest(request);
		if (!authResult.authenticated || !authResult.user) {
			console.error("GET /api/accounts - Auth failed:", {
				authenticated: authResult.authenticated,
				hasUser: !!authResult.user,
				error: authResult.error,
			});
			return NextResponse.json(
				{
					error: "Unauthorized - Please log in with Google",
					details: authResult.error,
				},
				{ status: 401 },
			);
		}

		const userId = authResult.user.id;

		console.log("GET /api/accounts - Fetching for user:", userId);

		// Fetch all accounts for the user from database
		const { data: accounts, error } = await supabaseAdmin
			.from("financial_accounts")
			.select("*")
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		if (error) {
			console.error("Error fetching accounts:", error);
			return NextResponse.json(
				{ error: "Failed to fetch accounts" },
				{ status: 500 },
			);
		}

		console.log(
			`GET /api/accounts - Found ${accounts?.length || 0} accounts for user ${userId}`,
		);
		console.log(
			"Account details:",
			accounts?.map((a) => ({
				id: a.id,
				name: a.account_name,
				balance: a.current_balance,
			})),
		);

		return NextResponse.json({
			accounts: accounts || [],
		});
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		// Authenticate the user
		const authResult = await authenticateRequest(request);
		if (!authResult.authenticated || !authResult.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = authResult.user.id;
		const body = await request.json();

		// Validate required fields
		if (!body.account_type || !body.account_name || !body.institution_name) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Create manual account
		const { data: account, error } = await supabaseAdmin
			.from("financial_accounts")
			.insert({
				user_id: userId,
				account_type: body.account_type,
				account_name: body.account_name,
				institution_name: body.institution_name,
				current_balance: body.current_balance || 0,
				is_shared: body.is_shared || false,
				is_manual: true,
				connection_status: "active",
			})
			.select()
			.single();

		if (error) {
			console.error("Error creating account:", error);
			return NextResponse.json(
				{ error: "Failed to create account" },
				{ status: 500 },
			);
		}

		return NextResponse.json(
			{
				account,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
