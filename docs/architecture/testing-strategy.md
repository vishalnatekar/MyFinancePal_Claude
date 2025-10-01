# Testing Strategy

## Testing Pyramid

```
         E2E Tests (Few)
        /               \
    Integration Tests (Some)
   /                         \
Frontend Unit Tests    Backend Unit Tests
      (Many)                (Many)
```

## Test Organization

**Frontend Tests:**
```
tests/
├── components/              # Component unit tests
│   ├── dashboard/
│   │   ├── net-worth-card.test.tsx
│   │   ├── account-list.test.tsx
│   │   └── recent-transactions.test.tsx
│   ├── household/
│   │   ├── household-card.test.tsx
│   │   ├── member-list.test.tsx
│   │   └── expense-rules-table.test.tsx
│   └── forms/
│       ├── create-household-form.test.tsx
│       └── expense-rule-form.test.tsx
├── hooks/                   # Custom hook tests
│   ├── use-auth.test.ts
│   ├── use-households.test.ts
│   └── use-accounts.test.ts
└── stores/                  # State management tests
    ├── auth-store.test.ts
    ├── household-store.test.ts
    └── account-store.test.ts
```

**Backend Tests:**
```
tests/
├── api/                     # API endpoint tests
│   ├── auth/
│   │   └── callback.test.ts
│   ├── accounts/
│   │   ├── accounts.test.ts
│   │   └── sharing.test.ts
│   ├── households/
│   │   ├── households.test.ts
│   │   ├── invite.test.ts
│   │   └── rules.test.ts
│   └── transactions/
│       ├── transactions.test.ts
│       └── categorize.test.ts
├── services/                # Service layer tests
│   ├── truelayer-service.test.ts
│   ├── household-service.test.ts
│   └── account-service.test.ts
└── lib/                     # Utility tests
    ├── validations.test.ts
    ├── formatters.test.ts
    └── auth-helpers.test.ts
```

**E2E Tests:**
```
tests/e2e/
├── auth/
│   ├── login.spec.ts        # Google OAuth flow
│   └── logout.spec.ts       # Session cleanup
├── onboarding/
│   ├── account-connection.spec.ts # TrueLayer integration
│   └── household-creation.spec.ts # First household setup
├── core-workflows/
│   ├── expense-sharing.spec.ts    # End-to-end expense flow
│   ├── settlement-process.spec.ts # Monthly settlement
│   └── privacy-controls.spec.ts   # Account sharing
└── critical-paths/
    ├── dashboard-loading.spec.ts  # Performance testing
    └── real-time-updates.spec.ts  # Supabase subscriptions
```
