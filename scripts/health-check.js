#!/usr/bin/env node

/**
 * Health check script for MyFinancePal
 * Verifies that all required services and dependencies are working correctly
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

async function checkEnvironmentVariables() {
	info("Checking environment variables...");

	const requiredVars = [
		"NEXT_PUBLIC_SUPABASE_URL",
		"NEXT_PUBLIC_SUPABASE_ANON_KEY",
		"SUPABASE_SERVICE_ROLE_KEY",
	];

	const missingVars = requiredVars.filter((varName) => !process.env[varName]);

	if (missingVars.length > 0) {
		error(`Missing environment variables: ${missingVars.join(", ")}`);
		return false;
	}

	success("All required environment variables are set");
	return true;
}

async function checkPackageJson() {
	info("Checking package.json...");

	try {
		const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));

		// Check required scripts
		const requiredScripts = ["dev", "build", "start", "lint", "test"];
		const missingScripts = requiredScripts.filter(
			(script) => !packageJson.scripts[script],
		);

		if (missingScripts.length > 0) {
			error(`Missing scripts in package.json: ${missingScripts.join(", ")}`);
			return false;
		}

		success("package.json is properly configured");
		return true;
	} catch (err) {
		error(`Failed to read package.json: ${err.message}`);
		return false;
	}
}

async function checkNodeModules() {
	info("Checking node_modules...");

	if (!fs.existsSync("./node_modules")) {
		error('node_modules directory not found. Run "npm install"');
		return false;
	}

	success("node_modules directory exists");
	return true;
}

async function checkTypeScript() {
	info("Checking TypeScript configuration...");

	try {
		execSync("npx tsc --noEmit", { stdio: "pipe" });
		success("TypeScript compilation successful");
		return true;
	} catch (err) {
		error("TypeScript compilation failed");
		console.log(err.stdout?.toString());
		return false;
	}
}

async function checkLinting() {
	info("Checking code quality with Biome...");

	try {
		execSync("npm run lint", { stdio: "pipe" });
		success("Code quality checks passed");
		return true;
	} catch (err) {
		warning("Code quality issues found");
		console.log(err.stdout?.toString());
		return true; // Non-blocking for development
	}
}

async function checkBuild() {
	info("Testing build process...");

	try {
		execSync("npm run build", { stdio: "pipe" });
		success("Build completed successfully");
		return true;
	} catch (err) {
		error("Build failed");
		console.log(err.stdout?.toString());
		return false;
	}
}

async function checkDatabaseConnection() {
	info("Checking database configuration...");

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

	if (!supabaseUrl) {
		error("Supabase URL not configured");
		return false;
	}

	if (supabaseUrl.includes("localhost")) {
		warning("Using local Supabase instance");
	} else {
		info("Using remote Supabase instance");
	}

	success("Database configuration looks good");
	return true;
}

async function main() {
	log("\n🔍 Running MyFinancePal Health Check...\n", colors.blue);

	const checks = [
		checkEnvironmentVariables,
		checkPackageJson,
		checkNodeModules,
		checkTypeScript,
		checkLinting,
		checkDatabaseConnection,
		checkBuild,
	];

	let allPassed = true;

	for (const check of checks) {
		const passed = await check();
		if (!passed) {
			allPassed = false;
		}
		console.log(""); // Add spacing
	}

	if (allPassed) {
		success(
			"🎉 All health checks passed! Your development environment is ready.",
		);
	} else {
		error("❌ Some health checks failed. Please fix the issues above.");
		process.exit(1);
	}
}

// Only run if this script is called directly
if (require.main === module) {
	main().catch((err) => {
		error(`Health check failed: ${err.message}`);
		process.exit(1);
	});
}
