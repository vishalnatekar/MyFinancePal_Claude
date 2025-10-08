# Coding Standards

> **Document Version:** v4.1
> **Last Updated:** 2025-10-07
> **Status:** Active

## Overview

This document defines the coding standards for MyFinancePal. All code must follow these standards to ensure consistency, maintainability, and AI agent compatibility.

---

## Critical Fullstack Rules

These rules are **MANDATORY** and violations will fail code review:

### 1. Type Sharing
- **Rule:** Always define types in `src/types/` and import from there
- **Never:** Duplicate type definitions between frontend and backend
- **Example:**
  ```typescript
  // ✅ CORRECT
  import { Transaction } from '@/types/transaction';

  // ❌ WRONG
  interface Transaction { ... } // Don't duplicate in multiple files
  ```

### 2. API Calls
- **Rule:** Never make direct HTTP calls - use the service layer
- **Location:** All API communication goes through `src/services/`
- **Example:**
  ```typescript
  // ✅ CORRECT
  import { transactionService } from '@/services/transaction-service';
  const transactions = await transactionService.list(filters);

  // ❌ WRONG
  const res = await fetch('/api/transactions');
  ```

### 3. Environment Variables
- **Rule:** Access only through config objects in `src/lib/config.ts`
- **Never:** Use `process.env` directly in components or services
- **Example:**
  ```typescript
  // ✅ CORRECT
  import { config } from '@/lib/config';
  const apiUrl = config.truelayer.apiUrl;

  // ❌ WRONG
  const apiUrl = process.env.NEXT_PUBLIC_TRUELAYER_API_URL;
  ```

### 4. Error Handling
- **Rule:** All API routes must use try/catch with proper HTTP status codes
- **Pattern:**
  ```typescript
  export const POST = withAuth(async (request: NextRequest, user: User) => {
    try {
      // Validate input
      const body = await request.json();
      const validatedData = schema.parse(body);

      // Process request
      const result = await processData(validatedData);

      return NextResponse.json({ data: result }, { status: 200 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid input", details: error.errors },
          { status: 400 }
        );
      }

      console.error("API Error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
  ```

### 5. State Updates
- **Rule:** Never mutate state directly - use Zustand actions
- **Pattern:**
  ```typescript
  // ✅ CORRECT
  const updateUser = useAuthStore((state) => state.updateUser);
  updateUser({ name: "John" });

  // ❌ WRONG
  authStore.user.name = "John";
  ```

### 6. Database Access
- **Rule:** Always use Supabase client with RLS policies
- **Never:** Raw SQL queries in API routes
- **Example:**
  ```typescript
  // ✅ CORRECT
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('account_id', accountId);

  // ❌ WRONG
  await supabase.rpc('execute_sql', { query: 'SELECT * FROM ...' });
  ```

### 7. Authentication
- **Rule:** Every protected API route must call authentication helper first
- **Pattern:**
  ```typescript
  import { withAuth } from '@/lib/auth-middleware';

  export const GET = withAuth(async (request: NextRequest, user: User) => {
    // user is automatically validated and available
    // 401 responses handled automatically
  });
  ```

### 8. Input Validation
- **Rule:** Use Zod schemas for all API endpoints and form submissions
- **No unvalidated data allowed**
- **Pattern:**
  ```typescript
  import { z } from 'zod';

  const createTransactionSchema = z.object({
    amount: z.number().min(0),
    merchant_name: z.string().min(1).max(100),
    category: z.enum(['groceries', 'utilities', 'entertainment']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  });

  // In API route
  const validatedData = createTransactionSchema.parse(body);
  ```

### 9. Component Props
- **Rule:** Always define TypeScript interfaces for component props
- **No `any` types allowed**
- **Pattern:**
  ```typescript
  interface UserProfileProps {
    userId: string;
    onUpdate?: (user: User) => void;
    className?: string;
  }

  export function UserProfile({ userId, onUpdate, className }: UserProfileProps) {
    // Component implementation
  }
  ```

