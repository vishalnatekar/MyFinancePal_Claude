# Testing Strategy

> **Document Version:** v4.1
> **Last Updated:** 2025-10-07
> **Status:** Active

## Overview

This document defines the comprehensive testing strategy for MyFinancePal. Our approach follows the testing pyramid with heavy emphasis on unit tests, strategic integration tests, and targeted end-to-end tests.

---

## Testing Pyramid

```
        /\
       /  \      E2E Tests (5%)
      /----\     - Critical user journeys
     /      \    - Authentication flows
    /--------\   Integration Tests (15%)
   /          \  - API + Database
  /------------\ - Service layer
 /--------------\ Unit Tests (80%)
 ----------------  - Components
                   - Services
                   - Utilities
```

### Distribution Target
- **80% Unit Tests** - Fast, isolated, comprehensive coverage
- **15% Integration Tests** - API routes with database, service integration
- **5% E2E Tests** - Critical user flows, authentication, core features

---

## Test Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Unit Testing** | Jest | Test runner and assertion library |
| **React Testing** | React Testing Library | Component testing |
| **API Testing** | Supertest | HTTP endpoint testing |
| **E2E Testing** | Playwright | Full browser automation |
| **Mocking** | Jest mocks | Service and module mocking |
| **Test Utils** | @testing-library/user-event | User interaction simulation |

### Configuration Files
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Global test setup
- `playwright.config.ts` - Playwright configuration

---

## Unit Testing

### Component Tests

#### Location
```
src/components/transactions/TransactionList.tsx
tests/components/transactions/TransactionList.test.tsx
```

#### Pattern
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionList } from '@/components/transactions/TransactionList';

describe('TransactionList', () => {
  const mockTransactions = [
    {
      id: '1',
      amount: 100,
      merchant_name: 'Test Store',
      category: 'groceries',
      date: '2025-01-01',
    },
  ];

  it('renders transactions correctly', () => {
    render(<TransactionList transactions={mockTransactions} />);

    expect(screen.getByText('Test Store')).toBeInTheDocument();
    expect(screen.getByText('£100.00')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<TransactionList transactions={[]} isLoading={true} />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows empty state when no transactions', () => {
    render(<TransactionList transactions={[]} isLoading={false} />);

    expect(screen.getByText(/no transactions found/i)).toBeInTheDocument();
  });

  it('handles transaction click', async () => {
    const handleClick = jest.fn();
    render(
      <TransactionList
        transactions={mockTransactions}
        onTransactionClick={handleClick}
      />
    );

    const transaction = screen.getByText('Test Store');
    await userEvent.click(transaction);

    expect(handleClick).toHaveBeenCalledWith(mockTransactions[0]);
  });

  it('filters transactions by category', async () => {
    const allTransactions = [
      { ...mockTransactions[0], category: 'groceries' },
      { id: '2', amount: 50, merchant_name: 'Gas Station', category: 'transport', date: '2025-01-02' },
    ];

    render(<TransactionList transactions={allTransactions} />);

    const categoryFilter = screen.getByLabelText(/category/i);
    await userEvent.selectOptions(categoryFilter, 'groceries');

    expect(screen.getByText('Test Store')).toBeInTheDocument();
    expect(screen.queryByText('Gas Station')).not.toBeInTheDocument();
  });
});
```

#### What to Test in Components
- ✅ Rendering with different props
- ✅ Loading states
- ✅ Empty states
- ✅ Error states
- ✅ User interactions (clicks, inputs, form submissions)
- ✅ Conditional rendering
- ✅ Accessibility (ARIA labels, roles)
- ❌ Implementation details (state variable names, internal functions)
- ❌ CSS styling (unless critical to functionality)

### Service Tests

#### Location
```
src/services/transaction-service.ts
tests/services/transaction-service.test.ts
```

#### Pattern
```typescript
import { transactionService } from '@/services/transaction-service';

// Mock fetch
global.fetch = jest.fn();

describe('TransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('fetches transactions successfully', async () => {
      const mockTransactions = [
        { id: '1', amount: 100, merchant_name: 'Test' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ transactions: mockTransactions }),
      });

      const result = await transactionService.list({ accountId: '123' });

      expect(result).toEqual(mockTransactions);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/transactions'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('handles API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      await expect(
        transactionService.list({ accountId: '123' })
      ).rejects.toThrow('Failed to fetch transactions');
    });

    it('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        transactionService.list({ accountId: '123' })
      ).rejects.toThrow('Network error');
    });
  });
});
```

#### What to Test in Services
- ✅ Successful API calls
- ✅ Error handling (4xx, 5xx responses)
- ✅ Network errors
- ✅ Data transformation
- ✅ Parameter validation
- ✅ Retry logic (if implemented)
- ✅ Caching behavior (if implemented)

### Utility Function Tests

#### Location
```
src/lib/currency-utils.ts
tests/lib/currency-utils.test.ts
```

#### Pattern
```typescript
import { formatCurrency, parseCurrency } from '@/lib/currency-utils';

