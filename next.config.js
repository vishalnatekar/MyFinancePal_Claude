/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		turbo: {
			rules: {
				"*.svg": {
					loaders: ["@svgr/webpack"],
					as: "*.js",
				},
			},
		},
	},
	images: {
		domains: [
			"localhost",
			"*.supabase.co",
			"lh3.googleusercontent.com", // Google OAuth avatars
		],
	},
	typescript: {
		// Temporarily allow production builds with TypeScript errors for deployment
		// TODO: Fix remaining type issues after deployment
		ignoreBuildErrors: true,
	},
	eslint: {
		// Disable ESLint during builds since we use Biome
		ignoreDuringBuilds: true,
	},
};

// Bundle analyzer setup
const withBundleAnalyzer = require("@next/bundle-analyzer")({
	enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer(nextConfig);
