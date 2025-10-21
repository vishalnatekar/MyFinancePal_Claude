// Environment configuration - centralized access to environment variables
// Never access process.env directly in components - use this config file

export const config = {
	// Supabase configuration
	supabase: {
		url: process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
		anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key",
		serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy-key",
	},

	// Authentication configuration
	auth: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
		},
	},

	// Application configuration
	app: {
		url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
		env: process.env.NODE_ENV || "development",
	},

	// TrueLayer API configuration
	truelayer: {
		clientId: process.env.TRUELAYER_CLIENT_ID ?? "",
		clientSecret: process.env.TRUELAYER_CLIENT_SECRET ?? "",
		apiUrl: process.env.TRUELAYER_API_URL || "https://api.truelayer.com",
		environment: process.env.TRUELAYER_ENVIRONMENT || "sandbox",
	},

	// Security configuration
	security: {
		encryptionKey: process.env.ENCRYPTION_KEY ?? "",
	},

	// Bundle analyzer
	analyze: process.env.ANALYZE === "true",
} as const;

// Validate required environment variables
function validateConfig() {
	const requiredVars = [
		"NEXT_PUBLIC_SUPABASE_URL",
		"NEXT_PUBLIC_SUPABASE_ANON_KEY",
		"SUPABASE_SERVICE_ROLE_KEY",
		"TRUELAYER_CLIENT_ID",
		"TRUELAYER_CLIENT_SECRET",
		"ENCRYPTION_KEY",
	];

	const missingVars = requiredVars.filter((varName) => !process.env[varName]);

	if (missingVars.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missingVars.join(", ")}`,
		);
	}
}

// Only validate in runtime, not during build
if (
	typeof window === "undefined" &&
	process.env.NODE_ENV !== "test" &&
	process.env.NODE_ENV !== "development" &&
	process.env.NEXT_PHASE !== "phase-production-build"
) {
	validateConfig();
}
