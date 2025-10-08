# Source Tree Architecture

> **Document Version:** v4.1
> **Last Updated:** 2025-10-07
> **Status:** Active

## Overview

This document provides a comprehensive map of the MyFinancePal codebase structure. Understanding this structure is critical for AI agents and developers to locate files and maintain consistency.

---

## Project Root Structure

```
MyFinancePal_Claude/
├── .ai/                        # AI agent working files
├── .bmad-core/                 # BMAD agent system configuration
├── .github/                    # GitHub Actions and workflows
├── .next/                      # Next.js build output (gitignored)
├── database/                   # Database migrations and schema
│   └── migrations/             # SQL migration files
├── docs/                       # Project documentation
│   ├── architecture/           # Architecture documents
│   ├── prd/                    # Product requirements (sharded)
│   ├── qa/                     # QA reports and gates
│   ├── standards/              # Coding and testing standards
│   └── stories/                # User story documents
├── node_modules/               # npm dependencies (gitignored)
├── public/                     # Static assets
├── src/                        # Application source code
├── tests/                      # Test files (mirrors src structure)
├── .env.local                  # Local environment variables (gitignored)
├── .gitignore                  # Git ignore rules
├── biome.json                  # Biome linter/formatter config
├── jest.config.js              # Jest test configuration
├── jest.setup.js               # Jest global setup
├── next.config.js              # Next.js configuration
├── package.json                # npm package manifest
├── playwright.config.ts        # Playwright E2E config
├── postcss.config.js           # PostCSS configuration
├── README.md                   # Project readme
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

---

## Source Directory (`src/`)

### High-Level Structure

```
src/
├── app/                        # Next.js 14 App Router
│   ├── (auth)/                 # Auth route group
│   ├── (dashboard)/            # Dashboard route group (authenticated)
│   ├── api/                    # API routes (serverless functions)
│   ├── auth/                   # Auth callback pages
│   ├── callback/               # OAuth callback pages
│   ├── debug/                  # Debug utilities
│   └── layout.tsx              # Root layout
├── components/                 # React components
│   ├── accounts/               # Account management components
│   ├── auth/                   # Authentication components
│   ├── dashboard/              # Dashboard components
│   ├── household/              # Household management components
│   ├── layout/                 # Layout components (Header, Sidebar)
│   ├── profile/                # User profile components
│   ├── providers/              # Context providers
│   ├── transactions/           # Transaction components
│   └── ui/                     # shadcn/ui components
├── hooks/                      # Custom React hooks
├── lib/                        # Utility libraries
├── services/                   # API client services
├── stores/                     # Zustand state stores
├── styles/                     # Global CSS styles
├── types/                      # TypeScript type definitions
└── middleware.ts               # Next.js middleware (auth, routing)
```

---

## Detailed Directory Breakdown

### App Directory (`src/app/`)

The app directory uses Next.js 14 App Router with route groups and file-based routing.

#### Route Groups

```
src/app/
├── (auth)/                     # Unauthenticated routes
│   ├── layout.tsx              # Auth layout (no sidebar)
│   └── login/
│       └── page.tsx            # Login page
│
├── (dashboard)/                # Authenticated routes
│   ├── layout.tsx              # Dashboard layout (with sidebar)
│   ├── page.tsx                # Dashboard home (/dashboard)
│   ├── accounts/
│   │   └── page.tsx            # Accounts page
│   ├── accounts-test/
│   │   └── page.tsx            # Account testing page
│   ├── finances/
│   │   └── page.tsx            # Finances overview
│   ├── household/
│   │   ├── page.tsx            # Household list
│   │   ├── create/
│   │   │   └── page.tsx        # Create household
│   │   └── [id]/
│   │       └── page.tsx        # Household detail
│   ├── profile/
│   │   └── page.tsx            # User profile
│   ├── reports/
│   │   └── page.tsx            # Financial reports
│   ├── settings/
│   │   └── page.tsx            # User settings
│   └── transactions/
│       └── page.tsx            # Transaction history
│
├── auth/                       # Auth callback pages
│   ├── callback/
│   │   └── page.tsx            # Supabase auth callback
│   └── error/
│       └── page.tsx            # Auth error page
│
├── callback/                   # OAuth callbacks
│   └── page.tsx                # TrueLayer OAuth callback
│
├── debug/                      # Debug utilities (dev only)
│   ├── config/
│   │   └── page.tsx            # Config viewer
│   └── truelayer/
│       └── page.tsx            # TrueLayer debug page
│
├── layout.tsx                  # Root layout
└── page.tsx                    # Root page (redirects to /dashboard)
```

#### API Routes (`src/app/api/`)

API routes follow REST conventions with nested dynamic routes.

```
src/app/api/
├── accounts/
│   ├── route.ts                        # GET /api/accounts (list), POST /api/accounts (create manual)
│   ├── [id]/
│   │   ├── route.ts                    # GET /api/accounts/[id] (detail), PUT /api/accounts/[id] (update)
│   │   ├── balance-history/
│   │   │   └── route.ts                # GET /api/accounts/[id]/balance-history
│   │   ├── statistics/
│   │   │   └── route.ts                # GET /api/accounts/[id]/statistics
│   │   └── sync/
│   │       └── route.ts                # POST /api/accounts/[id]/sync
│   ├── callback/
│   │   └── route.ts                    # GET /api/accounts/callback (OAuth callback)
│   ├── connect/
│   │   └── route.ts                    # POST /api/accounts/connect (initiate OAuth)
│   ├── providers/
│   │   └── route.ts                    # GET /api/accounts/providers (list banks)
│   ├── record-balance-snapshot/
│   │   └── route.ts                    # POST /api/accounts/record-balance-snapshot
│   ├── sync/
│   │   └── route.ts                    # POST /api/accounts/sync (sync single account)
│   └── sync-all/
│       └── route.ts                    # POST /api/accounts/sync-all
│
├── auth/
│   ├── callback/
│   │   └── route.ts                    # GET /api/auth/callback (Supabase callback)
│   ├── refresh/
│   │   └── route.ts                    # POST /api/auth/refresh (refresh token)
│   ├── set-session/
│   │   └── route.ts                    # POST /api/auth/set-session
│   └── signout/
│       └── route.ts                    # POST /api/auth/signout
│
├── cron/
│   ├── cleanup-oauth-states/
│   │   └── route.ts                    # GET /api/cron/cleanup-oauth-states (cron job)
│   └── sync-accounts/
│       └── route.ts                    # GET /api/cron/sync-accounts (cron job)
│
├── dashboard/
│   ├── accounts-status/
│   │   └── route.ts                    # GET /api/dashboard/accounts-status
│   ├── export/
│   │   └── route.ts                    # GET /api/dashboard/export (CSV export)
│   ├── net-worth/
│   │   ├── route.ts                    # GET /api/dashboard/net-worth (current)
│   │   └── history/
│   │       └── route.ts                # GET /api/dashboard/net-worth/history
│
├── debug/
│   ├── accounts/
│   │   └── route.ts                    # GET /api/debug/accounts
│   ├── auth/
│   │   └── route.ts                    # GET /api/debug/auth
│   ├── auth-config/
│   │   └── route.ts                    # GET /api/debug/auth-config
│   ├── clear-auth/
│   │   └── route.ts                    # POST /api/debug/clear-auth
│   ├── config/
│   │   └── route.ts                    # GET /api/debug/config
│   ├── oauth-flow/
│   │   └── route.ts                    # GET /api/debug/oauth-flow
│   ├── session-state/
│   │   └── route.ts                    # GET /api/debug/session-state
│   ├── supabase/
│   │   └── route.ts                    # GET /api/debug/supabase
│   └── test-session/
│       └── route.ts                    # GET /api/debug/test-session
│
├── households/
│   ├── route.ts                        # GET /api/households (list), POST /api/households (create)
│   └── [id]/
│       └── route.ts                    # GET /api/households/[id] (detail), PUT /api/households/[id] (update)
│
├── test-auth/
│   └── route.ts                        # GET /api/test-auth (auth testing)
│
├── transactions/
│   ├── route.ts                        # GET /api/transactions (list with filters)
│   ├── [id]/
│   │   └── route.ts                    # GET /api/transactions/[id], PUT /api/transactions/[id]
│   └── export/
│       └── route.ts                    # GET /api/transactions/export (CSV)
│
├── truelayer/
│   └── providers/
│       └── route.ts                    # GET /api/truelayer/providers
│
└── user/
    └── preferences/
        └── route.ts                    # GET /api/user/preferences, PUT /api/user/preferences