### 10. File Naming
- **Rule:** Use kebab-case for files, PascalCase for components, camelCase for functions
- **Pattern:**
  ```
  src/components/transactions/TransactionList.tsx  ✅
  src/services/transaction-service.ts              ✅
  src/hooks/use-transactions.ts                    ✅
  src/lib/currency-utils.ts                        ✅
  ```

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| **Components** | PascalCase | `UserProfile.tsx`, `TransactionList.tsx` |
| **Component Files** | kebab-case | `user-profile.tsx`, `transaction-list.tsx` |
| **Hooks** | camelCase with 'use' | `useAuth.ts`, `useTransactions.ts` |
| **Services** | kebab-case | `transaction-service.ts`, `user-service.ts` |
| **API Routes** | kebab-case | `/api/user-profile`, `/api/households` |
| **Database Tables** | snake_case | `user_profiles`, `financial_accounts` |
| **TypeScript Interfaces** | PascalCase | `interface UserProfile {}` |
| **TypeScript Types** | PascalCase | `type TransactionCategory = ...` |
| **Functions** | camelCase | `getUserProfile()`, `calculateBalance()` |
| **Constants** | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRY_ATTEMPTS` |
| **Variables** | camelCase | `userName`, `accountBalance` |
| **Boolean Variables** | camelCase with is/has/should | `isLoading`, `hasError`, `shouldRetry` |

---

## Code Organization

### File Structure Pattern
```typescript
// 1. External imports (React, Next.js, third-party)
import { useState, useEffect } from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 2. Internal imports - Types first
import type { Transaction } from '@/types/transaction';
import type { Account } from '@/types/account';

// 3. Internal imports - Services/Hooks/Stores
import { transactionService } from '@/services/transaction-service';
import { useAuth } from '@/hooks/use-auth';

// 4. Internal imports - UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 5. Constants and schemas
const MAX_TRANSACTIONS = 50;

const transactionSchema = z.object({
  // schema definition
});

// 6. Component/function implementation
export function TransactionList() {
  // implementation
}
```

### Component Structure Pattern
```typescript
interface TransactionListProps {
  accountId: string;
  onTransactionClick?: (transaction: Transaction) => void;
}

export function TransactionList({ accountId, onTransactionClick }: TransactionListProps) {
  // 1. Hooks (state, context, custom hooks)
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { transactions, refetch } = useTransactions(accountId);

  // 2. Event handlers
  const handleClick = (transaction: Transaction) => {
    onTransactionClick?.(transaction);
  };

  const handleRefresh = async () => {
    await refetch();
  };

  // 3. Side effects
  useEffect(() => {
    // side effect logic
  }, [accountId]);

  // 4. Early returns
  if (!user) return null;
  if (isLoading) return <LoadingSpinner />;

  // 5. Render
  return (
    <div className="transaction-list">
      {transactions.map((transaction) => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          onClick={handleClick}
        />
      ))}
    </div>
  );
}
```

---

## TypeScript Standards

### Strict Type Safety
```typescript
// ✅ CORRECT - Explicit types
interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  // implementation
}

// ❌ WRONG - any types
function fetchData(url: string): Promise<any> {
  // Don't do this
}
```

### Discriminated Unions for State
```typescript
// ✅ CORRECT - Discriminated union
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// Usage provides type safety
if (state.status === 'success') {
  // TypeScript knows state.data exists here
  console.log(state.data);
}
```

### Utility Types
```typescript
// Use built-in utility types
type PartialTransaction = Partial<Transaction>;
type TransactionKeys = keyof Transaction;
type TransactionCategory = Transaction['category'];
type ReadonlyTransaction = Readonly<Transaction>;
```

---

## React Patterns

### Server vs Client Components
```typescript
// Server Component (default in Next.js 14)
// NO 'use client' directive
export default function TransactionsPage() {
  // Can directly access database
  const transactions = await getTransactions();

  return <TransactionList transactions={transactions} />;
}

// Client Component
'use client';

