import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	// Return mock data for now to test the UI
	return NextResponse.json({
		accounts: [],
	});
}

export async function POST(request: NextRequest) {
	const body = await request.json();

	// Return mock success response
	return NextResponse.json(
		{
			account: {
				id: `mock-${Date.now()}`,
				...body,
				created_at: new Date().toISOString(),
			},
		},
		{ status: 201 },
	);
}