describe('currency-utils', () => {
  describe('formatCurrency', () => {
    it('formats positive amounts', () => {
      expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56');
    });

    it('formats negative amounts', () => {
      expect(formatCurrency(-1234.56, 'GBP')).toBe('-£1,234.56');
    });

    it('formats zero', () => {
      expect(formatCurrency(0, 'GBP')).toBe('£0.00');
    });

    it('handles different currencies', () => {
      expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
    });

    it('rounds to 2 decimal places', () => {
      expect(formatCurrency(1234.567, 'GBP')).toBe('£1,234.57');
    });
  });

  describe('parseCurrency', () => {
    it('parses formatted currency strings', () => {
      expect(parseCurrency('£1,234.56')).toBe(1234.56);
    });

    it('handles currency symbols', () => {
      expect(parseCurrency('$1,000.00')).toBe(1000);
      expect(parseCurrency('€999.99')).toBe(999.99);
    });

    it('handles negative amounts', () => {
      expect(parseCurrency('-£500.00')).toBe(-500);
    });

    it('returns null for invalid input', () => {
      expect(parseCurrency('invalid')).toBeNull();
      expect(parseCurrency('')).toBeNull();
    });
  });
});
```

---

## Integration Testing

### API Route Tests

#### Location
```
src/app/api/transactions/route.ts
tests/api/transactions/transactions.test.ts
```

#### Pattern
```typescript
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/transactions/route';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

describe('POST /api/transactions', () => {
  it('creates a transaction successfully', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: {
        account_id: '123',
        amount: 100,
        merchant_name: 'Test Store',
        category: 'groceries',
        date: '2025-01-01',
      },
    });

    // Mock authenticated user
    (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock database insert
    (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({
        data: {
          id: 'txn-123',
          account_id: '123',
          amount: 100,
          merchant_name: 'Test Store',
        },
        error: null,
      }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.id).toBe('txn-123');
  });

  it('returns 401 for unauthenticated requests', async () => {
    const { req } = createMocks({
      method: 'POST',
    });

    (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Unauthorized' },
    });

    const response = await POST(req as any);

    expect(response.status).toBe(401);
  });

  it('validates input data', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        amount: -100, // Invalid: negative amount
        merchant_name: '', // Invalid: empty string
      },
    });

    (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input data');
  });

  it('handles database errors', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        account_id: '123',
        amount: 100,
        merchant_name: 'Test Store',
        category: 'groceries',
        date: '2025-01-01',
      },
    });

    (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      }),
    });

    const response = await POST(req as any);

    expect(response.status).toBe(500);
  });
});
```

#### What to Test in API Routes
- ✅ Successful requests (2xx responses)
- ✅ Authentication failures (401)
- ✅ Authorization failures (403)
- ✅ Input validation (400)
- ✅ Not found errors (404)
- ✅ Database errors (500)
- ✅ Query parameter parsing
- ✅ Request body parsing
- ✅ Response format

---

## End-to-End Testing

### E2E Test Pattern

#### Location
```
tests/e2e/authentication/sign-in.spec.ts
tests/e2e/transactions/transaction-flow.spec.ts
```

#### Pattern
```typescript
import { test, expect } from '@playwright/test';

