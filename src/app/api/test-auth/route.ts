import { authenticateRequest } from "@/lib/auth-helpers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	console.log("Test auth endpoint called");

	const authResult = await authenticateRequest(request);

	return NextResponse.json({
		success: authResult.success,
		userId: authResult.userId,
		error: authResult.error,
		timestamp: new Date().toISOString(),
		method: "GET",
	});
}

export async function POST(request: NextRequest) {
	console.log("Test auth POST endpoint called");

	const authResult = await authenticateRequest(request);

	return NextResponse.json({
		success: authResult.success,
		userId: authResult.userId,
		error: authResult.error,
		timestamp: new Date().toISOString(),
		method: "POST",
	});
}