```

---

### Components Directory (`src/components/`)

Organized by feature domain with shared UI components.

```
src/components/
├── accounts/
│   ├── AccountConnectionCard.tsx       # Display account connection status
│   ├── BalanceHistoryChart.tsx         # Chart for balance over time
│   ├── ConnectAccountButton.tsx        # Initiate account connection
│   ├── InstitutionSelector.tsx         # Bank selection UI
│   ├── ManualAccountForm.tsx           # Manual account entry form
│   └── SyncProgressIndicator.tsx       # Sync status indicator
│
├── auth/
│   ├── AuthenticationStatus.tsx        # Auth status display
│   ├── AuthErrorBoundary.tsx           # Auth error boundary
│   └── GoogleSignInButton.tsx          # Google OAuth sign-in button
│
├── dashboard/
│   ├── AccountBreakdownCard.tsx        # Account breakdown visualization
│   ├── AccountManagementSection.tsx    # Account management section
│   ├── AccountSyncStatus.tsx           # Account sync status
│   ├── EmptyState.tsx                  # Empty state placeholder
│   ├── NetWorthSummaryCard.tsx         # Net worth summary card
│   └── WelcomeCard.tsx                 # Welcome message card
│
├── household/
│   └── (household components TBD)      # Story 3.1 components
│
├── layout/
│   ├── Header.tsx                      # Top navigation header
│   └── (other layout components)       # Additional layout components
│
├── profile/
│   ├── UserPreferences.tsx             # User preferences form
│   └── UserProfile.tsx                 # User profile display/edit
│
├── providers/
│   └── QueryProvider.tsx               # React Query provider wrapper
│
├── transactions/
│   ├── TransactionDetailModal.tsx      # Transaction detail modal
│   ├── TransactionFilterBar.tsx        # Active filters display
│   ├── TransactionFiltersDialog.tsx    # Advanced filters dialog
│   ├── TransactionList.tsx             # Transaction list with infinite scroll
│   ├── TransactionListItem.tsx         # Individual transaction item
│   └── TransactionSearchBar.tsx        # Search and filter bar
│
└── ui/                                 # shadcn/ui components
    ├── alert-dialog.tsx
    ├── alert.tsx
    ├── AuthGuard.tsx                   # Authentication guard wrapper
    ├── avatar.tsx
    ├── badge.tsx
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── dropdown-menu.tsx
    ├── form.tsx
    ├── input.tsx
    ├── label.tsx
    ├── LoadingSpinner.tsx              # Loading spinner component
    ├── progress.tsx
    ├── select.tsx
    ├── separator.tsx
    ├── sheet.tsx
    ├── skeleton.tsx
    ├── switch.tsx
    ├── tabs.tsx
    └── textarea.tsx
