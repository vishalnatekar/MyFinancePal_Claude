// Rule Templates Library
// Story 4.1: Expense Splitting Rules Engine
// Predefined templates for common household scenarios

import type { RuleTemplate } from '@/types/splitting-rule';

/**
 * Predefined rule templates for common household scenarios
 */
export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: 'groceries-5050',
    name: 'Split Groceries 50/50',
    description: 'Share all grocery expenses equally between two people',
    rule_type: 'category',
    default_config: {
      rule_name: 'Groceries 50/50',
      rule_type: 'category',
      category_match: 'groceries',
      split_percentage: {}, // Populated with household members (50/50)
      priority: 10,
    },
    example_transactions: ['Tesco', 'Sainsbury\'s', 'Waitrose', 'Asda', 'Morrisons'],
  },
  {
    id: 'utilities-custom',
    name: 'Split Utilities by Custom Ratio',
    description: 'Share utility bills with custom percentages per person',
    rule_type: 'category',
    default_config: {
      rule_name: 'Utilities Split',
      rule_type: 'category',
      category_match: 'utilities',
      split_percentage: {}, // User customizes
      priority: 15,
    },
    example_transactions: ['Thames Water', 'British Gas', 'EDF Energy', 'Council Tax'],
  },
  {
    id: 'large-purchases',
    name: 'Share Large Purchases (>£100)',
    description: 'Automatically share any transaction over £100',
    rule_type: 'amount_threshold',
    default_config: {
      rule_name: 'Large Purchases',
      rule_type: 'amount_threshold',
      min_amount: 100.00,
      split_percentage: {}, // Populated with 50/50
      priority: 5,
    },
    example_transactions: ['John Lewis £250', 'Currys £180', 'IKEA £150'],
  },
  {
    id: 'supermarket-merchant',
    name: 'Share All Supermarket Purchases',
    description: 'Match all major UK supermarkets automatically',
    rule_type: 'merchant',
    default_config: {
      rule_name: 'Supermarkets',
      rule_type: 'merchant',
      merchant_pattern: '(Tesco|Sainsbury|Asda|Morrisons|Waitrose|Aldi|Lidl|Co-op).*',
      split_percentage: {},
      priority: 20,
    },
    example_transactions: ['Tesco Extra', 'Sainsbury\'s Local', 'Aldi'],
  },
  {
    id: 'restaurants-dining',
    name: 'Split Restaurant & Dining',
    description: 'Share all restaurant and dining expenses',
    rule_type: 'category',
    default_config: {
      rule_name: 'Restaurants & Dining',
      rule_type: 'category',
      category_match: 'dining',
      split_percentage: {},
      priority: 25,
    },
    example_transactions: ['Nando\'s', 'Pizza Express', 'Starbucks', 'Deliveroo'],
  },
  {
    id: 'transport-shared',
    name: 'Share Transport Costs',
    description: 'Split all transport and travel expenses',
    rule_type: 'category',
    default_config: {
      rule_name: 'Transport',
      rule_type: 'category',
      category_match: 'transport',
      split_percentage: {},
      priority: 30,
    },
    example_transactions: ['Uber', 'TfL', 'Trainline', 'Shell Petrol'],
  },
  {
    id: 'entertainment-shared',
    name: 'Share Entertainment Costs',
    description: 'Split streaming services, cinema, and entertainment',
    rule_type: 'category',
    default_config: {
      rule_name: 'Entertainment',
      rule_type: 'category',
      category_match: 'entertainment',
      split_percentage: {},
      priority: 35,
    },
    example_transactions: ['Netflix', 'Spotify', 'Odeon Cinema', 'Amazon Prime'],
  },
  {
    id: 'household-supplies',
    name: 'Share Household Supplies',
    description: 'Split cleaning products, toiletries, and household items',
    rule_type: 'category',
    default_config: {
      rule_name: 'Household Supplies',
      rule_type: 'category',
      category_match: 'household',
      split_percentage: {},
      priority: 40,
    },
    example_transactions: ['Boots', 'Superdrug', 'Wilko', 'B&M'],
  },
  {
    id: 'small-purchases',
    name: 'Keep Small Purchases Private (<£10)',
    description: 'Don\'t share transactions under £10 to avoid micro-splitting',
    rule_type: 'amount_threshold',
    default_config: {
      rule_name: 'Small Purchases Private',
      rule_type: 'amount_threshold',
      min_amount: 0,
      max_amount: 10.00,
      split_percentage: {}, // 100% to self
      priority: 50,
    },
    example_transactions: ['Coffee £3.50', 'Snack £5', 'Magazine £4.99'],
  },
  {
    id: 'default-share-all',
    name: 'Share Everything (Default Rule)',
    description: 'Share all transactions that don\'t match other rules',
    rule_type: 'default',
    default_config: {
      rule_name: 'Default - Share All',
      rule_type: 'default',
      split_percentage: {},
      priority: 999, // Lowest priority
    },
    example_transactions: ['Any transaction not covered by other rules'],
  },
  {
    id: 'default-keep-private',
    name: 'Keep Everything Private (Default Rule)',
    description: 'Keep all transactions private unless matched by other rules',
    rule_type: 'default',
    default_config: {
      rule_name: 'Default - Keep Private',
      rule_type: 'default',
      split_percentage: {}, // 100% to self
      priority: 999, // Lowest priority
    },
    example_transactions: ['Any transaction not covered by other rules'],
  },
];

/**
 * Get a template by ID
 */
export function getTemplateById(templateId: string): RuleTemplate | undefined {
  return RULE_TEMPLATES.find(template => template.id === templateId);
}

/**
 * Get templates filtered by rule type
 */
export function getTemplatesByType(ruleType: string): RuleTemplate[] {
  return RULE_TEMPLATES.filter(template => template.rule_type === ruleType);
}

/**
 * Populate template with household member split percentages
 * For 50/50 templates with 2 members, or equal split for more members
 */
export function populateTemplateSplit(
  template: RuleTemplate,
  householdMemberIds: string[]
): Record<string, number> {
  const memberCount = householdMemberIds.length;

  if (memberCount === 0) {
    return {};
  }

  // For 2 members, use 50/50
  if (memberCount === 2) {
    return {
      [householdMemberIds[0]]: 50,
      [householdMemberIds[1]]: 50,
    };
  }

  // For more members, calculate equal split
  const basePercentage = Math.floor(100 / memberCount);
  const remainder = 100 - (basePercentage * memberCount);

  const split: Record<string, number> = {};
  householdMemberIds.forEach((memberId, index) => {
    // Give remainder to first member to ensure sum is exactly 100
    split[memberId] = basePercentage + (index === 0 ? remainder : 0);
  });

  return split;
}

/**
 * Populate template for "keep private" scenarios (100% to one person)
 */
export function populateTemplatePrivate(
  currentUserId: string
): Record<string, number> {
  return {
    [currentUserId]: 100,
  };
}

/**
 * Create a rule from a template with customizations
 */
export function createRuleFromTemplate(
  template: RuleTemplate,
  householdMemberIds: string[],
  currentUserId: string,
  customizations?: Partial<Record<string, any>>
): Record<string, any> {
  // Start with template defaults
  const rule = { ...template.default_config };

  // Populate split_percentage based on template type
  if (template.id.includes('private') || template.id === 'default-keep-private') {
    rule.split_percentage = populateTemplatePrivate(currentUserId);
  } else {
    rule.split_percentage = populateTemplateSplit(template, householdMemberIds);
  }

  // Apply customizations if provided
  if (customizations) {
    Object.assign(rule, customizations);
  }

  return rule;
}
