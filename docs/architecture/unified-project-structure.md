# Unified Project Structure

Here's the complete Next.js project structure optimized for AI agent development:

```plaintext
myfinancepal/
├── .env.local.example          # Environment variables template
├── .env.local                  # Local environment (gitignored)
├── .gitignore                  # Git ignore patterns
├── .eslintrc.json             # ESLint configuration
├── .prettier.config.js        # Code formatting rules
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies and scripts
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── README.md                  # Project documentation
├── components.json            # shadcn/ui configuration
│
├── public/                    # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
│       ├── landing/           # Landing page assets
│       └── dashboard/         # Dashboard icons
│
├── src/                       # Source code
│   ├── app/                   # Next.js 14 App Router
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   ├── loading.tsx        # Global loading UI
│   │   ├── error.tsx          # Global error UI
│   │   │
│   │   ├── (auth)/            # Authentication group
│   │   │   ├── layout.tsx     # Auth layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx   # Login page
│   │   │   └── callback/
│   │   │       └── page.tsx   # OAuth callback
│   │   │
│   │   ├── (dashboard)/       # Protected dashboard group
│   │   │   ├── layout.tsx     # Dashboard layout with sidebar
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx   # Individual dashboard
│   │   │   │   └── loading.tsx # Dashboard loading
│   │   │   │
│   │   │   ├── accounts/      # Account management
│   │   │   │   ├── page.tsx   # Account list
│   │   │   │   ├── connect/
│   │   │   │   │   └── page.tsx # TrueLayer connection
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Account details
│   │   │   │
│   │   │   ├── household/     # Household management
│   │   │   │   ├── page.tsx   # Household list
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx # Create household
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx # Household dashboard
│   │   │   │       ├── members/
│   │   │   │       │   └── page.tsx # Member management
│   │   │   │       ├── rules/
│   │   │   │       │   └── page.tsx # Splitting rules
│   │   │   │       └── settlements/
│   │   │   │           └── page.tsx # Settlement center
│   │   │   │
│   │   │   └── settings/      # User settings
│   │   │       ├── page.tsx   # General settings
│   │   │       ├── profile/
│   │   │       │   └── page.tsx # Profile management
│   │   │       └── privacy/
│   │   │           └── page.tsx # Privacy controls
│   │   │
│   │   └── api/               # API routes (backend)
│   │       ├── auth/
│   │       │   └── callback/
│   │       │       └── route.ts # OAuth callback handler
│   │       ├── user/
│   │       │   └── profile/
│   │       │       └── route.ts # User profile API
│   │       ├── accounts/
│   │       │   ├── route.ts   # GET/POST accounts
│   │       │   ├── connect/
│   │       │   │   └── route.ts # TrueLayer connection
│   │       │   └── [id]/
│   │       │       ├── route.ts # Account details
│   │       │       └── sharing/
│   │       │           └── route.ts # Sharing settings
│   │       ├── households/
│   │       │   ├── route.ts   # GET/POST households
│   │       │   └── [id]/
│   │       │       ├── route.ts # Household details
│   │       │       ├── invite/
│   │       │       │   └── route.ts # Member invitations
│   │       │       ├── members/
│   │       │       │   └── route.ts # Member management
│   │       │       └── rules/
│   │       │           └── route.ts # Splitting rules
│   │       ├── transactions/
│   │       │   ├── route.ts   # GET transactions
│   │       │   ├── sync/
│   │       │   │   └── route.ts # Trigger sync
│   │       │   └── [id]/
│   │       │       └── categorize/
│   │       │           └── route.ts # Override categorization
│   │       └── dashboard/
│   │           ├── individual/
│   │           │   └── route.ts # Personal dashboard
│   │           └── household/
│   │               └── [id]/
│   │                   └── route.ts # Household dashboard
│   │
│   ├── components/            # Reusable React components
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── layout/           # Layout components
│   │   ├── auth/             # Authentication components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── accounts/         # Account components
│   │   ├── household/        # Household components
│   │   ├── transactions/     # Transaction components
│   │   ├── forms/            # Form components
│   │   └── charts/           # Data visualization
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── use-auth.ts       # Authentication hook
│   │   ├── use-households.ts # Household data hook
│   │   ├── use-accounts.ts   # Account data hook
│   │   ├── use-transactions.ts # Transaction data hook
│   │   └── use-realtime.ts   # Supabase subscriptions
│   │
│   ├── stores/               # Zustand state management
│   │   ├── auth-store.ts     # Authentication state
│   │   ├── household-store.ts # Household state
│   │   ├── account-store.ts  # Account state
│   │   ├── transaction-store.ts # Transaction state
│   │   └── ui-store.ts       # UI state (sidebar, modals)
│   │
│   ├── services/             # API client services
│   │   ├── api-client.ts     # Base API client
│   │   ├── auth-service.ts   # Authentication service
│   │   ├── account-service.ts # Account management
│   │   ├── household-service.ts # Household management
│   │   ├── transaction-service.ts # Transaction management
│   │   └── truelayer-service.ts # TrueLayer integration
│   │
│   ├── lib/                  # Utilities and configurations
│   │   ├── supabase.ts       # Supabase client configuration
│   │   ├── utils.ts          # General utilities
│   │   ├── validations.ts    # Zod schemas
│   │   ├── constants.ts      # App constants
│   │   ├── formatters.ts     # Currency/date formatters
│   │   └── auth-helpers.ts   # Auth utility functions
│   │
│   ├── types/                # TypeScript type definitions
│   │   ├── database.ts       # Supabase generated types
│   │   ├── api.ts           # API request/response types
│   │   ├── auth.ts          # Authentication types
│   │   ├── household.ts     # Household-related types
│   │   ├── account.ts       # Account-related types
│   │   ├── transaction.ts   # Transaction-related types
│   │   └── truelayer.ts      # TrueLayer API types
│   │
│   └── styles/               # Styling files
│       ├── globals.css       # Global CSS
│       └── components.css    # Component-specific styles
│
├── database/                 # Database schema and migrations
│   ├── schema.sql           # Complete database schema
│   ├── migrations/          # Schema migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_settlements.sql
│   │   └── ... (future migrations)
│   └── seed.sql             # Development seed data
│
├── docs/                    # Documentation
│   ├── prd.md              # Product Requirements Document
│   ├── architecture.md     # This architecture document
│   ├── api-docs.md         # API documentation
│   └── deployment.md       # Deployment guide
│
└── tests/                  # Test files
    ├── __mocks__/          # Test mocks
    ├── components/         # Component tests
    ├── api/               # API endpoint tests
    ├── services/          # Service layer tests
    └── e2e/               # End-to-end tests
```