```

---

### Hooks Directory (`src/hooks/`)

Custom React hooks for data fetching and state management.

```
src/hooks/
├── use-account-management.ts           # Account management operations
├── use-accounts.ts                     # Account data fetching
├── use-auth.ts                         # Authentication state and actions
├── use-dashboard-data.ts               # Dashboard data aggregation
├── use-households.ts                   # Household data fetching
├── use-net-worth.ts                    # Net worth calculations
├── use-transaction-filters.ts          # Transaction filter state
├── use-transactions.ts                 # Transaction data fetching (infinite query)
└── use-user-preferences.ts             # User preferences management
```

---

### Lib Directory (`src/lib/`)

Utility libraries and helper functions.

```
src/lib/
├── auth-helpers.ts                     # Authentication helper functions
├── auth-middleware.ts                  # API route auth middleware (withAuth)
├── auth.ts                             # Core auth utilities
├── config.ts                           # Environment config object
├── crypto.ts                           # Cryptography utilities
├── currency-utils.ts                   # Currency formatting utilities
├── data-encryption-service.ts          # Data encryption service
├── financial-validators.ts             # Financial data validators
├── oauth-state.ts                      # OAuth state management
├── supabase.ts                         # Supabase client initialization
├── token-refresh-utils.ts              # Token refresh utilities
└── utils.ts                            # General utilities (cn, etc.)
```

---

### Services Directory (`src/services/`)

API client services for backend communication.

```
src/services/
├── account-categorization-service.ts   # Account categorization logic
├── account-sync-service.ts             # Account syncing service
├── auth-service.ts                     # Authentication service
├── currency-service.ts                 # Currency conversion service
├── data-export-service.ts              # Data export (CSV) service
├── data-validation-service.ts          # Data validation service
├── duplicate-detection-service.ts      # Duplicate transaction detection
├── historical-data-service.ts          # Historical data management
├── household-service.ts                # Household API client
├── net-worth-calculation-service.ts    # Net worth calculation
├── net-worth-history-service.ts        # Net worth history tracking
├── sync-scheduler-service.ts           # Sync scheduling service
├── transaction-based-history-service.ts # Transaction-based history
├── transaction-categorization-service.ts # Transaction categorization
├── transaction-export-service.ts       # Transaction CSV export
├── transaction-service.ts              # Transaction API client
├── truelayer-data-processor.ts         # TrueLayer data processing
├── truelayer-service.ts                # TrueLayer API client
└── user-service.ts                     # User API client
```

---

### Stores Directory (`src/stores/`)

Zustand state management stores.

```
src/stores/
├── auth-store.ts                       # Authentication state
├── household-store.ts                  # Household state
└── ui-store.ts                         # UI state (modals, toasts)
```

---

### Types Directory (`src/types/`)

TypeScript type definitions shared across frontend and backend.

```
src/types/
├── account.ts                          # Account types
├── dashboard.ts                        # Dashboard types
├── database.ts                         # Supabase database types (generated)
├── household.ts                        # Household types
├── transaction.ts                      # Transaction types
└── truelayer.ts                        # TrueLayer API types
```

---

### Styles Directory (`src/styles/`)

Global CSS styles.

```
src/styles/
└── globals.css                         # Global styles (Tailwind imports)
```

---

## Test Directory (`tests/`)

Test files mirror the `src/` structure.

```
tests/
├── api/                                # API route integration tests
│   ├── accounts/
│   │   └── accounts.test.ts
│   ├── auth/
│   │   └── callback.test.ts
│   ├── households.test.ts
│   ├── transactions/
│   │   └── transactions.test.ts
│   └── user/
│       └── preferences.test.ts
│
├── components/                         # Component unit tests
│   ├── accounts/
│   │   └── AccountConnectionCard.test.tsx
│   ├── auth/
│   │   ├── authentication-status.test.tsx
│   │   └── google-sign-in-button.test.tsx
│   ├── dashboard/
│   │   ├── AccountManagementSection.test.tsx
│   │   ├── AccountSyncStatus.test.tsx
│   │   ├── NetWorthSummaryCard.test.tsx
│   │   └── WelcomeCard.test.tsx
│   ├── page.test.tsx
│   └── profile/
│       ├── UserPreferences.test.tsx
│       └── UserProfile.test.tsx
│
├── e2e/                                # End-to-end tests (Playwright)
│   ├── authentication/
│   ├── onboarding/
│   └── transactions/
│
├── lib/                                # Library tests
│   ├── data-encryption-service.test.ts
│   └── utils.test.ts
│
└── services/                           # Service tests
    ├── data-export-service.test.ts
    ├── data-validation-service.test.ts
    ├── transaction-categorization-service.test.ts
    └── transaction-export-service.test.ts
