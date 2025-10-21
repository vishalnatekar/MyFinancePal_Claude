import { authenticateRequest } from "@/lib/auth-helpers";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	try {
		const authResult = await authenticateRequest(request);

		// Return debug info about authentication
		return NextResponse.json({
			success: authResult.success,
			userId: authResult.userId,
			hasUser: !!authResult.userId,
			error: authResult.error,
			cookies: Object.fromEntries(
				request.cookies
					.getAll()
					.map((c) => [c.name, `${c.value?.substring(0, 30)}...`]),
			),
			headers: Object.fromEntries(
				Array.from(request.headers.entries()).filter(
					([key]) =>
						key.toLowerCase().includes("auth") ||
						key.toLowerCase().includes("cookie") ||
						key.toLowerCase().includes("authorization"),
				),
			),
		});
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				message: "Failed to check authentication",
			},
			{ status: 500 },
		);
	}
}
