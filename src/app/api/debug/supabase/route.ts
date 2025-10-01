import { supabase } from "@/lib/supabase";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Test basic connection
		const { data, error } = await supabase.auth.getSession();

		return NextResponse.json({
			success: true,
			sessionExists: !!data.session,
			error: error?.message || null,
			url: process.env.NEXT_PUBLIC_SUPABASE_URL,
			hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		});
	} catch (err) {
		return NextResponse.json({
			success: false,
			error: err instanceof Error ? err.message : "Unknown error",
			url: process.env.NEXT_PUBLIC_SUPABASE_URL,
			hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		});
	}
}
