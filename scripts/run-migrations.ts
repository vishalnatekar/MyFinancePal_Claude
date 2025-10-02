#!/usr/bin/env tsx
/**
 * Migration Runner
 * Applies SQL migrations to the Supabase database
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	console.error("❌ Missing Supabase credentials in .env.local");
	console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(filePath: string, name: string) {
	console.log(`\n📄 Running migration: ${name}`);

	try {
		const sql = readFileSync(filePath, "utf-8");

		// Execute the SQL
		const { error } = await supabase.rpc("exec_sql", { sql_string: sql }).single();

		if (error) {
			// If exec_sql function doesn't exist, we need to use a different approach
			console.log(`⚠️  exec_sql not available, trying direct execution...`);

			// Split by semicolons and execute each statement
			const statements = sql
				.split(";")
				.map((s) => s.trim())
				.filter((s) => s.length > 0 && !s.startsWith("--"));

			for (const statement of statements) {
				const { error: stmtError } = await supabase.rpc("exec", {
					sql: statement,
				});

				if (stmtError) {
					console.error(`❌ Error in statement:`, stmtError);
					throw stmtError;
				}
			}
		}

		console.log(`✅ Migration completed: ${name}`);
		return true;
	} catch (error) {
		console.error(`❌ Migration failed: ${name}`, error);
		return false;
	}
}

async function main() {
	console.log("🚀 Starting database migrations...\n");

	const migrations = [
		{
			path: join(process.cwd(), "database/schema.sql"),
			name: "Main Schema (includes financial_accounts)",
		},
		{
			path: join(process.cwd(), "database/migrations/003_data_processing_tables.sql"),
			name: "Data Processing Tables",
		},
	];

	let successCount = 0;

	for (const migration of migrations) {
		const success = await runMigration(migration.path, migration.name);
		if (success) successCount++;
	}

	console.log(`\n✨ Completed ${successCount}/${migrations.length} migrations`);

	if (successCount < migrations.length) {
		console.error("\n⚠️  Some migrations failed. Please check the errors above.");
		process.exit(1);
	}
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