test.describe('Transaction Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Sign in
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('user can view and filter transactions', async ({ page }) => {
    // Navigate to transactions page
    await page.click('text=Transactions');
    await expect(page).toHaveURL('/transactions');

    // Wait for transactions to load
    await page.waitForSelector('[data-testid="transaction-list"]');

    // Verify transactions are displayed
    const transactions = page.locator('[data-testid="transaction-item"]');
    await expect(transactions).toHaveCount(10); // Assuming 10 transactions

    // Apply category filter
    await page.click('[data-testid="filter-button"]');
    await page.click('text=Groceries');

    // Verify filtered results
    const filteredTransactions = page.locator('[data-testid="transaction-item"]');
    await expect(filteredTransactions).toHaveCount(3); // Assuming 3 grocery transactions

    // Verify category badge
    const categoryBadges = page.locator('[data-testid="category-badge"]');
    await expect(categoryBadges.first()).toHaveText('Groceries');
  });

  test('user can edit a transaction', async ({ page }) => {
    await page.goto('/transactions');

    // Click on first transaction
    await page.click('[data-testid="transaction-item"]:first-child');

    // Wait for detail modal
    await page.waitForSelector('[data-testid="transaction-detail-modal"]');

    // Click edit button
    await page.click('button:has-text("Edit")');

    // Change merchant name
    const merchantInput = page.locator('[name="merchant_name"]');
    await merchantInput.clear();
    await merchantInput.fill('Updated Merchant');

    // Change category
    await page.selectOption('[name="category"]', 'entertainment');

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify success message
    await expect(page.locator('text=Transaction updated')).toBeVisible();

    // Verify changes reflected in list
    await expect(
      page.locator('[data-testid="transaction-item"]:first-child')
    ).toContainText('Updated Merchant');
  });

  test('user can export transactions to CSV', async ({ page }) => {
    await page.goto('/transactions');

    // Setup download promise before clicking
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.click('button:has-text("Export")');

    // Wait for download
    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/transactions.*\.csv/);

    // Verify file content (optional)
    const path = await download.path();
    const fs = require('fs');
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain('Date,Merchant,Amount,Category');
  });
});
```

#### What to Test in E2E
- ✅ Critical user journeys (sign in → view data → perform action)
- ✅ Multi-page flows
- ✅ Form submissions
- ✅ File uploads/downloads
- ✅ Navigation
- ✅ Error handling (user-facing errors)
- ❌ Every possible user interaction (too slow)
- ❌ Input validation details (covered by unit tests)
- ❌ Edge cases (covered by integration tests)

### Critical E2E Flows to Cover

1. **Authentication Flow**
   - Sign in with Google OAuth
   - Sign out
   - Session persistence

2. **Onboarding Flow**
   - Connect first bank account
   - View dashboard with imported data
   - Create household

3. **Transaction Management**
   - View transaction list
   - Filter/search transactions
   - Edit transaction
   - Export to CSV

4. **Account Management**
   - Connect additional account
   - Sync account
   - Disconnect account

5. **Household Management**
   - Create household
   - Invite member
   - Accept invitation
   - View household transactions

---

## Test Organization

### Directory Structure
```
tests/
├── api/                        # API integration tests
│   ├── accounts/
│   │   └── accounts.test.ts
│   ├── auth/
│   │   └── callback.test.ts
│   ├── households.test.ts
│   ├── transactions/
│   │   └── transactions.test.ts
│   └── user/
│       └── preferences.test.ts
├── components/                 # Component unit tests
│   ├── accounts/
│   │   └── AccountConnectionCard.test.tsx
│   ├── auth/
│   │   ├── authentication-status.test.tsx
│   │   └── google-sign-in-button.test.tsx
│   ├── dashboard/
│   │   ├── AccountManagementSection.test.tsx
│   │   ├── NetWorthSummaryCard.test.tsx
│   │   └── WelcomeCard.test.tsx
│   └── profile/
│       ├── UserPreferences.test.tsx
│       └── UserProfile.test.tsx
├── e2e/                        # End-to-end tests
│   ├── authentication/
│   │   └── sign-in.spec.ts
│   ├── onboarding/
│   │   └── account-connection.spec.ts
│   └── transactions/
│       └── transaction-flow.spec.ts
├── lib/                        # Utility tests
│   ├── data-encryption-service.test.ts
│   └── utils.test.ts
└── services/                   # Service tests
    ├── data-export-service.test.ts
    ├── data-validation-service.test.ts
    └── transaction-categorization-service.test.ts
