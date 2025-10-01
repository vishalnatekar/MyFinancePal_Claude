# Data Models

Based on your PRD requirements, here are the core entities needed for MyFinancePal's privacy-first household expense management:

## User

**Purpose:** Individual users who can belong to households and own financial accounts

**Key Attributes:**
- id: UUID - Primary identifier
- email: string - From Google OAuth
- full_name: string - From Google profile
- avatar_url: string - Google profile picture
- created_at: timestamp - Account creation
- notification_preferences: JSON - Email/push settings

**TypeScript Interface:**
```typescript
interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  notification_preferences: {
    email_notifications: boolean;
    shared_expense_alerts: boolean;
    settlement_reminders: boolean;
  };
}
```

**Relationships:**
- One-to-many with FinancialAccounts
- Many-to-many with Households (through HouseholdMembers)

## Household

**Purpose:** Groups of users who share expenses and view selected financial data together

**Key Attributes:**
- id: UUID - Primary identifier
- name: string - "The Smith Family", "Flat 3B"
- description: string - Optional household details
- created_by: UUID - User who created household
- settlement_day: number - Monthly settlement day (1-31)

**TypeScript Interface:**
```typescript
interface Household {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  settlement_day: number;
}
```

**Relationships:**
- Many-to-many with Users (through HouseholdMembers)
- One-to-many with ExpenseSplittingRules
- One-to-many with Settlements

## FinancialAccount

**Purpose:** Individual bank/investment accounts connected via TrueLayer API or manual entry

**TypeScript Interface:**
```typescript
interface FinancialAccount {
  id: string;
  user_id: string;
  truelayer_account_id?: string;
  account_type: 'checking' | 'savings' | 'investment' | 'credit';
  account_name: string;
  institution_name: string;
  current_balance: number;
  is_shared: boolean;
  last_synced?: string;
  is_manual: boolean;
}
```

## Transaction

**Purpose:** Individual financial transactions from bank feeds or manual entry

**TypeScript Interface:**
```typescript
interface Transaction {
  id: string;
  account_id: string;
  truelayer_transaction_id?: string;
  amount: number;
  merchant_name: string;
  category: string;
  date: string;
  is_shared_expense: boolean;
  splitting_rule_id?: string;
  manual_override: boolean;
}
```

## ExpenseSplittingRule

**Purpose:** Automated rules for categorizing transactions as shared vs personal

**TypeScript Interface:**
```typescript
interface ExpenseSplittingRule {
  id: string;
  household_id: string;
  rule_name: string;
  merchant_pattern?: string;
  category_match?: string;
  split_percentage: Record<string, number>; // user_id -> percentage
  is_active: boolean;
  created_by: string;
}
```
