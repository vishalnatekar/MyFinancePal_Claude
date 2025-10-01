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
		// Dangerously allow production builds to successfully complete even if your project has TypeScript errors
		ignoreBuildErrors: false,
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