```

---

## Database Directory (`database/`)

SQL migrations and schema files.

```
database/
└── migrations/
    ├── 001_initial_schema.sql              # Core tables (users, accounts, etc.)
    ├── 002_add_user_preferences.sql        # User preferences table
    ├── 002_rls_policies.sql                # Row Level Security policies
    ├── 003_data_processing_tables.sql      # Sync and processing tables
    └── 004_household_invitations.sql       # Household invitations table
```

---

## Documentation Directory (`docs/`)

Project documentation organized by type.

```
docs/
├── architecture/                       # Architecture documents
│   ├── api-specification.md
│   ├── backend-architecture.md
│   ├── coding-standards.md             # ← CREATED/UPDATED
│   ├── database-schema.md
│   ├── data-models.md
│   ├── frontend-architecture.md
│   ├── source-tree.md                  # ← THIS DOCUMENT
│   ├── tech-stack.md
│   └── testing-strategy.md             # ← CREATED/UPDATED
│
├── prd/                                # Product requirements (sharded)
│   ├── epic-1-authentication.md
│   ├── epic-2-financial-dashboard.md
│   ├── epic-3-household-management.md
│   └── (additional epics)
│
├── qa/                                 # QA reports and gates
│   ├── assessments/
│   └── gates/
│       └── 2.4-transaction-history-categorization.yml
│
├── standards/                          # Standards documents
│   ├── coding-standards.md             # ← CREATED/UPDATED
│   └── testing-strategy.md             # ← CREATED/UPDATED
│
└── stories/                            # User stories
    ├── 2.4.transaction-history-categorization.md
    └── 3.1.household-creation-invitation-system.md