```

---

## Mocking Strategies

### Mocking Supabase
```typescript
// jest.setup.js or individual test file
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
    auth: {
      getUser: jest.fn(),
    },
  },
}));
```

### Mocking Next.js Router
```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));
```

### Mocking Environment Variables
```typescript
// In jest.setup.js
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
```

---

## Test Coverage Targets

### Coverage Metrics
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Target Coverage by Layer
- **Components**: 80% coverage
- **Services**: 90% coverage
- **Utilities**: 95% coverage
- **API Routes**: 85% coverage
- **Hooks**: 80% coverage

---

## Continuous Integration

### Test Execution in CI
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  pull_request:
  push:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test -- --coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## Test Data Management

### Test Fixtures
```typescript
// tests/fixtures/transactions.ts
export const mockTransaction = {
  id: 'txn-123',
  account_id: 'acc-456',
  amount: 100,
  merchant_name: 'Test Store',
  category: 'groceries',
  date: '2025-01-01',
  is_shared_expense: false,
  manual_override: false,
  created_at: '2025-01-01T00:00:00Z',
};

export const mockTransactions = [
  mockTransaction,
  {
    ...mockTransaction,
    id: 'txn-124',
    amount: 50,
    merchant_name: 'Coffee Shop',
    category: 'dining',
  },
];
```

### Database Seeding for E2E
```typescript
// tests/e2e/setup/seed.ts
import { supabaseAdmin } from '@/lib/supabase';

export async function seedTestData() {
  // Create test user
  const { data: user } = await supabaseAdmin.auth.admin.createUser({
    email: 'test@example.com',
    password: 'password123',
    email_confirm: true,
  });

  // Create test account
  await supabaseAdmin.from('financial_accounts').insert({
    id: 'test-account-123',
    user_id: user.user.id,
    account_name: 'Test Account',
    current_balance: 1000,
  });

  // Create test transactions
  await supabaseAdmin.from('transactions').insert([
    {
      account_id: 'test-account-123',
      amount: 100,
      merchant_name: 'Test Store',
      category: 'groceries',
      date: '2025-01-01',
    },
  ]);
}
```

---

## Performance Testing

### Response Time Benchmarks
```typescript
describe('API Performance', () => {
  it('responds within 500ms for transaction list', async () => {
    const start = Date.now();

    const response = await fetch('/api/transactions?limit=50');

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
    expect(response.ok).toBe(true);
  });
});
```

---

## Accessibility Testing

### Basic A11y Checks in Component Tests
```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('TransactionList Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <TransactionList transactions={mockTransactions} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA labels', () => {
    render(<TransactionList transactions={mockTransactions} />);

    expect(screen.getByRole('list')).toHaveAttribute(
      'aria-label',
      'Transaction list'
    );
  });
});
```

---

## Test Execution Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm run test -- transaction-service.test.ts

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode (see browser)
npm run test:e2e -- --headed

# Type check
npm run type-check

# Lint
npm run lint

# Full quality check
npm run check
```

---

## Best Practices Summary

### DO
- ✅ Write tests before fixing bugs (TDD for bug fixes)
- ✅ Test user behavior, not implementation
- ✅ Use data-testid for elements that need reliable selection
- ✅ Mock external dependencies (APIs, databases)
- ✅ Keep tests isolated and independent
- ✅ Use descriptive test names (it should...)
- ✅ Test edge cases and error conditions
- ✅ Run tests locally before pushing

### DON'T
- ❌ Test implementation details
- ❌ Write tests that depend on test execution order
- ❌ Mock everything (test real code when possible)
- ❌ Skip tests or use .skip without good reason
- ❌ Write tests that take more than 5 seconds
- ❌ Use snapshots as primary testing method
- ❌ Ignore failing tests
- ❌ Test third-party library functionality

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| v4.1 | 2025-10-07 | Comprehensive update based on actual codebase and test structure | Winston (Architect) |
| v4.0 | 2025-09-23 | Initial version | Product Team |
