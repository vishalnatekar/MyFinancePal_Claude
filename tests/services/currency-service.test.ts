import { CurrencyService } from "@/services/currency-service";

describe("CurrencyService", () => {
	let service: CurrencyService;

	beforeEach(() => {
		service = new CurrencyService();
		service.clearCache();
	});

	describe("normalizeToGBP", () => {
		it("should return same amount for GBP", async () => {
			const result = await service.normalizeToGBP(100, "GBP");
			expect(result).toBe(100);
		});

		it("should convert EUR to GBP", async () => {
			const result = await service.normalizeToGBP(100, "EUR");
			expect(result).toBeCloseTo(85, 1);
		});

		it("should convert USD to GBP", async () => {
			const result = await service.normalizeToGBP(100, "USD");
			expect(result).toBeCloseTo(79, 1);
		});
	});

	describe("convertCurrency", () => {
		it("should return same amount for same currency", async () => {
			const result = await service.convertCurrency(100, "GBP", "GBP");
			expect(result).toBe(100);
		});

		it("should convert between different currencies", async () => {
			const result = await service.convertCurrency(100, "GBP", "EUR");
			expect(result).toBeGreaterThan(0);
			expect(result).toBeCloseTo(117, 1);
		});

		it("should use cached exchange rates", async () => {
			// First call
			const result1 = await service.convertCurrency(100, "GBP", "USD");

			// Second call should use cache
			const result2 = await service.convertCurrency(100, "GBP", "USD");

			expect(result1).toBe(result2);
		});
	});

	describe("getExchangeRate", () => {
		it("should return exchange rate", async () => {
			const rate = await service.getExchangeRate("GBP", "EUR");
			expect(rate).toBeGreaterThan(0);
		});

		it("should cache exchange rates", async () => {
			const rate1 = await service.getExchangeRate("GBP", "USD");
			const rate2 = await service.getExchangeRate("GBP", "USD");

			expect(rate1).toBe(rate2);
		});

		it("should handle inverse rates", async () => {
			const rateGBPtoEUR = await service.getExchangeRate("GBP", "EUR");
			const rateEURtoGBP = await service.getExchangeRate("EUR", "GBP");

			// Inverse rate should be approximately 1 / original rate
			expect(rateEURtoGBP).toBeCloseTo(1 / rateGBPtoEUR, 2);
		});
	});

	describe("formatCurrency", () => {
		it("should format GBP with symbol", () => {
			const formatted = service.formatCurrency(1234.56, "GBP");
			expect(formatted).toContain("£");
			expect(formatted).toContain("1,234.56");
		});

		it("should format without symbol", () => {
			const formatted = service.formatCurrency(1234.56, "GBP", {
				showSymbol: false,
			});
			expect(formatted).not.toContain("£");
			expect(formatted).toContain("1,234.56");
		});

		it("should format with custom decimals", () => {
			const formatted = service.formatCurrency(1234.5, "GBP", {
				decimals: 0,
			});
			expect(formatted).toContain("1,235");
		});

		it("should format different currencies", () => {
			const gbp = service.formatCurrency(100, "GBP");
			const eur = service.formatCurrency(100, "EUR");
			const usd = service.formatCurrency(100, "USD");

			expect(gbp).toContain("£");
			expect(eur).toContain("€");
			expect(usd).toContain("$");
		});
	});

	describe("getCurrencySymbol", () => {
		it("should return correct symbols", () => {
			expect(service.getCurrencySymbol("GBP")).toBe("£");
			expect(service.getCurrencySymbol("EUR")).toBe("€");
			expect(service.getCurrencySymbol("USD")).toBe("$");
			expect(service.getCurrencySymbol("JPY")).toBe("¥");
		});

		it("should return currency code for unknown currencies", () => {
			expect(service.getCurrencySymbol("XXX")).toBe("XXX");
		});
	});

	describe("detectCurrency", () => {
		it("should detect currency from account data", () => {
			const accountData = { currency: "GBP" };
			const currency = service.detectCurrency(accountData);
			expect(currency).toBe("GBP");
		});

		it("should detect currency from balance", () => {
			const accountData = { balance: { currency: "EUR" } };
			const currency = service.detectCurrency(accountData);
			expect(currency).toBe("EUR");
		});

		it("should default to GBP if no currency found", () => {
			const accountData = {};
			const currency = service.detectCurrency(accountData);
			expect(currency).toBe("GBP");
		});
	});

	describe("validateCurrencyCode", () => {
		it("should validate correct currency codes", () => {
			expect(service.validateCurrencyCode("GBP")).toBe("GBP");
			expect(service.validateCurrencyCode("eur")).toBe("EUR");
			expect(service.validateCurrencyCode("usd")).toBe("USD");
		});

		it("should throw error for invalid codes", () => {
			expect(() => service.validateCurrencyCode("XXX")).toThrow();
			expect(() => service.validateCurrencyCode("123")).toThrow();
		});
	});

	describe("getSupportedCurrencies", () => {
		it("should return array of currencies", () => {
			const currencies = service.getSupportedCurrencies();
			expect(Array.isArray(currencies)).toBe(true);
			expect(currencies.length).toBeGreaterThan(0);
			expect(currencies).toContain("GBP");
			expect(currencies).toContain("EUR");
			expect(currencies).toContain("USD");
		});
	});

	describe("needsConversion", () => {
		it("should return false for single currency", () => {
			expect(service.needsConversion(["GBP", "GBP", "GBP"])).toBe(false);
		});

		it("should return true for multiple currencies", () => {
			expect(service.needsConversion(["GBP", "EUR", "USD"])).toBe(true);
		});

		it("should return false for empty array", () => {
			expect(service.needsConversion([])).toBe(false);
		});
	});

	describe("calculateMultiCurrencyTotal", () => {
		it("should calculate total in target currency", async () => {
			const amounts = [
				{ amount: 100, currency: "GBP" },
				{ amount: 100, currency: "EUR" },
				{ amount: 100, currency: "USD" },
			];

			const total = await service.calculateMultiCurrencyTotal(amounts, "GBP");

			expect(total).toBeGreaterThan(0);
			// 100 GBP + ~85 GBP (from EUR) + ~79 GBP (from USD) ≈ 264 GBP
			expect(total).toBeCloseTo(264, 0);
		});

		it("should handle single currency amounts", async () => {
			const amounts = [
				{ amount: 50, currency: "GBP" },
				{ amount: 50, currency: "GBP" },
			];

			const total = await service.calculateMultiCurrencyTotal(amounts, "GBP");

			expect(total).toBe(100);
		});
	});

	describe("setExchangeRate", () => {
		it("should allow setting custom exchange rates", async () => {
			service.setExchangeRate("GBP", "EUR", 1.5);

			const rate = await service.getExchangeRate("GBP", "EUR");
			expect(rate).toBe(1.5);
		});
	});

	describe("clearCache", () => {
		it("should clear cached exchange rates", async () => {
			// Get a rate to cache it
			await service.getExchangeRate("GBP", "EUR");

			// Set a custom rate
			service.setExchangeRate("GBP", "EUR", 2.0);

			// Clear cache
			service.clearCache();

			// Next call should fetch fresh rate (not the custom one)
			const rate = await service.getExchangeRate("GBP", "EUR");
			expect(rate).not.toBe(2.0);
		});
	});

	describe("getHistoricalExchangeRate", () => {
		it("should get historical exchange rate for date", async () => {
			const date = new Date("2025-10-01");
			const rate = await service.getHistoricalExchangeRate(
				"GBP",
				"EUR",
				date,
			);

			expect(rate).toBeGreaterThan(0);
		});

		it("should cache historical rates", async () => {
			const date = new Date("2025-10-01");

			const rate1 = await service.getHistoricalExchangeRate(
				"GBP",
				"EUR",
				date,
			);
			const rate2 = await service.getHistoricalExchangeRate(
				"GBP",
				"EUR",
				date,
			);

			expect(rate1).toBe(rate2);
		});
	});
});