```

---

## Configuration Files (Root)

### Next.js & Build Configuration

- **`next.config.js`** - Next.js configuration, environment variables, bundle analyzer
- **`tsconfig.json`** - TypeScript compiler configuration
- **`tailwind.config.ts`** - Tailwind CSS configuration
- **`postcss.config.js`** - PostCSS configuration

### Testing Configuration

- **`jest.config.js`** - Jest test runner configuration
- **`jest.setup.js`** - Global test setup (mocks, extensions)
- **`playwright.config.ts`** - Playwright E2E test configuration

### Linting & Formatting

- **`biome.json`** - Biome linter and formatter configuration (replaces ESLint + Prettier)

### Package Management

- **`package.json`** - npm package manifest with scripts and dependencies
- **`package-lock.json`** - npm lockfile

### Environment

- **`.env.local`** - Local environment variables (gitignored)
- **`.env.example`** - Example environment variables

### Version Control

- **`.gitignore`** - Git ignore rules
- **`.github/`** - GitHub Actions workflows

---

## File Naming Conventions

### Frontend Files
- **Components**: `PascalCase.tsx` (e.g., `TransactionList.tsx`)
- **Hooks**: `use-kebab-case.ts` (e.g., `use-transactions.ts`)
- **Services**: `kebab-case-service.ts` (e.g., `transaction-service.ts`)
- **Utilities**: `kebab-case-utils.ts` (e.g., `currency-utils.ts`)
- **Types**: `kebab-case.ts` (e.g., `transaction.ts`)

### Backend Files
- **API Routes**: `route.ts` (Next.js convention)
- **Middleware**: `middleware.ts`, `auth-middleware.ts`

### Test Files
- **Component Tests**: `ComponentName.test.tsx`
- **Service Tests**: `service-name.test.ts`
- **E2E Tests**: `test-name.spec.ts`

---

## Import Path Aliases

Configured in `tsconfig.json`:

```typescript
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Usage Examples

```typescript
// ✅ CORRECT - Use aliases
import { Transaction } from '@/types/transaction';
import { transactionService } from '@/services/transaction-service';
import { useTransactions } from '@/hooks/use-transactions';
import { Button } from '@/components/ui/button';

// ❌ WRONG - Don't use relative paths
import { Transaction } from '../../../types/transaction';
import { transactionService } from '../../services/transaction-service';
```

---

## Route Groups Explained

### `(auth)` Group
- **Purpose**: Unauthenticated pages
- **Layout**: Minimal layout without sidebar
- **Routes**: `/login`, `/signup` (future)

### `(dashboard)` Group
- **Purpose**: Authenticated pages
- **Layout**: Full dashboard layout with sidebar navigation
- **Routes**: All authenticated pages (`/accounts`, `/transactions`, `/household`, etc.)

### Why Route Groups?
Route groups allow different layouts without affecting the URL structure. For example:
- `src/app/(auth)/login/page.tsx` → URL: `/login` (not `/auth/login`)
- `src/app/(dashboard)/accounts/page.tsx` → URL: `/accounts` (not `/dashboard/accounts`)

---

## Key Architectural Patterns

### 1. Server vs Client Components
```typescript
// Server Component (default)
// Location: src/app/(dashboard)/accounts/page.tsx
export default async function AccountsPage() {
  // Can directly access database
  const accounts = await getAccounts();
  return <AccountsList accounts={accounts} />;
}

// Client Component
// Location: src/components/accounts/AccountsList.tsx
'use client';
export function AccountsList({ accounts }) {
  // Can use hooks, event handlers
  const [selected, setSelected] = useState(null);
  return <div onClick={() => setSelected(accounts[0])}>{/* ... */}</div>;
}
```

### 2. Service Layer Pattern
```typescript
// Service handles API communication
// Location: src/services/transaction-service.ts
export const transactionService = {
  list: async (filters: TransactionFilter) => {
    const response = await fetch('/api/transactions?...');
    return response.json();
  },
};

// Component uses service
// Location: src/components/transactions/TransactionList.tsx
const transactions = await transactionService.list(filters);
```

### 3. Type Sharing
```typescript
// Types defined once
// Location: src/types/transaction.ts
export interface Transaction {
  id: string;
  amount: number;
  merchant_name: string;
}

// Used in frontend
// Location: src/components/transactions/TransactionList.tsx
import { Transaction } from '@/types/transaction';

// Used in backend
// Location: src/app/api/transactions/route.ts
import { Transaction } from '@/types/transaction';
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| v4.1 | 2025-10-07 | Comprehensive source tree based on actual codebase structure | Winston (Architect) |
| v4.0 | 2025-09-23 | Initial version | Product Team |
