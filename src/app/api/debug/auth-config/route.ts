import { supabase } from "@/lib/supabase";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Test OAuth URL generation
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
			},
		});

		return NextResponse.json({
			success: !error,
			error: error?.message || null,
			redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
			supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
			hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
			oauthUrl: data?.url || null,
		});
	} catch (err) {
		return NextResponse.json({
			success: false,
			error: err instanceof Error ? err.message : "Unknown error",
		});
	}
}
