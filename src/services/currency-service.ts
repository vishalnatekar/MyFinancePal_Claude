/**
 * CurrencyService
 * Handles currency conversion, normalization, and formatting
 */
export class CurrencyService {
	private readonly baseCurrency = "GBP";

	// Exchange rates cache (in production, this would be fetched from an API)
	private exchangeRates: Map<string, Map<string, number>> = new Map();

	// Historical exchange rates for transaction history
	private historicalRates: Map<string, Map<string, number>> = new Map();

	/**
	 * Normalize amount to base currency (GBP)
	 */
	async normalizeToGBP(amount: number, fromCurrency: string): Promise<number> {
		if (fromCurrency === this.baseCurrency) {
			return amount;
		}

		const rate = await this.getExchangeRate(fromCurrency, this.baseCurrency);
		return this.convertAmount(amount, rate);
	}

	/**
	 * Convert amount from one currency to another
	 */
	async convertCurrency(
		amount: number,
		fromCurrency: string,
		toCurrency: string,
	): Promise<number> {
		if (fromCurrency === toCurrency) {
			return amount;
		}

		const rate = await this.getExchangeRate(fromCurrency, toCurrency);
		return this.convertAmount(amount, rate);
	}

	/**
	 * Get exchange rate between two currencies
	 */
	async getExchangeRate(
		fromCurrency: string,
		toCurrency: string,
	): Promise<number> {
		// Check cache first
		const cached = this.exchangeRates.get(fromCurrency)?.get(toCurrency);
		if (cached) {
			return cached;
		}

		// Fetch from API (placeholder - in production, use real exchange rate API)
		const rate = await this.fetchExchangeRate(fromCurrency, toCurrency);

		// Cache the rate
		if (!this.exchangeRates.has(fromCurrency)) {
			this.exchangeRates.set(fromCurrency, new Map());
		}
		this.exchangeRates.get(fromCurrency)?.set(toCurrency, rate);

		return rate;
	}

	/**
	 * Get historical exchange rate for a specific date
	 */
	async getHistoricalExchangeRate(
		fromCurrency: string,
		toCurrency: string,
		date: Date,
	): Promise<number> {
		const dateKey = date.toISOString().split("T")[0];
		const cacheKey = `${dateKey}_${fromCurrency}_${toCurrency}`;

		// Check historical cache
		const cached = this.historicalRates.get(cacheKey)?.get(toCurrency);
		if (cached) {
			return cached;
		}

		// Fetch historical rate (placeholder)
		const rate = await this.fetchHistoricalExchangeRate(
			fromCurrency,
			toCurrency,
			date,
		);

		// Cache the historical rate
		if (!this.historicalRates.has(cacheKey)) {
			this.historicalRates.set(cacheKey, new Map());
		}
		this.historicalRates.get(cacheKey)?.set(toCurrency, rate);

		return rate;
	}

	/**
	 * Format currency amount for display
	 */
	formatCurrency(
		amount: number,
		currency: string,
		options?: {
			showSymbol?: boolean;
			decimals?: number;
			locale?: string;
		},
	): string {
		const { showSymbol = true, decimals = 2, locale = "en-GB" } = options || {};

		const formatted = new Intl.NumberFormat(locale, {
			style: showSymbol ? "currency" : "decimal",
			currency: showSymbol ? currency : undefined,
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		}).format(amount);

		return formatted;
	}

	/**
	 * Get currency symbol
	 */
	getCurrencySymbol(currency: string): string {
		const symbols: Record<string, string> = {
			GBP: "£",
			EUR: "€",
			USD: "$",
			JPY: "¥",
			CHF: "CHF",
			CAD: "C$",
			AUD: "A$",
			NZD: "NZ$",
		};

		return symbols[currency] || currency;
	}

	/**
	 * Detect currency from TrueLayer account data
	 */
	detectCurrency(accountData: {
		currency?: string;
		balance?: { currency?: string };
	}): string {
		// Try to get currency from account data
		if (accountData.currency) {
			return this.validateCurrencyCode(accountData.currency);
		}

		if (accountData.balance?.currency) {
			return this.validateCurrencyCode(accountData.balance.currency);
		}

		// Default to GBP if no currency found
		return this.baseCurrency;
	}

