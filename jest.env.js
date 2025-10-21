/**
 * Jest environment bootstrap for environment variables.
 * Keep this file free of Jest globals or DOM references.
 */

const defaults = {
	NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
	NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
	SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
	MONEYHUB_CLIENT_ID: "test-client-id",
	MONEYHUB_CLIENT_SECRET: "test-client-secret",
	ENCRYPTION_KEY: "test-encryption-key-12345678",
};

for (const [key, value] of Object.entries(defaults)) {
	if (!process.env[key]) {
		process.env[key] = value;
	}
}
