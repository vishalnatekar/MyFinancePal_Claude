import { config } from "@/lib/config";
import type { TransactionSharingHistory } from "@/types/transaction";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: { id: string } },
) {
	try {
		const cookieStore = await cookies();
		const supabase = createServerClient(
			config.supabase.url,
			config.supabase.anonKey,
			{
				cookies: {
					getAll() {
						return cookieStore.getAll();
					},
					setAll(cookiesToSet) {
						try {
							for (const { name, value, options } of cookiesToSet) {
								cookieStore.set(name, value, options);
							}
						} catch {
							// Server component - ignore
						}
					},
				},
			},
		);
		const transactionId = params.id;

		// Authenticate user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Parse query parameters
		const { searchParams } = new URL(request.url);
		const householdId = searchParams.get("household_id");
		const startDate = searchParams.get("start_date");
		const endDate = searchParams.get("end_date");
		const action = searchParams.get("action");

		// Build query
		let query = supabase
			.from("transaction_sharing_history")
			.select(
				`
        id,
        transaction_id,
        household_id,
        action,
        changed_by,
        changed_at,
        households:household_id (
          id,
          name
        )
      `,
			)
			.eq("transaction_id", transactionId)
			.order("changed_at", { ascending: false });

		// Apply filters
		if (householdId) {
			query = query.eq("household_id", householdId);
		}
		if (startDate) {
			query = query.gte("changed_at", startDate);
		}
		if (endDate) {
			query = query.lte("changed_at", endDate);
		}
		if (action && (action === "shared" || action === "unshared")) {
			query = query.eq("action", action);
		}

		const { data, error } = await query;

		if (error) {
			console.error("Error fetching sharing history:", error);
			return NextResponse.json(
				{ error: "Failed to fetch sharing history" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			history: data as TransactionSharingHistory[],
		});
	} catch (error) {
		console.error(
			"Error in GET /api/transactions/[id]/sharing-history:",
			error,
		);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