	/**
	 * Validate currency code (ISO 4217)
	 */
	validateCurrencyCode(code: string): string {
		const validCurrencies = [
			"GBP",
			"EUR",
			"USD",
			"JPY",
			"CHF",
			"CAD",
			"AUD",
			"NZD",
			"SEK",
			"NOK",
			"DKK",
			"PLN",
			"CZK",
			"HUF",
		];

		const upperCode = code.toUpperCase();
		if (validCurrencies.includes(upperCode)) {
			return upperCode;
		}

		throw new Error(`Invalid currency code: ${code}`);
	}

	/**
	 * Get all supported currencies
	 */
	getSupportedCurrencies(): string[] {
		return [
			"GBP",
			"EUR",
			"USD",
			"JPY",
			"CHF",
			"CAD",
			"AUD",
			"NZD",
			"SEK",
			"NOK",
			"DKK",
			"PLN",
			"CZK",
			"HUF",
		];
	}

	/**
	 * Check if multi-currency support is needed
	 */
	needsConversion(currencies: string[]): boolean {
		const uniqueCurrencies = new Set(currencies);
		return uniqueCurrencies.size > 1;
	}

	/**
	 * Calculate total across multiple currencies
	 */
	async calculateMultiCurrencyTotal(
		amounts: Array<{ amount: number; currency: string }>,
		targetCurrency = this.baseCurrency,
	): Promise<number> {
		let total = 0;

		for (const { amount, currency } of amounts) {
			const converted = await this.convertCurrency(
				amount,
				currency,
				targetCurrency,
			);
			total += converted;
		}

		return this.roundToDecimalPlaces(total, 2);
	}

	/**
	 * Private: Convert amount using exchange rate
	 */
	private convertAmount(amount: number, rate: number): number {
		return this.roundToDecimalPlaces(amount * rate, 2);
	}

	/**
	 * Private: Round to specific decimal places
	 */
	private roundToDecimalPlaces(value: number, decimals: number): number {
		const multiplier = 10 ** decimals;
		return Math.round(value * multiplier) / multiplier;
	}

	/**
	 * Private: Fetch exchange rate from API (placeholder)
	 * In production, this would call a real exchange rate API
	 */
	private async fetchExchangeRate(
		fromCurrency: string,
		toCurrency: string,
	): Promise<number> {
		// Static rates for development (update these with real API in production)
		const rates: Record<string, Record<string, number>> = {
			GBP: {
				EUR: 1.17,
				USD: 1.27,
				JPY: 189.5,
				CHF: 1.1,
				CAD: 1.71,
				AUD: 1.94,
				NZD: 2.09,
			},
			EUR: {
				GBP: 0.85,
				USD: 1.08,
				JPY: 161.8,
			},
			USD: {
				GBP: 0.79,
				EUR: 0.93,
				JPY: 149.5,
			},
		};

		const rate = rates[fromCurrency]?.[toCurrency];
		if (!rate) {
			// If rate not found, try inverse rate
			const inverseRate = rates[toCurrency]?.[fromCurrency];
			if (inverseRate) {
				return 1 / inverseRate;
			}

			// Default to 1:1 if no rate available (should fetch from API in production)
			console.warn(
				`Exchange rate not found for ${fromCurrency} to ${toCurrency}, defaulting to 1:1`,
			);
			return 1.0;
		}

		return rate;
	}

	/**
	 * Private: Fetch historical exchange rate (placeholder)
	 */
	private async fetchHistoricalExchangeRate(
		fromCurrency: string,
		toCurrency: string,
		date: Date,
	): Promise<number> {
		// In production, fetch historical rates from API
		// For now, use current rates as fallback
		return this.fetchExchangeRate(fromCurrency, toCurrency);
	}

	/**
	 * Clear exchange rate cache
	 */
	clearCache(): void {
		this.exchangeRates.clear();
		this.historicalRates.clear();
	}

	/**
	 * Set exchange rate manually (useful for testing)
	 */
	setExchangeRate(
		fromCurrency: string,
		toCurrency: string,
		rate: number,
	): void {
		if (!this.exchangeRates.has(fromCurrency)) {
			this.exchangeRates.set(fromCurrency, new Map());
		}
		this.exchangeRates.get(fromCurrency)?.set(toCurrency, rate);
	}
}

// Singleton instance
export const currencyService = new CurrencyService();
