import { supabase } from "@/lib/supabase";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Test client-side session
		const { data: clientSession, error: clientError } =
			await supabase.auth.getSession();

		return NextResponse.json({
			timestamp: new Date().toISOString(),
			client_session: {
				exists: !!clientSession.session,
				user_id: clientSession.session?.user?.id || null,
				expires_at: clientSession.session?.expires_at || null,
				access_token: clientSession.session?.access_token
					? "present"
					: "missing",
				refresh_token: clientSession.session?.refresh_token
					? "present"
					: "missing",
				error: clientError?.message || null,
			},
			cookies: {
				from_request: Object.fromEntries(
					request.headers
						.get("cookie")
						?.split("; ")
						.map((c) => c.split("=")) || [],
				),
			},
		});
	} catch (err) {
		return NextResponse.json({
			error: err instanceof Error ? err.message : "Unknown error",
			timestamp: new Date().toISOString(),
		});
	}
}