export function TransactionList({ transactions }: Props) {
  // Can use hooks, event handlers, browser APIs
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div onClick={() => setSelected(transactions[0].id)}>
      {/* JSX */}
    </div>
  );
}
```

### Custom Hooks Pattern
```typescript
export function useTransactions(accountId: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await transactionService.list({ accountId });
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { transactions, isLoading, error, refetch };
}
```

---

## API Route Patterns

### Standard API Route Structure
```typescript
import { withAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 1. Define validation schema
const requestSchema = z.object({
  field1: z.string().min(1),
  field2: z.number().positive(),
});

// 2. GET endpoint
export const GET = withAuth(async (request: NextRequest, user: User) => {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url);
    const param = searchParams.get('param');

    // Query database
    const { data, error } = await supabaseAdmin
      .from('table_name')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// 3. POST endpoint
export const POST = withAuth(async (request: NextRequest, user: User) => {
  try {
    // Parse and validate body
    const body = await request.json();
    const validatedData = requestSchema.parse(body);

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from('table_name')
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
```

---

## Testing Standards

### Test File Naming
```
src/components/transactions/TransactionList.tsx
tests/components/transactions/TransactionList.test.tsx

src/services/transaction-service.ts
tests/services/transaction-service.test.ts

src/app/api/transactions/route.ts
tests/api/transactions/transactions.test.ts
```

### Test Structure Pattern
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { TransactionList } from '@/components/transactions/TransactionList';

describe('TransactionList', () => {
  // Setup
  const mockTransactions = [
    { id: '1', amount: 100, merchant_name: 'Test' },
  ];

  // Test cases
  it('renders transaction list', () => {
    render(<TransactionList transactions={mockTransactions} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles empty state', () => {
    render(<TransactionList transactions={[]} />);
    expect(screen.getByText(/no transactions/i)).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(
      <TransactionList
        transactions={mockTransactions}
        onTransactionClick={handleClick}
      />
    );

    const item = screen.getByText('Test');
    item.click();

    await waitFor(() => {
      expect(handleClick).toHaveBeenCalledWith(mockTransactions[0]);
    });
  });
});
```

---

## Performance Best Practices

### 1. Memoization
```typescript
// Use React.memo for expensive components
export const TransactionList = React.memo(function TransactionList({ transactions }: Props) {
  // Component implementation
});

// Use useMemo for expensive calculations
const totalBalance = useMemo(() => {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}, [transactions]);

// Use useCallback for event handlers passed as props
const handleClick = useCallback((id: string) => {
  onTransactionClick(id);
}, [onTransactionClick]);
```

### 2. Code Splitting
```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Disable SSR if not needed
});
```

### 3. Image Optimization
```typescript
import Image from 'next/image';

// Always use Next.js Image component
<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority // For above-the-fold images
/>
```

---

## Security Standards

### 1. Input Sanitization
```typescript
// Always validate and sanitize user input
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
```

### 2. SQL Injection Prevention
```typescript
// ✅ CORRECT - Parameterized queries via Supabase
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('merchant_name', userInput);

// ❌ WRONG - String interpolation
// Don't construct queries with user input
```

### 3. Authentication
```typescript
// Always verify user identity in API routes
export const POST = withAuth(async (request: NextRequest, user: User) => {
  // user is automatically validated
  // Never trust client-side user data
  const userId = user.id; // Use this, not request body
});
```

---

## Documentation Standards

### 1. Component Documentation
```typescript
/**
 * Displays a list of transactions with filtering and sorting capabilities
 *
 * @param accountId - The account ID to fetch transactions for
 * @param onTransactionClick - Optional callback when a transaction is clicked
 * @param className - Additional CSS classes to apply
 *
 * @example
 * ```tsx
 * <TransactionList
 *   accountId="123"
 *   onTransactionClick={(t) => console.log(t)}
 * />
 * ```
 */
export function TransactionList({ accountId, onTransactionClick, className }: TransactionListProps) {
  // Implementation
}
```

### 2. Complex Function Documentation
```typescript
/**
 * Calculates net worth based on account balances and liabilities
 *
 * Includes:
 * - Current balances from all active accounts
 * - Pending transactions
 * - Credit card debts
 *
 * @param accounts - List of financial accounts
 * @param options - Calculation options
 * @returns Net worth calculation result with breakdown
 *
 * @throws {ValidationError} If account data is invalid
 */
export function calculateNetWorth(
  accounts: Account[],
  options: CalculationOptions
): NetWorthResult {
  // Implementation
}
```

---

## Error Messages

### User-Facing Error Messages
```typescript
// ✅ CORRECT - User-friendly
"Unable to connect to your bank. Please try again later."
"Invalid email address. Please check and try again."
"Your session has expired. Please sign in again."

// ❌ WRONG - Technical jargon
"ERR_CONNECTION_TIMEOUT"
"Null pointer exception in auth module"
"Database query failed: syntax error near '...'"
```

### Console Error Messages
```typescript
// ✅ CORRECT - Detailed for debugging
console.error('Failed to fetch transactions:', {
  error: error.message,
  accountId,
  timestamp: new Date().toISOString(),
  stack: error.stack,
});

// ❌ WRONG - Not helpful
console.error('Error');
```

---

## Git Commit Standards

### Commit Message Format
```
<type>: <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic changes)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### Examples
```
feat: add transaction filtering by category

- Implemented category filter dropdown
- Added URL state management for filters
- Updated TransactionList component

Closes #123
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| v4.1 | 2025-10-07 | Comprehensive update based on actual codebase state | Winston (Architect) |
| v4.0 | 2025-09-23 | Initial version | Product Team |
