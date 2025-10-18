/**
 * Currency formatting and conversion utilities
 */

export interface CurrencyFormatOptions {
	showSymbol?: boolean;
	showCode?: boolean;
	decimals?: number;
	locale?: string;
}

/**
 * Format amount as currency string
 */
export function formatCurrency(
	amount: number,
	currency: string,
	options?: CurrencyFormatOptions,
): string {
	const {
		showSymbol = true,
		showCode = false,
		decimals = 2,
		locale = "en-GB",
	} = options || {};

	// Default to GBP if currency is undefined/null/empty
	const safeCurrency = currency?.trim() ? currency : "GBP";

	const formatted = new Intl.NumberFormat(locale, {
		style: showSymbol ? "currency" : "decimal",
		currency: showSymbol ? safeCurrency : undefined,
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(amount);

	if (showCode && !showSymbol) {
		return `${formatted} ${safeCurrency}`;
	}

	return formatted;
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
	const symbols: Record<string, string> = {
		GBP: "£",
		EUR: "€",
		USD: "$",
		JPY: "¥",
		CHF: "CHF",
		CAD: "C$",
		AUD: "A$",
		NZD: "NZ$",
		INR: "₹",
		CNY: "¥",
		KRW: "₩",
		SEK: "kr",
		NOK: "kr",
		DKK: "kr",
		PLN: "zł",
		CZK: "Kč",
		HUF: "Ft",
		RON: "lei",
		BGN: "лв",
		HRK: "kn",
	};

	return symbols[currencyCode] || currencyCode;
}

/**
 * Parse currency amount from string
 */
export function parseCurrencyAmount(input: string): number | null {
	// Remove currency symbols and whitespace
	const cleaned = input
		.replace(/[£€$¥₹₩kr]/g, "")
		.replace(/\s/g, "")
		.replace(/,/g, "");

	const parsed = Number.parseFloat(cleaned);
	return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Validate currency code (ISO 4217)
 */
export function isValidCurrencyCode(code: string): boolean {
	const validCurrencies = [
		"GBP",
		"EUR",
		"USD",
		"JPY",
		"CHF",
		"CAD",
		"AUD",
		"NZD",
		"INR",
		"CNY",
		"KRW",
		"SEK",
		"NOK",
		"DKK",
		"PLN",
		"CZK",
		"HUF",
		"RON",
		"BGN",
		"HRK",
	];

	return validCurrencies.includes(code.toUpperCase());
}

/**
 * Get currency display name
 */
export function getCurrencyName(code: string): string {
	const names: Record<string, string> = {
		GBP: "British Pound Sterling",
		EUR: "Euro",
		USD: "US Dollar",
		JPY: "Japanese Yen",
		CHF: "Swiss Franc",
		CAD: "Canadian Dollar",
		AUD: "Australian Dollar",
		NZD: "New Zealand Dollar",
		INR: "Indian Rupee",
		CNY: "Chinese Yuan",
		KRW: "South Korean Won",
		SEK: "Swedish Krona",
		NOK: "Norwegian Krone",
		DKK: "Danish Krone",
		PLN: "Polish Zloty",
		CZK: "Czech Koruna",
		HUF: "Hungarian Forint",
		RON: "Romanian Leu",
		BGN: "Bulgarian Lev",
		HRK: "Croatian Kuna",
	};

	return names[code] || code;
}

/**
 * Round currency amount to standard precision
 */
export function roundCurrencyAmount(amount: number, decimals = 2): number {
	const multiplier = 10 ** decimals;
	return Math.round(amount * multiplier) / multiplier;
}

/**
 * Format currency range
 */
export function formatCurrencyRange(
	min: number,
	max: number,
	currency: string,
	options?: CurrencyFormatOptions,
): string {
	const formattedMin = formatCurrency(min, currency, options);
	const formattedMax = formatCurrency(max, currency, options);
	return `${formattedMin} - ${formattedMax}`;
}

/**
 * Compare currency amounts with precision tolerance
 */
export function compareCurrencyAmounts(
	amount1: number,
	amount2: number,
	tolerance = 0.01,
): -1 | 0 | 1 {
	const diff = amount1 - amount2;

	if (Math.abs(diff) < tolerance) {
		return 0;
	}

	return diff > 0 ? 1 : -1;
}

/**
 * Check if amount is zero (with tolerance)
 */
export function isZeroAmount(amount: number, tolerance = 0.01): boolean {
	return Math.abs(amount) < tolerance;
}

/**
 * Get currency decimal places
 */
export function getCurrencyDecimals(currencyCode: string): number {
	// Some currencies don't use decimal places
	const zeroDecimalCurrencies = ["JPY", "KRW"];

	if (zeroDecimalCurrencies.includes(currencyCode)) {
		return 0;
	}

	return 2;
}

/**
 * Format large currency amounts (e.g., 1.5K, 2.3M)
 */
export function formatLargeCurrency(
	amount: number,
	currency: string,
	options?: { locale?: string },
): string {
	const { locale = "en-GB" } = options || {};
	const symbol = getCurrencySymbol(currency);

	const absAmount = Math.abs(amount);
	const sign = amount < 0 ? "-" : "";

	if (absAmount >= 1000000) {
		return `${sign}${symbol}${(absAmount / 1000000).toFixed(1)}M`;
	}

	if (absAmount >= 1000) {
		return `${sign}${symbol}${(absAmount / 1000).toFixed(1)}K`;
	}

	return formatCurrency(amount, currency, { locale });
}

/**
 * Calculate percentage of total
 */
export function calculatePercentage(part: number, total: number): number {
	if (total === 0) return 0;
	return roundCurrencyAmount((part / total) * 100, 1);
}
