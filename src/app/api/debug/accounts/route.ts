import { supabaseAdmin } from "@/lib/supabase";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Get all accounts (for debugging - remove auth check temporarily)
		const { data: accounts, error } = await supabaseAdmin
			.from("financial_accounts")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) {
			return NextResponse.json(
				{
					error: error.message,
					details: error,
				},
				{ status: 500 },
			);
		}

		// Get current user info from cookies
		const cookies = request.cookies.getAll();
		const authCookies = cookies.filter((c) =>
			c.name.includes("supabase") || c.name.includes("auth"),
		);

		return NextResponse.json({
			accounts: accounts || [],
			accountCount: accounts?.length || 0,
			authCookies: authCookies.map((c) => ({
				name: c.name,
				hasValue: !!c.value,
				valueLength: c.value?.length || 0,
			})),
			allCookies: cookies.map((c) => c.name),
		});
	} catch (error) {
		console.error("Debug endpoint error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
