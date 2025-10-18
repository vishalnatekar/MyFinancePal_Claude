#!/usr/bin/env node

/**
 * Development setup script for MyFinancePal
 * Automatically sets up the development environment
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

// Colors for console output
const colors = {
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	reset: "\x1b[0m",
};

function log(message, color = colors.reset) {
	console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
	log(`✅ ${message}`, colors.green);
}

function error(message) {
	log(`❌ ${message}`, colors.red);
}

function warning(message) {
	log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
	log(`ℹ️  ${message}`, colors.blue);
}

async function copyEnvExample() {
	info("Setting up environment variables...");

	if (fs.existsSync(".env.local")) {
		warning(".env.local already exists, skipping...");
		return;
	}

	if (fs.existsSync(".env.local.example")) {
		fs.copyFileSync(".env.local.example", ".env.local");
		success("Created .env.local from .env.local.example");
		warning(
			"⚠️  Please update .env.local with your actual environment variables",
		);
	} else {
		error(".env.local.example not found");
	}
}

async function installDependencies() {
	info("Installing dependencies...");

	try {
		execSync("npm ci", { stdio: "inherit" });
		success("Dependencies installed successfully");
	} catch (err) {
		error("Failed to install dependencies");
		throw err;
	}
}

async function setupGitHooks() {
	info("Setting up git hooks...");

	try {
		execSync("npx simple-git-hooks", { stdio: "pipe" });
		success("Git hooks configured");
	} catch (err) {
		warning("Failed to setup git hooks (this is optional)");
	}
}

async function checkSupabaseCLI() {
	info("Checking Supabase CLI...");

	try {
		execSync("supabase --version", { stdio: "pipe" });
		success("Supabase CLI is available");
	} catch (err) {
		warning(
			"Supabase CLI not found. Install with: npm install -g @supabase/cli",
		);
	}
}

async function initializeSupabase() {
	info("Initializing local Supabase...");

	if (fs.existsSync("./supabase")) {
		warning("Supabase already initialized");
		return;
	}

	try {
		execSync("supabase init", { stdio: "inherit" });
		success("Supabase initialized");

		info("Starting local Supabase...");
		execSync("supabase start", { stdio: "inherit" });
		success("Local Supabase started");
	} catch (err) {
		warning(
			"Failed to initialize Supabase. You may need to set it up manually.",
		);
	}
}

async function runHealthCheck() {
	info("Running health check...");

	try {
		execSync("node scripts/health-check.js", { stdio: "inherit" });
		success("Health check completed");
	} catch (err) {
		warning("Health check found issues - check the output above");
	}
}

async function main() {
	log("\n🚀 Setting up MyFinancePal development environment...\n", colors.blue);

	const steps = [
		copyEnvExample,
		installDependencies,
		setupGitHooks,
		checkSupabaseCLI,
		initializeSupabase,
		runHealthCheck,
	];

	try {
		for (const step of steps) {
			await step();
			console.log(""); // Add spacing
		}

		success("🎉 Development environment setup complete!");

		log("\n📝 Next steps:", colors.blue);
		log("1. Update .env.local with your environment variables");
		log('2. Run "npm run dev" to start the development server');
		log("3. Open http://localhost:3000 in your browser");
	} catch (err) {
		error(`Setup failed: ${err.message}`);
		process.exit(1);
	}
}

// Only run if this script is called directly
if (require.main === module) {
	main().catch((err) => {
		error(`Setup failed: ${err.message}`);
		process.exit(1);
	});
}
