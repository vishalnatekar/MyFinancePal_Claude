import { authenticateRequest } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
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
		const user = await authenticateRequest();

		// Get user profile with preferences
		const { data: profile, error } = await supabase
			.from("profiles")
			.select("notification_preferences")
			.eq("id", user.id)
			.single();

		if (error) {
			console.error("Database error:", error);
			return NextResponse.json(
				{ error: "Failed to fetch preferences" },
				{ status: 500 },
			);
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

		if (error instanceof Error && error.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const user = await authenticateRequest();
		const body = await request.json();

		// Validate the request body
		const validatedData = UpdatePreferencesSchema.parse(body);

		// Get current preferences
		const { data: profile, error: fetchError } = await supabase
			.from("profiles")
			.select("notification_preferences")
			.eq("id", user.id)
			.single();

		if (fetchError) {
			console.error("Database error:", fetchError);
			return NextResponse.json(
				{ error: "Failed to fetch current preferences" },
				{ status: 500 },
			);
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

		// Update preferences in database
		const { error: updateError } = await supabase
			.from("profiles")
			.update({
				notification_preferences: updatedPreferences,
				updated_at: new Date().toISOString(),
			})
			.eq("id", user.id);

		if (updateError) {
			console.error("Database update error:", updateError);
			return NextResponse.json(
				{ error: "Failed to update preferences" },
				{ status: 500 },
			);
		}

		return NextResponse.json(updatedPreferences);
	} catch (error) {
		console.error("Error updating user preferences:", error);

		if (error instanceof Error && error.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

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
