/**
 * Tests for Transaction Categorization Service
 */

import { TransactionCategorizationService } from '@/services/transaction-categorization-service';

describe('TransactionCategorizationService', () => {
  describe('categorizeTransaction', () => {
    it('should categorize groceries correctly', () => {
      expect(
        TransactionCategorizationService.categorizeTransaction('Tesco', -50.0)
      ).toBe('groceries');
      expect(
        TransactionCategorizationService.categorizeTransaction('SAINSBURYS', -30.0)
      ).toBe('groceries');
      expect(
        TransactionCategorizationService.categorizeTransaction('Aldi Store', -25.0)
      ).toBe('groceries');
    });

    it('should categorize utilities correctly', () => {
      expect(
        TransactionCategorizationService.categorizeTransaction('British Gas', -75.0)
      ).toBe('utilities');
      expect(
        TransactionCategorizationService.categorizeTransaction('Thames Water', -45.0)
      ).toBe('utilities');
      expect(
        TransactionCategorizationService.categorizeTransaction('EDF Energy', -120.0)
      ).toBe('utilities');
    });

    it('should categorize entertainment correctly', () => {
      expect(
        TransactionCategorizationService.categorizeTransaction('Netflix', -12.99)
      ).toBe('entertainment');
      expect(
        TransactionCategorizationService.categorizeTransaction('Spotify Premium', -9.99)
      ).toBe('entertainment');
      expect(
        TransactionCategorizationService.categorizeTransaction('Odeon Cinema', -15.0)
      ).toBe('entertainment');
    });

    it('should categorize transport correctly', () => {
      expect(
        TransactionCategorizationService.categorizeTransaction('Uber Trip', -25.0)
      ).toBe('transport');
      expect(
        TransactionCategorizationService.categorizeTransaction('TFL Oyster', -40.0)
      ).toBe('transport');
      expect(
        TransactionCategorizationService.categorizeTransaction('Shell Petrol', -60.0)
      ).toBe('transport');
    });

    it('should categorize dining correctly', () => {
      expect(
        TransactionCategorizationService.categorizeTransaction("Joe's Restaurant", -45.0)
      ).toBe('dining');
      expect(
        TransactionCategorizationService.categorizeTransaction('Starbucks', -4.50)
      ).toBe('dining');
      expect(
        TransactionCategorizationService.categorizeTransaction('Deliveroo', -25.0)
      ).toBe('dining');
    });

    it('should categorize shopping correctly', () => {
      expect(
        TransactionCategorizationService.categorizeTransaction('Amazon', -35.0)
      ).toBe('shopping');
      expect(
        TransactionCategorizationService.categorizeTransaction('H&M Store', -50.0)
      ).toBe('shopping');
      expect(
        TransactionCategorizationService.categorizeTransaction('John Lewis', -120.0)
      ).toBe('shopping');
    });

    it('should categorize healthcare correctly', () => {
      expect(
        TransactionCategorizationService.categorizeTransaction('Boots Pharmacy', -15.0)
      ).toBe('healthcare');
      expect(
        TransactionCategorizationService.categorizeTransaction('NHS Dental', -65.0)
      ).toBe('healthcare');
    });

    it('should categorize housing correctly', () => {
      expect(
        TransactionCategorizationService.categorizeTransaction('Monthly Rent', -1200.0)
      ).toBe('housing');
      expect(
        TransactionCategorizationService.categorizeTransaction('IKEA', -200.0)
      ).toBe('housing');
    });

    it('should categorize income correctly', () => {
      expect(
        TransactionCategorizationService.categorizeTransaction('Salary Payment', 3000.0)
      ).toBe('income');
      expect(
        TransactionCategorizationService.categorizeTransaction('Refund', 50.0)
      ).toBe('income');
      expect(
        TransactionCategorizationService.categorizeTransaction('Transfer from John', 600.0)
      ).toBe('income');
    });

    it('should categorize transfers correctly', () => {
      expect(
        TransactionCategorizationService.categorizeTransaction('Transfer to Savings', -500.0)
      ).toBe('transfer');
      expect(
        TransactionCategorizationService.categorizeTransaction('ATM Withdrawal', -100.0)
      ).toBe('transfer');
    });

    it('should default to other for unknown merchants', () => {
      expect(
        TransactionCategorizationService.categorizeTransaction('Unknown Store XYZ', -25.0)
      ).toBe('other');
      expect(
        TransactionCategorizationService.categorizeTransaction('Random Merchant', -10.0)
      ).toBe('other');
    });

    it('should use description for categorization', () => {
      expect(
        TransactionCategorizationService.categorizeTransaction(
          'POS Purchase',
          -40.0,
          'Tesco Supermarket'
        )
      ).toBe('groceries');
    });
  });

  describe('categorizeTransactions', () => {
    it('should bulk categorize multiple transactions', () => {
      const transactions = [
        { merchant_name: 'Tesco', amount: -50.0 },
        { merchant_name: 'Netflix', amount: -12.99 },
        { merchant_name: 'Salary', amount: 3000.0 },
      ];

      const categories =
        TransactionCategorizationService.categorizeTransactions(transactions);

      expect(categories).toEqual(['groceries', 'entertainment', 'income']);
    });
  });

  describe('getAvailableCategories', () => {
    it('should return all available categories', () => {
      const categories =
        TransactionCategorizationService.getAvailableCategories();

      expect(categories).toContain('groceries');
      expect(categories).toContain('utilities');
      expect(categories).toContain('entertainment');
      expect(categories).toContain('transport');
      expect(categories).toContain('dining');
      expect(categories).toContain('shopping');
      expect(categories).toContain('healthcare');
      expect(categories).toContain('housing');
      expect(categories).toContain('income');
      expect(categories).toContain('transfer');
      expect(categories).toContain('other');
    });
  });

  describe('getCategoryColor', () => {
    it('should return color scheme for each category', () => {
      const groceriesColor =
        TransactionCategorizationService.getCategoryColor('groceries');
      expect(groceriesColor).toHaveProperty('bg');
      expect(groceriesColor).toHaveProperty('text');

      const utililitesColor =
        TransactionCategorizationService.getCategoryColor('utilities');
      expect(utililitesColor.bg).toBe('bg-blue-100');
      expect(utililitesColor.text).toBe('text-blue-800');
    });
  });
});
