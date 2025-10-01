import { config } from "@/lib/config";
import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json({
		clientId: config.truelayer.clientId,
		environment: config.truelayer.environment,
		apiUrl: config.truelayer.apiUrl,
		appUrl: config.app.url,
		redirectUri: `${config.app.url}/api/accounts/callback`,
	});
}
