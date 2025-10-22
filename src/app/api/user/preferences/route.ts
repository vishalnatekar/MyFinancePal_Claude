import { authenticateRequest } from "@/lib/auth-helpers";
import { config } from "@/lib/config";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Default preferences
const PreferencesSchema = z.object({
	email_notifications: z.boolean(),
	shared_expense_alerts: z.boolean(),
	settlement_reminders: z.boolean(),
	timezone: z.string(),
});

type UserPreferences = z.infer<typeof PreferencesSchema>;

const DEFAULT_PREFERENCES: UserPreferences = {
	email_notifications: true,
	shared_expense_alerts: true,
	settlement_reminders: true,
	timezone: "America/New_York",
};

// Validation schema for preference updates
const UpdatePreferencesSchema = z.object({
	email_notifications: z.boolean().optional(),
	shared_expense_alerts: z.boolean().optional(),
	settlement_reminders: z.boolean().optional(),
	timezone: z.string().optional(),
});

export async function GET(request: NextRequest) {
	try {
		// Authentication
		const authResult = await authenticateRequest(request);
		if (!authResult.authenticated || !authResult.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = authResult.user;
		const supabase = createClient(config.supabase.url, config.supabase.anonKey);

		// Get user profile with preferences
		const { data: profile, error } = await supabase
			.from("profiles")
			.select("notification_preferences")
			.eq("id", user.id)
			.maybeSingle();

		// If profile doesn't exist or has error, return defaults
		if (error) {
			console.error("Database error:", error);
			// Return defaults instead of erroring
			return NextResponse.json(DEFAULT_PREFERENCES);
		}

		// Return preferences with defaults if not set
		const parsedPreferences = PreferencesSchema.safeParse(
			profile?.notification_preferences,
		);
		const preferences = parsedPreferences.success
			? parsedPreferences.data
			: DEFAULT_PREFERENCES;

		return NextResponse.json(preferences);
	} catch (error) {
		console.error("Error fetching user preferences:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		// Authentication
		const authResult = await authenticateRequest(request);
		if (!authResult.authenticated || !authResult.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = authResult.user;
		const supabase = createClient(config.supabase.url, config.supabase.anonKey);
		const body = await request.json();

		// Validate the request body
		const validatedData = UpdatePreferencesSchema.parse(body);

		// Get current preferences
		const { data: profile, error: fetchError } = await supabase
			.from("profiles")
			.select("notification_preferences")
			.eq("id", user.id)
			.maybeSingle();

		if (fetchError) {
			console.error("Database error:", fetchError);
		}

		// Merge with existing preferences
		const parsedPreferences = PreferencesSchema.safeParse(
			profile?.notification_preferences,
		);
		const currentPreferences = parsedPreferences.success
			? parsedPreferences.data
			: DEFAULT_PREFERENCES;
		const updatedPreferences: UserPreferences = {
			...currentPreferences,
			...validatedData,
		};

		// Upsert preferences in database (create or update)
		const { error: upsertError } = await supabase
			.from("profiles")
			.upsert({
				id: user.id,
				notification_preferences: updatedPreferences,
				updated_at: new Date().toISOString(),
			})
			.eq("id", user.id);

		if (upsertError) {
			console.error("Database upsert error:", upsertError);
			return NextResponse.json(
				{ error: "Failed to update preferences" },
				{ status: 500 },
			);
		}

		return NextResponse.json(updatedPreferences);
	} catch (error) {
		console.error("Error updating user preferences:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.errors },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
