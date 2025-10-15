// Rule Matching Service Tests
// Story 4.1: Expense Splitting Rules Engine

import {
  findMatchingRule,
  ruleMatches,
  validateRuleConfiguration,
  getRuleMatchStatistics,
} from '@/services/rule-matching-service';
import type { SplittingRule } from '@/types/splitting-rule';
import type { Transaction } from '@/types/transaction';

describe('Rule Matching Service', () => {
  // Mock transactions
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      account_id: 'acc1',
      amount: -50.00,
      merchant_name: 'Tesco Extra',
      category: 'groceries',
      date: '2025-10-15',
      currency: 'GBP',
      created_at: '2025-10-15T10:00:00Z',
    },
    {
      id: '2',
      account_id: 'acc1',
      amount: -150.00,
      merchant_name: 'John Lewis',
      category: 'shopping',
      date: '2025-10-15',
      currency: 'GBP',
      created_at: '2025-10-15T11:00:00Z',
    },
    {
      id: '3',
      account_id: 'acc1',
      amount: -25.00,
      merchant_name: 'Nando\'s',
      category: 'dining',
      date: '2025-10-15',
      currency: 'GBP',
      created_at: '2025-10-15T12:00:00Z',
    },
  ] as Transaction[];

  // Mock rules
  const merchantRule: SplittingRule = {
    id: 'rule1',
    household_id: 'hh1',
    rule_name: 'Tesco Groceries',
    rule_type: 'merchant',
    priority: 10,
    merchant_pattern: 'Tesco.*',
    split_percentage: { user1: 50, user2: 50 },
    is_active: true,
    created_by: 'user1',
    created_at: '2025-10-15T09:00:00Z',
    apply_to_existing_transactions: false,
  };

  const categoryRule: SplittingRule = {
    id: 'rule2',
    household_id: 'hh1',
    rule_name: 'Dining Out',
    rule_type: 'category',
    priority: 20,
    category_match: 'dining',
    split_percentage: { user1: 50, user2: 50 },
    is_active: true,
    created_by: 'user1',
    created_at: '2025-10-15T09:00:00Z',
    apply_to_existing_transactions: false,
  };

  const amountThresholdRule: SplittingRule = {
    id: 'rule3',
    household_id: 'hh1',
    rule_name: 'Large Purchases',
    rule_type: 'amount_threshold',
    priority: 5,
    min_amount: 100.00,
    split_percentage: { user1: 50, user2: 50 },
    is_active: true,
    created_by: 'user1',
    created_at: '2025-10-15T09:00:00Z',
    apply_to_existing_transactions: false,
  };

  const defaultRule: SplittingRule = {
    id: 'rule4',
    household_id: 'hh1',
    rule_name: 'Default Share All',
    rule_type: 'default',
    priority: 999,
    split_percentage: { user1: 50, user2: 50 },
    is_active: true,
    created_by: 'user1',
    created_at: '2025-10-15T09:00:00Z',
    apply_to_existing_transactions: false,
  };

  describe('ruleMatches', () => {
    it('should match merchant rule with regex pattern', () => {
      expect(ruleMatches(merchantRule, mockTransactions[0])).toBe(true);
      expect(ruleMatches(merchantRule, mockTransactions[1])).toBe(false);
    });

    it('should match category rule', () => {
      expect(ruleMatches(categoryRule, mockTransactions[2])).toBe(true);
      expect(ruleMatches(categoryRule, mockTransactions[0])).toBe(false);
    });

    it('should match amount threshold rule', () => {
      expect(ruleMatches(amountThresholdRule, mockTransactions[1])).toBe(true); // £150
      expect(ruleMatches(amountThresholdRule, mockTransactions[0])).toBe(false); // £50
    });

    it('should match default rule for all transactions', () => {
      mockTransactions.forEach(tx => {
        expect(ruleMatches(defaultRule, tx)).toBe(true);
      });
    });
  });

  describe('findMatchingRule', () => {
    it('should return highest priority matching rule', () => {
      const rules = [merchantRule, categoryRule, amountThresholdRule, defaultRule];

      // Tesco transaction should match merchant rule (priority 10) and default (priority 999)
      // Should return merchant rule (higher priority)
      const match = findMatchingRule(mockTransactions[0], rules);
      expect(match?.id).toBe(merchantRule.id);
    });

    it('should return null if no rules match', () => {
      const rules = [merchantRule, categoryRule]; // No rule matches John Lewis
      const match = findMatchingRule(mockTransactions[1], rules);
      expect(match).toBeNull();
    });

    it('should ignore inactive rules', () => {
      const inactiveRule = { ...merchantRule, is_active: false };
      const rules = [inactiveRule, defaultRule];

      const match = findMatchingRule(mockTransactions[0], rules);
      expect(match?.id).toBe(defaultRule.id); // Should skip inactive merchant rule
    });
  });

  describe('validateRuleConfiguration', () => {
    it('should validate merchant rule requires merchant_pattern', () => {
      const invalidRule = { ...merchantRule, merchant_pattern: undefined };
      const result = validateRuleConfiguration(invalidRule);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Merchant rule requires merchant_pattern');
    });

    it('should validate category rule requires category_match', () => {
      const invalidRule = { ...categoryRule, category_match: undefined };
      const result = validateRuleConfiguration(invalidRule);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Category rule requires category_match');
    });

    it('should validate amount threshold rule requires min_amount', () => {
      const invalidRule = { ...amountThresholdRule, min_amount: undefined };
      const result = validateRuleConfiguration(invalidRule);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount threshold rule requires min_amount');
    });

    it('should validate split_percentage sums to 100', () => {
      const invalidRule = { ...merchantRule, split_percentage: { user1: 60, user2: 30 } };
      const result = validateRuleConfiguration(invalidRule);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('100%'))).toBe(true);
    });

    it('should validate regex pattern', () => {
      const invalidRule = { ...merchantRule, merchant_pattern: '[invalid(regex' };
      const result = validateRuleConfiguration(invalidRule);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid regex pattern in merchant_pattern');
    });
  });

  describe('getRuleMatchStatistics', () => {
    it('should return correct statistics', () => {
      const rules = [merchantRule, categoryRule, defaultRule];
      const stats = getRuleMatchStatistics(mockTransactions, rules);

      expect(stats.total_transactions).toBe(3);
      expect(stats.matched_transactions).toBe(2); // Tesco + Nando's
      expect(stats.unmatched_transactions).toBe(1); // John Lewis
      expect(stats.matches_by_rule[merchantRule.id]).toBe(1);
      expect(stats.matches_by_rule[categoryRule.id]).toBe(1);
    });
  });
});
