import type { Config } from "tailwindcss";

const withOpacityValue = (variable: string) => {
	return ({ opacityValue }: { opacityValue?: string }) => {
		if (opacityValue === undefined) {
			return `var(${variable})`;
		}

		const opacity = Number(opacityValue);
		if (Number.isNaN(opacity)) {
			return `var(${variable})`;
		}

		const percentage = Math.max(0, Math.min(100, Math.round(opacity * 100)));

		return `color-mix(in oklch, var(${variable}) ${percentage}%, transparent)`;
	};
};

const config = {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			colors: {
				border: withOpacityValue("--border"),
				input: withOpacityValue("--input"),
				ring: withOpacityValue("--ring"),
				background: withOpacityValue("--background"),
				foreground: withOpacityValue("--foreground"),
				primary: {
					DEFAULT: withOpacityValue("--primary"),
					foreground: withOpacityValue("--primary-foreground"),
				},
				secondary: {
					DEFAULT: withOpacityValue("--secondary"),
					foreground: withOpacityValue("--secondary-foreground"),
				},
				destructive: {
					DEFAULT: withOpacityValue("--destructive"),
					foreground: withOpacityValue("--destructive-foreground"),
				},
				muted: {
					DEFAULT: withOpacityValue("--muted"),
					foreground: withOpacityValue("--muted-foreground"),
				},
				accent: {
					DEFAULT: withOpacityValue("--accent"),
					foreground: withOpacityValue("--accent-foreground"),
				},
				popover: {
					DEFAULT: withOpacityValue("--popover"),
					foreground: withOpacityValue("--popover-foreground"),
				},
				card: {
					DEFAULT: withOpacityValue("--card"),
					foreground: withOpacityValue("--card-foreground"),
				},
				sidebar: {
					DEFAULT: withOpacityValue("--sidebar"),
					foreground: withOpacityValue("--sidebar-foreground"),
					primary: withOpacityValue("--sidebar-primary"),
					"primary-foreground": withOpacityValue(
						"--sidebar-primary-foreground",
					),
					accent: withOpacityValue("--sidebar-accent"),
					"accent-foreground": withOpacityValue(
						"--sidebar-accent-foreground",
					),
					border: withOpacityValue("--sidebar-border"),
					ring: withOpacityValue("--sidebar-ring"),
				},
				chart: {
					"1": withOpacityValue("--chart-1"),
					"2": withOpacityValue("--chart-2"),
					"3": withOpacityValue("--chart-3"),
					"4": withOpacityValue("--chart-4"),
					"5": withOpacityValue("--chart-5"),
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
