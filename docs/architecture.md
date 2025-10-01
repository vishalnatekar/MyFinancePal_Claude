# MyFinancePal Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for **MyFinancePal**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template Assessment

Based on your PRD analysis, MyFinancePal appears to be a **greenfield project** with specific technology preferences outlined (React/Next.js frontend, Node.js/Express backend, PostgreSQL database).

**Decision:** Greenfield project with AI-optimized technology stack for maximum development velocity and agent success.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-23 | 1.0 | Initial architecture creation continuing from collapsed session | Winston (Architect) |

## High Level Architecture

### Technical Summary

MyFinancePal employs a **modern monorepo fullstack architecture** with Next.js React frontend and Node.js Express backend, deployed on **Vercel + Supabase** for rapid development and built-in compliance features. The system integrates **MoneyHub APIs** for financial data aggregation while maintaining strict **privacy-first data isolation** between individual and household views. The architecture supports **real-time expense splitting** through event-driven settlement calculations and leverages **PostgreSQL with Redis caching** for transactional integrity and performance. This design achieves the PRD's core goals of automated expense sharing, comprehensive net worth tracking, and regulatory compliance while maintaining scalability for 10,000+ UK households.

### Platform and Infrastructure Choice

**Platform:** Vercel (hosting) + Supabase (database/auth)
**Key Services:** Next.js 14 (full-stack), Supabase (all backend needs), MoneyHub (financial data)
**Deployment Host and Regions:** Vercel Edge Network with EU-West (London) for data residency

**Rationale:** Vercel + Supabase balances speed-to-market with financial-grade security. Supabase's built-in RLS eliminates custom privacy logic development. This stack maximizes AI agent success through well-documented, mainstream technologies.

### Repository Structure

**Structure:** Single Next.js App (not even a monorepo initially)
**Monorepo Tool:** None for V1 - Keep it simple
**Package Organization:** Standard Next.js structure with clear folders

### High Level Architecture Diagram

```mermaid
graph TB
    Users[Users] --> Vercel[Vercel + Next.js App]
    Vercel --> Supabase[(Supabase)]
    Vercel --> MoneyHub[MoneyHub API]

    subgraph "Single Next.js App"
        Pages[Pages + API Routes]
        Components[React Components]
        Database[Supabase Client]
    end

    Vercel --> Pages
    Pages --> Components
    Pages --> Database
    Database --> Supabase

    style Vercel fill:#00C7BE
    style Supabase fill:#3FCF8E
    style MoneyHub fill:#00D924
```

### Architectural Patterns

- **Next.js Full-Stack:** Frontend + API routes in one app - _Rationale:_ AI agents excel at this pattern, zero deployment complexity
- **Supabase Direct Client:** Database access through official client - _Rationale:_ Well-documented patterns, built-in security
- **File-Based Routing:** Next.js conventions - _Rationale:_ Zero configuration, AI agents know these patterns perfectly
- **Component Co-location:** Components near pages that use them - _Rationale:_ Easier for AI agents to understand relationships
- **Progressive Enhancement:** Start simple, add complexity later - _Rationale:_ V1 focus on core functionality only

## Tech Stack

This is the **DEFINITIVE** technology selection for MyFinancePal. All AI agents must use these exact versions to ensure compatibility and success.

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| **Frontend Language** | TypeScript | 5.0+ | Type-safe development | AI agents excel with TypeScript - prevents runtime errors |
| **Frontend Framework** | Next.js | 15.0+ | Full-stack React framework | Most AI-documented pattern, API routes included |
| **React Library** | React | 19.0+ | UI component library | Latest React with concurrent features, Server Components |
| **UI Component Library** | shadcn/ui | Latest | Pre-built accessible components | AI agents can copy-paste patterns, Tailwind-based |
| **State Management** | Zustand | 4.0+ | Client state management | Simpler than Redux, AI agents handle easily |
| **Backend Language** | TypeScript | 5.0+ | API routes and server logic | Same language as frontend - AI consistency |
| **Backend Framework** | Next.js API Routes | 15.0+ | Serverless API endpoints | Built-in, zero config, AI-friendly |
| **API Style** | REST | - | HTTP endpoints | Most documented for AI agents |
| **Database** | PostgreSQL | 15+ | Primary data store | Supabase managed, ACID compliance |
| **Cache** | None (V1) | - | Keep it simple | Add Redis later if needed |
| **File Storage** | Supabase Storage | Latest | Document/image uploads | Built-in, S3-compatible |
| **Authentication** | Supabase Auth | Latest | User management & Google SSO | Built-in OAuth, AI agents have examples |
| **Frontend Testing** | Jest + React Testing Library | Latest | Component and unit tests | Standard React testing, AI-documented |
| **Backend Testing** | Jest + Supertest | Latest | API endpoint testing | Node.js standard, AI examples abundant |
| **E2E Testing** | Playwright | Latest | Full user journey testing | Better than Cypress for AI agents |
| **Build Tool** | Next.js | 15.0+ | Built-in build system | Zero config, AI-friendly |
| **Bundler** | Turbopack | Latest | Next.js default bundler | Faster than Webpack, zero config |
| **IaC Tool** | None (V1) | - | Use platform defaults | Vercel + Supabase handle infrastructure |
| **CI/CD** | Vercel | Latest | Git-based deployment | Automatic on git push, AI-simple |
| **Monitoring** | Vercel Analytics | Latest | Performance monitoring | Built-in, zero config |
| **Logging** | Console + Vercel | Latest | Error tracking | Simple for V1, upgrade later |
| **CSS Framework** | Tailwind CSS | 3.0+ | Utility-first styling | AI agents trained extensively on Tailwind |

### Modern Tooling (2025 Optimizations)

**Additional tooling recommendations for enhanced AI agent development and 2025 best practices:**

| Category | Tool | Version | Purpose | AI Agent Benefits |
|----------|------|---------|---------|-------------------|
| **Code Formatting** | Biome | 1.8+ | Ultra-fast linter & formatter | Replaces ESLint + Prettier, 100x faster, AI-optimized rules |
| **URL State Management** | nuqs | 1.19+ | Next.js URL state hooks | Type-safe search params, AI agents love declarative patterns |
| **Package Manager** | Bun | 1.1+ | JavaScript runtime & package manager | 25x faster installs, compatible with npm, better for AI workflows |
| **Git Hooks** | simple-git-hooks | 2.11+ | Lightweight pre-commit hooks | AI-friendly, minimal configuration vs Husky |
| **Bundle Analyzer** | @next/bundle-analyzer | Latest | Bundle size visualization | Essential for performance optimization, AI development insights |

**Implementation Notes:**
- **Biome**: Replaces ESLint + Prettier setup, unified configuration, AI agents can work with single `.biome.json`
- **nuqs**: Perfect for AI agents handling URL state without complex state management
- **Bun**: Optional but recommended for faster development cycles, fully npm-compatible
- **simple-git-hooks**: Minimal setup for quality gates, AI agents can install/configure easily

## Data Models

Based on your PRD requirements, here are the core entities needed for MyFinancePal's privacy-first household expense management:

### User

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

### Household

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

### FinancialAccount

**Purpose:** Individual bank/investment accounts connected via MoneyHub API or manual entry

**TypeScript Interface:**
```typescript
interface FinancialAccount {
  id: string;
  user_id: string;
  moneyhub_account_id?: string;
  account_type: 'checking' | 'savings' | 'investment' | 'credit';
  account_name: string;
  institution_name: string;
  current_balance: number;
  is_shared: boolean;
  last_synced?: string;
  is_manual: boolean;
}
```

### Transaction

**Purpose:** Individual financial transactions from bank feeds or manual entry

**TypeScript Interface:**
```typescript
interface Transaction {
  id: string;
  account_id: string;
  moneyhub_transaction_id?: string;
  amount: number;
  merchant_name: string;
  category: string;
  date: string;
  is_shared_expense: boolean;
  splitting_rule_id?: string;
  manual_override: boolean;
}
```

### ExpenseSplittingRule

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

## API Specification

Based on our REST API choice and the data models above, here's the complete API specification for MyFinancePal:

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: MyFinancePal API
  version: 1.0.0
  description: Privacy-first household expense management API
servers:
  - url: https://myfinancepal.vercel.app/api
    description: Production API
  - url: http://localhost:3000/api
    description: Development API

paths:
  # Authentication
  /auth/callback:
    get:
      summary: Handle OAuth callback from Google
      parameters:
        - name: code
          in: query
          required: true
          schema:
            type: string
      responses:
        '302':
          description: Redirect to dashboard
        '400':
          description: OAuth error

  # User Management
  /user/profile:
    get:
      summary: Get current user profile
      security:
        - bearerAuth: []
      responses:
        '200':
          description: User profile data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

  # Household Management
  /households:
    get:
      summary: Get user's households
      security:
        - bearerAuth: []
      responses:
        '200':
          description: List of households
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Household'

    post:
      summary: Create new household
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                description:
                  type: string
      responses:
        '201':
          description: Household created

  # Financial Accounts
  /accounts:
    get:
      summary: Get user's financial accounts
      security:
        - bearerAuth: []
      responses:
        '200':
          description: List of accounts
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/FinancialAccount'

  # Transactions
  /transactions:
    get:
      summary: Get transactions for user's accounts
      security:
        - bearerAuth: []
      parameters:
        - name: household_view
          in: query
          schema:
            type: boolean
      responses:
        '200':
          description: List of transactions

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        full_name:
          type: string

    Household:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string

    FinancialAccount:
      type: object
      properties:
        id:
          type: string
        account_type:
          type: string
        account_name:
          type: string
        current_balance:
          type: number
        is_shared:
          type: boolean
```

## Components

Based on our Next.js + Supabase architecture, here are the major logical components across the fullstack:

### Frontend Application (Next.js Web App)

**Responsibility:** User interface, client-side routing, state management, and API communication

**Key Interfaces:**
- React components using shadcn/ui design system
- Zustand stores for client state management
- Supabase client for real-time subscriptions
- API service layer for backend communication

**Dependencies:** Supabase Auth, Backend API, External Auth Providers

**Technology Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand

### Authentication Service

**Responsibility:** User authentication, session management, and OAuth integration with Google

**Key Interfaces:**
- OAuth callback handling
- JWT token validation middleware
- User session persistence
- Protected route enforcement

**Dependencies:** Google OAuth APIs, Supabase Auth

**Technology Stack:** Supabase Auth (managed service), Next.js API routes for callbacks

### Account Aggregation Service

**Responsibility:** Financial data synchronization, MoneyHub integration, and account management

**Key Interfaces:**
- MoneyHub integration
- Scheduled account synchronization
- Transaction data processing and normalization
- Account connection status management

**Dependencies:** MoneyHub API, Database, Transaction Processing Service

**Technology Stack:** Next.js API routes, MoneyHub SDK, PostgreSQL

### Household Management Service

**Responsibility:** Household creation, member invitations, and privacy controls

**Dependencies:** Email Service, User Service, Database

**Technology Stack:** Next.js API routes, Supabase database, Email integration

### Expense Splitting Engine

**Responsibility:** Automated transaction categorization and expense splitting calculations

**Dependencies:** Transaction data, Household rules, Database

**Technology Stack:** Next.js API routes, PostgreSQL, Background processing

### Database Layer (Supabase)

**Responsibility:** Data persistence, Row Level Security enforcement, and real-time subscriptions

**Technology Stack:** Supabase PostgreSQL, Row Level Security, Real-time engine

## External APIs

MyFinancePal requires several external API integrations:

### MoneyHub API

- **Purpose:** UK financial account aggregation for banks, building societies, and investment platforms
- **Documentation:** https://docs.moneyhub.co.uk/
- **Base URL:** `https://api.moneyhub.co.uk`
- **Authentication:** OAuth 2.0 with client credentials
- **Rate Limits:** Reasonable limits for financial data aggregation

**Key Endpoints Used:**
- `POST /auth/token` - Get access token
- `GET /accounts` - Retrieve user accounts
- `GET /transactions` - Fetch transaction history
- `GET /providers` - List supported UK institutions

**Integration Notes:** Better UK bank coverage including Monzo, Starling, and traditional banks. Strong investment platform support for comprehensive net worth tracking.

### Google OAuth API

- **Purpose:** User authentication and profile data retrieval
- **Documentation:** https://developers.google.com/identity/protocols/oauth2
- **Base URL:** `https://oauth2.googleapis.com`
- **Authentication:** OAuth 2.0 with client credentials

### Supabase APIs (Managed Services)

- **Purpose:** Database, authentication, real-time subscriptions, and file storage
- **Documentation:** https://supabase.com/docs
- **Base URL:** `https://[project-id].supabase.co`

## Core Workflows

Here are the key system workflows:

### User Onboarding & Account Connection

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant SupabaseAuth
    participant MoneyHub
    participant Database

    User->>Frontend: Click "Sign in with Google"
    Frontend->>SupabaseAuth: initiate OAuth
    SupabaseAuth->>User: Google OAuth Flow
    User->>SupabaseAuth: Authorize
    SupabaseAuth->>Frontend: JWT Token

    User->>Frontend: Connect Bank Account
    Frontend->>API: Request MoneyHub Auth
    API->>MoneyHub: Create Auth Session
    MoneyHub->>API: Auth URL
    API->>Frontend: Redirect URL
    Frontend->>MoneyHub: User Authorization
    MoneyHub->>Frontend: Auth Code
    Frontend->>API: Exchange Auth Code
    API->>MoneyHub: Get Access Token
    API->>MoneyHub: Fetch Accounts
    API->>Database: Store Account Data
```

### Automated Expense Splitting & Settlement

```mermaid
sequenceDiagram
    participant MoneyHub
    participant API
    participant SplittingEngine
    participant Database
    participant Realtime
    participant Users

    MoneyHub->>API: New Transaction Webhook
    API->>Database: Store Raw Transaction
    API->>SplittingEngine: Process Transaction

    SplittingEngine->>Database: Check Splitting Rules
    Database->>SplittingEngine: Matching Rules
    SplittingEngine->>Database: Calculate Split Amounts
    SplittingEngine->>Database: Update Settlement Balances

    SplittingEngine->>Realtime: Broadcast Expense Update
    Realtime->>Users: Notify Household Members
```

## Database Schema

Here's the complete PostgreSQL schema with Row Level Security policies:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Users table (managed by Supabase Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  notification_preferences JSONB DEFAULT '{
    "email_notifications": true,
    "shared_expense_alerts": true,
    "settlement_reminders": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,

  PRIMARY KEY (id)
);

-- Households table
CREATE TABLE public.households (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  settlement_day INTEGER CHECK (settlement_day >= 1 AND settlement_day <= 31) DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Household members junction table
CREATE TABLE public.household_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  UNIQUE(household_id, user_id)
);

-- Financial accounts table
CREATE TABLE public.financial_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  moneyhub_account_id TEXT, -- External API identifier
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment', 'credit', 'loan')),
  account_name TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  current_balance DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  is_shared BOOLEAN DEFAULT false,
  is_manual BOOLEAN DEFAULT false,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE NOT NULL,
  moneyhub_transaction_id TEXT, -- External API identifier
  amount DECIMAL(15,2) NOT NULL,
  merchant_name TEXT,
  category TEXT,
  date DATE NOT NULL,
  description TEXT,
  is_shared_expense BOOLEAN DEFAULT false,
  splitting_rule_id UUID, -- References expense_splitting_rules
  manual_override BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Expense splitting rules table
CREATE TABLE public.expense_splitting_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  rule_name TEXT NOT NULL,
  merchant_pattern TEXT, -- Regex or exact match
  category_match TEXT,
  amount_threshold DECIMAL(15,2),
  split_percentage JSONB NOT NULL, -- {"user_id": percentage}
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key constraint for splitting rules
ALTER TABLE public.transactions
ADD CONSTRAINT fk_splitting_rule
FOREIGN KEY (splitting_rule_id) REFERENCES public.expense_splitting_rules(id);

-- Settlement tracking table
CREATE TABLE public.settlements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES public.users(id) NOT NULL,
  to_user_id UUID REFERENCES public.users(id) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  settlement_month DATE NOT NULL, -- First day of settlement month
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'disputed')),
  settled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_financial_accounts_user_id ON public.financial_accounts(user_id);
CREATE INDEX idx_financial_accounts_shared ON public.financial_accounts(is_shared) WHERE is_shared = true;
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX idx_transactions_shared ON public.transactions(is_shared_expense) WHERE is_shared_expense = true;
CREATE INDEX idx_household_members_user_id ON public.household_members(user_id);
CREATE INDEX idx_household_members_household_id ON public.household_members(household_id);
CREATE INDEX idx_settlements_household_month ON public.settlements(household_id, settlement_month);

-- Row Level Security Policies

-- Users: Users can only see/edit their own data
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Households: Users can see households they belong to
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their households" ON public.households
  FOR SELECT USING (
    id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create households" ON public.households
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Household members: Users can see members of their households
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view household members" ON public.household_members
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can join households" ON public.household_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Financial accounts: Users see own accounts + shared accounts in their households
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own accounts" ON public.financial_accounts
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view shared accounts in their households" ON public.financial_accounts
  FOR SELECT USING (
    is_shared = true AND user_id IN (
      SELECT hm.user_id FROM public.household_members hm
      WHERE hm.household_id IN (
        SELECT household_id FROM public.household_members
        WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can manage own accounts" ON public.financial_accounts
  FOR ALL USING (user_id = auth.uid());

-- Transactions: Users see own transactions + shared transactions in households
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM public.financial_accounts
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can view shared transactions" ON public.transactions
  FOR SELECT USING (
    is_shared_expense = true AND account_id IN (
      SELECT fa.id FROM public.financial_accounts fa
      JOIN public.household_members hm ON fa.user_id = hm.user_id
      WHERE fa.is_shared = true AND hm.household_id IN (
        SELECT household_id FROM public.household_members
        WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can manage own transactions" ON public.transactions
  FOR ALL USING (
    account_id IN (
      SELECT id FROM public.financial_accounts
      WHERE user_id = auth.uid()
    )
  );

-- Expense splitting rules: Users can see rules for their households
ALTER TABLE public.expense_splitting_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view household rules" ON public.expense_splitting_rules
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create household rules" ON public.expense_splitting_rules
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

-- Settlements: Users can see settlements for their households
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view household settlements" ON public.settlements
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );
```

## Frontend Architecture

### Component Architecture

**Component Organization:**
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── forms/          # Form components with validation
│   ├── charts/         # Financial data visualizations
│   └── layout/         # Navigation, headers, footers
├── app/                # Next.js 14 App Router pages
│   ├── (auth)/         # Authentication pages
│   ├── dashboard/      # Individual dashboard
│   ├── household/      # Household management
│   └── settings/       # User preferences
├── hooks/              # Custom React hooks
├── stores/             # Zustand state management
├── services/           # API client services
├── lib/                # Utilities and configurations
└── types/              # TypeScript interfaces
```

**Component Template (AI Agent Pattern):**
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ComponentNameProps {
  // Clear prop types for AI agents
  userId: string;
  onAction?: (data: SomeType) => void;
}

export function ComponentName({ userId, onAction }: ComponentNameProps) {
  const [loading, setLoading] = useState(false);

  // Clear, single-responsibility functions
  const handleAction = async () => {
    setLoading(true);
    try {
      // AI agents implement business logic here
      const result = await someService.performAction(userId);
      onAction?.(result);
    } catch (error) {
      console.error('Action failed:', error);
      // Error handling pattern AI agents can follow
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clear Component Purpose</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleAction} disabled={loading}>
          {loading ? 'Loading...' : 'Action'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

### State Management Architecture

**State Structure:**
```typescript
// Global state with Zustand (AI-friendly patterns)
interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;

  // Households state
  households: Household[];
  activeHousehold: string | null;
  setHouseholds: (households: Household[]) => void;
  setActiveHousehold: (id: string | null) => void;

  // Financial data state
  accounts: FinancialAccount[];
  transactions: Transaction[];
  setAccounts: (accounts: FinancialAccount[]) => void;
  setTransactions: (transactions: Transaction[]) => void;

  // UI state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}
```

### Routing Architecture

**Route Organization (Next.js 14 App Router):**
```
app/
├── page.tsx                    # Landing page
├── dashboard/
│   ├── page.tsx               # Individual dashboard
│   └── layout.tsx             # Dashboard layout
├── household/
│   ├── [id]/
│   │   ├── page.tsx          # Household dashboard
│   │   ├── members/page.tsx   # Member management
│   │   ├── rules/page.tsx     # Splitting rules
│   │   └── settlements/page.tsx # Settlement center
│   └── create/page.tsx        # Create household
├── accounts/
│   ├── page.tsx              # Account list
│   ├── connect/page.tsx      # MoneyHub connection
│   └── [id]/page.tsx         # Account details
├── settings/
│   ├── page.tsx              # User preferences
│   └── privacy/page.tsx      # Privacy controls
└── auth/
    ├── login/page.tsx        # Login page
    └── callback/page.tsx     # OAuth callback
```

### Frontend Services Layer

**API Client Setup:**
```typescript
// Unified API client for AI agents
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // AI agents implement these service methods
  async getAccounts(): Promise<FinancialAccount[]> {
    return this.request<FinancialAccount[]>('/accounts');
  }

  async createHousehold(data: CreateHouseholdRequest): Promise<Household> {
    return this.request<Household>('/households', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
```

## Backend Architecture

### Service Architecture

**Function Organization:**
```
app/api/
├── auth/
│   └── callback/route.ts      # OAuth callback handler
├── user/
│   └── profile/route.ts       # User profile management
├── accounts/
│   ├── route.ts              # GET/POST accounts
│   ├── [id]/
│   │   ├── route.ts          # Account details
│   │   └── sharing/route.ts   # Update sharing settings
│   └── connect/route.ts       # MoneyHub connection
├── households/
│   ├── route.ts              # GET/POST households
│   └── [id]/
│       ├── route.ts          # Household details
│       ├── invite/route.ts    # Member invitations
│       ├── members/route.ts   # Member management
│       └── rules/route.ts     # Splitting rules
├── transactions/
│   ├── route.ts              # GET transactions
│   ├── [id]/
│   │   └── categorize/route.ts # Override categorization
│   └── sync/route.ts          # Trigger MoneyHub sync
└── dashboard/
    ├── individual/route.ts    # Personal dashboard
    └── household/
        └── [id]/route.ts      # Household dashboard
```

**Function Template (AI Agent Pattern):**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Input validation schema for AI agents
const CreateHouseholdSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  settlement_day: z.number().min(1).max(31).default(1),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication (standard pattern for AI agents)
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Input validation (Zod pattern AI agents understand)
    const body = await request.json();
    const validatedData = CreateHouseholdSchema.parse(body);

    // 3. Business logic (clear, single responsibility)
    const { data: household, error } = await supabase
      .from('households')
      .insert({
        ...validatedData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create household' }, { status: 500 });
    }

    // 4. Add creator as member
    await supabase
      .from('household_members')
      .insert({
        household_id: household.id,
        user_id: user.id,
        role: 'creator',
      });

    // 5. Return success response
    return NextResponse.json(household, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Retry Strategies and Circuit Breaker Patterns

**Exponential Backoff for External APIs:**
```typescript
// MoneyHub API client with retry logic
export class MoneyHubClient {
  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken()}`,
            ...options.headers,
          },
        });

        if (response.ok) {
          return response.json();
        }

        // Don't retry on client errors (400-499)
        if (response.status >= 400 && response.status < 500) {
          throw new ExternalServiceError(
            'MoneyHub',
            `Client error: ${response.status}`
          );
        }

        // Retry on server errors (500+) or network issues
        throw new Error(`Server error: ${response.status}`);

      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new ExternalServiceError('MoneyHub', lastError.message);
  }
}
```

**Circuit Breaker for Service Protection:**
```typescript
// Circuit breaker to protect against cascading failures
export class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold = 5,      // Failures before opening
    private timeout = 60000,    // 1 minute timeout
    private resetTime = 30000   // 30 seconds to try again
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.resetTime) {
        this.state = 'HALF_OPEN';
      } else {
        throw new ExternalServiceError(
          'Service',
          'Circuit breaker is OPEN - service temporarily unavailable'
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage in MoneyHub service
const moneyHubCircuitBreaker = new CircuitBreaker();

export async function syncUserAccounts(userId: string) {
  try {
    return await moneyHubCircuitBreaker.execute(async () => {
      return await moneyHubClient.getAccounts(userId);
    });
  } catch (error) {
    // Graceful degradation - show cached data
    return await getCachedAccounts(userId);
  }
}
```

### User-Friendly Error Messages

**Error Message Mapping:**
```typescript
// User-friendly error messages for common scenarios
const ERROR_MESSAGES = {
  NETWORK_ERROR: {
    title: 'Connection Problem',
    message: 'Please check your internet connection and try again.',
    action: 'Retry',
  },
  EXTERNAL_SERVICE_ERROR: {
    title: 'Temporary Service Issue',
    message: 'We\'re having trouble connecting to your bank. This usually resolves quickly.',
    action: 'Try Again Later',
  },
  VALIDATION_ERROR: {
    title: 'Invalid Information',
    message: 'Please check the information you entered and try again.',
    action: 'Fix and Retry',
  },
  UNAUTHORIZED: {
    title: 'Session Expired',
    message: 'Please sign in again to continue.',
    action: 'Sign In',
  },
  RATE_LIMIT_ERROR: {
    title: 'Too Many Requests',
    message: 'Please wait a moment before trying again.',
    action: 'Wait and Retry',
  },
} as const;

// Error display component
export function ErrorAlert({ error }: { error: ApiClientError }) {
  const errorConfig = ERROR_MESSAGES[error.code] || ERROR_MESSAGES.NETWORK_ERROR;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{errorConfig.title}</AlertTitle>
      <AlertDescription className="mt-2">
        {errorConfig.message}
        {error.isRetryable && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            {errorConfig.action}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

### Database Architecture

**Data Access Layer (Repository Pattern):**
```typescript
// Service layer for AI agents to implement
export class HouseholdRepository {
  constructor(private supabase: SupabaseClient) {}

  async findUserHouseholds(userId: string): Promise<Household[]> {
    const { data, error } = await this.supabase
      .from('households')
      .select(`
        *,
        household_members!inner(role),
        _count:household_members(count)
      `)
      .eq('household_members.user_id', userId);

    if (error) throw new Error(`Failed to fetch households: ${error.message}`);
    return data || [];
  }

  async createHousehold(data: CreateHouseholdData): Promise<Household> {
    const { data: household, error } = await this.supabase
      .from('households')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to create household: ${error.message}`);
    return household;
  }
}
```

### Authentication and Authorization

**Auth Middleware (AI Agent Implementation):**
```typescript
// Reusable auth utility for AI agents
export async function authenticateRequest(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Authentication required');
  }

  return { user, supabase };
}

// Usage in API routes
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    // Protected logic here
    const data = await supabase
      .from('some_table')
      .select('*');

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
```

## Unified Project Structure

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
│   │   │   │   │   └── page.tsx # MoneyHub connection
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
│   │       │   │   └── route.ts # MoneyHub connection
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
│   │   └── moneyhub-service.ts # MoneyHub integration
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
│   │   └── moneyhub.ts      # MoneyHub API types
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

## Development Workflow

### Local Development Setup

**Prerequisites:**
```bash
# Required software installation
node --version        # Node.js 22+ required
npm --version         # npm 9+ required
git --version         # Git for version control

# Install global dependencies
npm install -g vercel  # Vercel CLI for deployment
```

**Initial Setup:**
```bash
# Clone and setup project
git clone <repository-url> myfinancepal
cd myfinancepal

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Setup Supabase project
npx supabase init
npx supabase start

# Run initial database migration
npx supabase db reset

# Generate TypeScript types from database
npx supabase gen types typescript --local > src/types/database.ts
```

**Development Commands (AI Agent Optimized):**
```bash
# Quick start (AI agents)
npm run dev                 # Next.js dev server (http://localhost:3000)
npm run ai:setup            # Full project setup for AI agents (install + types + seed)
npm run ai:fresh            # Clean restart (reset DB, regenerate types, restart dev)

# Development modes
npm run dev:frontend        # Next.js without API routes
npm run dev:api            # API routes only
npm run dev:turbo           # Turbopack mode for faster builds

# Database operations
npm run db:reset           # Reset local database
npm run db:migrate         # Run pending migrations
npm run db:seed            # Add development data
npm run db:types           # Regenerate TypeScript types
npm run db:studio          # Open Supabase Studio (local)

# Testing commands
npm run test               # Unit tests
npm run test:watch         # Watch mode
npm run test:e2e           # End-to-end tests
npm run test:api           # API endpoint tests
npm run test:coverage      # Generate coverage report

# Code quality (2025 stack)
npm run check              # Run all checks (lint + type + test)
npm run lint               # Biome linting (replaces ESLint)
npm run lint:fix           # Auto-fix linting issues
npm run format             # Biome formatting (replaces Prettier)
npm run type-check         # TypeScript validation
npm run analyze            # Bundle analyzer for performance

# AI agent convenience
npm run pre-commit         # Run all quality checks before commit
npm run docs:api           # Generate API documentation
npm run health             # Check all services health
npm run clean              # Clean all build artifacts and caches
```

**package.json Scripts Configuration:**
```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "dev:frontend": "next dev --turbo",
    "dev:api": "next dev --turbo",
    "dev:turbo": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "ai:setup": "npm install && npm run db:reset && npm run db:types && npm run db:seed",
    "ai:fresh": "npm run clean && npm run db:reset && npm run db:types && npm run dev",
    "db:reset": "supabase db reset --local",
    "db:migrate": "supabase db push --local",
    "db:seed": "supabase db seed --local",
    "db:types": "supabase gen types typescript --local > src/types/database.ts",
    "db:studio": "supabase studio",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "test:api": "jest --testPathPattern=api",
    "test:coverage": "jest --coverage",
    "check": "npm run lint && npm run type-check && npm run test",
    "lint": "biome check ./src",
    "lint:fix": "biome check --apply ./src",
    "format": "biome format --write ./src",
    "type-check": "tsc --noEmit",
    "analyze": "cross-env ANALYZE=true next build",
    "pre-commit": "npm run lint:fix && npm run type-check && npm run test",
    "docs:api": "tsx scripts/generate-api-docs.ts",
    "health": "tsx scripts/health-check.ts",
    "clean": "rimraf .next node_modules/.cache dist coverage"
  }
}
```

### Environment Configuration

**Required Environment Variables:**

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend (.env.local)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
MONEYHUB_CLIENT_ID=your_moneyhub_client_id
MONEYHUB_CLIENT_SECRET=your_moneyhub_client_secret
MONEYHUB_API_URL=https://api.moneyhub.co.uk

# Authentication
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Email service
RESEND_API_KEY=your_resend_api_key

# Development
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:54432/postgres
```

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Vercel (automatic deployments)
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (automatic detection)
- **CDN/Edge:** Vercel Edge Network with global distribution

**Backend Deployment:**
- **Platform:** Vercel Serverless Functions (same deployment)
- **Build Command:** `npm run build` (includes API routes)
- **Deployment Method:** Git-based automatic deployment

**Database Deployment:**
- **Platform:** Supabase (managed PostgreSQL)
- **Migrations:** Automatic via Supabase Dashboard or CLI
- **Backups:** Daily automated backups with point-in-time recovery

### CI/CD Pipeline

**GitHub Actions Workflow (.github/workflows/deploy.yml):**
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test

      - name: Run build test
        run: npm run build

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| **Development** | http://localhost:3000 | http://localhost:3000/api | Local development |
| **Staging** | https://myfinancepal-staging.vercel.app | https://myfinancepal-staging.vercel.app/api | Pre-production testing |
| **Production** | https://myfinancepal.com | https://myfinancepal.com/api | Live environment |

## Security and Performance

### Security Requirements

**Frontend Security:**
- **CSP Headers:** `default-src 'self'; script-src 'self' 'unsafe-inline' vercel.live; connect-src 'self' *.supabase.co *.moneyhub.co.uk; img-src 'self' data: *.googleusercontent.com`
- **XSS Prevention:** Automatic Next.js protection + input sanitization with DOMPurify
- **Secure Storage:** Sensitive data only in httpOnly cookies, non-sensitive in localStorage with encryption

**Backend Security:**
- **Input Validation:** Zod schemas validate all API inputs with strict type checking
- **Rate Limiting:** 100 requests/minute per IP, 1000 requests/hour per authenticated user
- **CORS Policy:** `origin: ['https://myfinancepal.com', 'https://myfinancepal-staging.vercel.app']`

**Authentication Security:**
- **Token Storage:** JWT in httpOnly cookies with secure, sameSite: 'strict' flags
- **Session Management:** Supabase automatic token refresh with 1-hour expiry
- **Password Policy:** Google OAuth only - no password storage or management required

**Database Security:**
- **Row Level Security:** All tables protected with RLS policies preventing cross-user data access
- **Connection Security:** SSL-only connections with certificate pinning
- **Data Encryption:** AES-256 encryption at rest, TLS 1.3 in transit
- **Access Control:** Service role keys for server, anon keys for client with strict permissions

### Performance Optimization

**Frontend Performance:**
- **Bundle Size Target:** < 250KB initial bundle, < 1MB total assets
- **Loading Strategy:** Lazy loading for routes, dynamic imports for heavy components
- **Caching Strategy:** Aggressive caching of static assets (1 year), API responses (5 minutes)

**Backend Performance:**
- **Response Time Target:** < 200ms for dashboard APIs, < 500ms for complex queries
- **Database Optimization:** Strategic indexes on user_id, household_id, date columns
- **Caching Strategy:** Redis for session data, Vercel edge caching for static responses

## Testing Strategy

### Testing Pyramid

```
         E2E Tests (Few)
        /               \
    Integration Tests (Some)
   /                         \
Frontend Unit Tests    Backend Unit Tests
      (Many)                (Many)
```

### Test Organization

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
│   ├── moneyhub-service.test.ts
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
│   ├── account-connection.spec.ts # MoneyHub integration
│   └── household-creation.spec.ts # First household setup
├── core-workflows/
│   ├── expense-sharing.spec.ts    # End-to-end expense flow
│   ├── settlement-process.spec.ts # Monthly settlement
│   └── privacy-controls.spec.ts   # Account sharing
└── critical-paths/
    ├── dashboard-loading.spec.ts  # Performance testing
    └── real-time-updates.spec.ts  # Supabase subscriptions
```

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing:** Always define types in `src/types/` and import from there - never duplicate type definitions between frontend and backend
- **API Calls:** Never make direct HTTP calls - use the service layer (`src/services/`) for all external API communication
- **Environment Variables:** Access only through config objects in `src/lib/config.ts`, never `process.env` directly in components
- **Error Handling:** All API routes must use the standard error handler pattern with try/catch and proper HTTP status codes
- **State Updates:** Never mutate state directly - use Zustand actions for all state modifications
- **Database Access:** Always use Supabase client with RLS policies - never raw SQL queries in API routes
- **Authentication:** Every protected API route must call `authenticateRequest()` helper first
- **Input Validation:** Use Zod schemas for all API endpoints and form submissions - no unvalidated data
- **Component Props:** Always define TypeScript interfaces for component props - no `any` types allowed
- **File Naming:** Use kebab-case for files, PascalCase for components, camelCase for functions and variables

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| **Components** | PascalCase | - | `UserProfile.tsx` |
| **Hooks** | camelCase with 'use' | - | `useAuth.ts` |
| **API Routes** | - | kebab-case | `/api/user-profile` |
| **Database Tables** | - | snake_case | `user_profiles` |
| **TypeScript Interfaces** | PascalCase | PascalCase | `interface UserProfile {}` |
| **Functions** | camelCase | camelCase | `getUserProfile()` |
| **Constants** | UPPER_SNAKE_CASE | UPPER_SNAKE_CASE | `API_BASE_URL` |
| **Files** | kebab-case | kebab-case | `user-profile.tsx` |

## Error Handling Strategy

### Error Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Service
    participant Database
    participant External

    Client->>API: Request with invalid data
    API->>API: Zod validation fails
    API->>Client: 400 + structured error

    Client->>API: Valid request
    API->>Service: Business logic
    Service->>Database: Query fails
    Database->>Service: Database error
    Service->>API: Throw custom error
    API->>API: Error handler catches
    API->>Client: 500 + sanitized error

    Client->>API: External API call
    API->>External: MoneyHub request
    External->>API: Rate limit exceeded
    API->>API: Retry with backoff
    External->>API: Still failing
    API->>Client: 503 + user-friendly message
```

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
    retryable?: boolean;
  };
}
```

### Frontend Error Handling

```typescript
// Global error boundary component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Report to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

### Backend Error Handling

```typescript
// Standard error handler for API routes
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Global error handler utility
export function handleApiError(error: unknown, requestId: string): NextResponse {
  const timestamp = new Date().toISOString();

  // Log error for debugging
  console.error(`[${requestId}] API Error:`, error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp,
          requestId,
          retryable: error.statusCode >= 500,
        },
      },
      { status: error.statusCode }
    );
  }

  // Unknown error - don't expose internal details
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
        timestamp,
        requestId,
        retryable: true,
      },
    },
    { status: 500 }
  );
}
```

## Monitoring and Observability

### Monitoring Stack

**Frontend Monitoring:**
- **Vercel Analytics:** Built-in Web Vitals, page views, and user sessions
- **Error Boundaries:** React error catching with automatic reporting
- **Performance Monitoring:** Custom performance tracking for financial operations
- **User Experience Tracking:** Conversion funnel monitoring (signup → account connection → household creation)

**Backend Monitoring:**
- **Vercel Functions Analytics:** Request volume, response times, error rates per endpoint
- **Supabase Monitoring:** Database performance, connection pooling, query analytics
- **External API Monitoring:** MoneyHub API health, response times, rate limit tracking
- **Real-time Monitoring:** WebSocket connection health, subscription performance

**Database Monitoring:**
- **Supabase Dashboard:** Query performance, slow query detection, connection metrics
- **Row Level Security Monitoring:** Policy performance, access pattern analysis
- **Migration Monitoring:** Schema change tracking, rollback capabilities

### Key Metrics

**Frontend Metrics:**
```typescript
// Custom performance tracking
export class PerformanceTracker {
  static trackPageLoad(pageName: string) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    const metrics = {
      page: pageName,
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: this.getFirstPaint(),
      largestContentfulPaint: this.getLCP(),
      timestamp: new Date().toISOString(),
    };

    // Send to analytics
    this.sendMetrics('page_performance', metrics);
  }

  static trackApiCall(endpoint: string, duration: number, success: boolean) {
    const metrics = {
      endpoint,
      duration,
      success,
      timestamp: new Date().toISOString(),
    };

    this.sendMetrics('api_performance', metrics);
  }

  static trackUserAction(action: string, context: Record<string, any>) {
    const metrics = {
      action,
      context,
      userId: this.getCurrentUserId(),
      timestamp: new Date().toISOString(),
    };

    this.sendMetrics('user_actions', metrics);
  }
}
```

**Backend Metrics:**
```typescript
// API performance middleware
export function withMonitoring<T>(
  handler: (req: NextRequest) => Promise<T>,
  endpoint: string
) {
  return async (req: NextRequest): Promise<T> => {
    const startTime = Date.now();
    const requestId = req.headers.get('X-Request-ID') || `req_${Date.now()}`;

    try {
      const result = await handler(req);

      // Log successful request
      console.log(`[${requestId}] ${endpoint} completed in ${Date.now() - startTime}ms`);

      // Track metrics
      await trackMetrics({
        endpoint,
        duration: Date.now() - startTime,
        status: 'success',
        timestamp: new Date().toISOString(),
        requestId,
      });

      return result;
    } catch (error) {
      // Log error
      console.error(`[${requestId}] ${endpoint} failed after ${Date.now() - startTime}ms:`, error);

      // Track error metrics
      await trackMetrics({
        endpoint,
        duration: Date.now() - startTime,
        status: 'error',
        errorType: error.constructor.name,
        timestamp: new Date().toISOString(),
        requestId,
      });

      throw error;
    }
  };
}
```

**Business Metrics:**
- User onboarding completion rate
- Account connection success rate
- Household creation and member invitation success
- Settlement calculation accuracy
- Transaction categorization accuracy
- Daily/Weekly/Monthly active users

### Alert Configuration

**Critical Alerts (Immediate Response Required):**
- API error rate > 5%
- Average response time > 2 seconds
- Database connection failures
- Authentication failure rate > 10%
- MoneyHub sync failure rate > 20%

**Warning Alerts:**
- API error rate > 2%
- Response time > 1 second
- Slow database queries
- High resource usage (CPU/Memory)

**Health Check Endpoints:**
```typescript
// Comprehensive health monitoring
export async function GET(request: NextRequest) {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'healthy', responseTime: 50 },
      moneyHub: { status: 'healthy', responseTime: 200 },
      authentication: { status: 'healthy', responseTime: 30 },
    },
    performance: {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
    },
  };

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  return NextResponse.json(healthCheck, { status: statusCode });
}
```

## API Documentation Standards

### OpenAPI Generation and Maintenance

**Automated OpenAPI Specification:**
```typescript
// Auto-generated OpenAPI from Zod schemas
import { z } from 'zod';
import { createDocument } from 'zod-openapi';

// Define schemas that serve both validation and documentation
export const CreateHouseholdSchema = z.object({
  name: z.string().min(1).max(100).describe('Household name (e.g., "The Smith Family")'),
  description: z.string().max(500).optional().describe('Optional household description'),
  settlement_day: z.number().int().min(1).max(31).default(1).describe('Day of month for settlements (1-31)'),
}).openapi({
  title: 'CreateHouseholdRequest',
  description: 'Request body for creating a new household',
  example: {
    name: 'The Smith Family',
    description: 'Our family household for shared expenses',
    settlement_day: 15,
  },
});

export const HouseholdResponseSchema = z.object({
  id: z.string().uuid().describe('Unique household identifier'),
  name: z.string().describe('Household name'),
  description: z.string().nullable().describe('Household description'),
  created_by: z.string().uuid().describe('ID of user who created household'),
  settlement_day: z.number().int().describe('Monthly settlement day'),
  created_at: z.string().datetime().describe('Household creation timestamp'),
  member_count: z.number().int().describe('Number of household members'),
}).openapi({
  title: 'Household',
  description: 'Household information with member count',
  example: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'The Smith Family',
    description: 'Our family household for shared expenses',
    created_by: '550e8400-e29b-41d4-a716-446655440001',
    settlement_day: 15,
    created_at: '2025-01-15T10:30:00Z',
    member_count: 2,
  },
});
```

### API Documentation Generation Workflow

**Automated Documentation Pipeline:**
```typescript
// scripts/generate-api-docs.ts
import fs from 'fs/promises';
import path from 'path';
import { apiDocumentation } from '../src/lib/api-documentation';

async function generateApiDocumentation() {
  try {
    // Generate OpenAPI JSON
    const openApiJson = JSON.stringify(apiDocumentation, null, 2);
    await fs.writeFile(
      path.join(process.cwd(), 'docs/api/openapi.json'),
      openApiJson
    );

    // Generate OpenAPI YAML
    const yaml = require('js-yaml');
    const openApiYaml = yaml.dump(apiDocumentation);
    await fs.writeFile(
      path.join(process.cwd(), 'docs/api/openapi.yaml'),
      openApiYaml
    );

    // Generate Markdown documentation
    const markdownDocs = await generateMarkdownDocs(apiDocumentation);
    await fs.writeFile(
      path.join(process.cwd(), 'docs/api/README.md'),
      markdownDocs
    );

    console.log('✅ API documentation generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate API documentation:', error);
    process.exit(1);
  }
}

// Add to package.json scripts:
// "docs:api": "tsx scripts/generate-api-docs.ts"
```

### Interactive API Documentation

**Swagger UI Integration:**
```typescript
// app/api/docs/route.ts - Serve interactive API docs
export async function GET(request: NextRequest) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>MyFinancePal API Documentation</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
      <script>
        SwaggerUIBundle({
          url: '/api/docs/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          tryItOutEnabled: true,
          requestInterceptor: (request) => {
            // Add authentication header for try-it-out functionality
            const token = localStorage.getItem('auth-token');
            if (token) {
              request.headers['Authorization'] = 'Bearer ' + token;
            }
            return request;
          }
        });
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
```

### API Client SDK Generation

**TypeScript SDK Auto-Generation:**
- Automated TypeScript client generation from OpenAPI spec
- Type-safe API calls with IntelliSense support
- Authentication handling built into generated client
- Automatic updates when API changes

**SDK Usage Example:**
```typescript
import { MyFinancePalClient } from '@myfinancepal/sdk';

const client = new MyFinancePalClient({
  baseUrl: 'https://api.myfinancepal.com',
  authToken: 'your-jwt-token',
});

// Type-safe API calls
const households = await client.households.getHouseholds();
const newHousehold = await client.households.createHousehold({
  name: 'New Household',
  settlement_day: 15,
});
```

## Development Team Guidelines

### AI Agent Onboarding and Management

**AI Agent Setup Checklist:**
```markdown
# AI Agent Onboarding Checklist

## 🤖 Agent Setup Requirements

### 1. Access Credentials
- [ ] GitHub repository access with appropriate permissions
- [ ] Supabase project access (development environment)
- [ ] Vercel deployment access (view-only for new agents)
- [ ] MoneyHub sandbox API credentials
- [ ] Access to shared documentation and standards

### 2. Development Environment
- [ ] Node.js 22+ installed locally
- [ ] Git configured with proper author information
- [ ] VS Code with 2025 development setup:
  **Core Extensions:**
  - [ ] Biome (biomejs.biome) - Unified linting & formatting
  - [ ] TypeScript Importer (pmneo.tsimporter) - Auto import organization
  - [ ] Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss) - Class completion
  - [ ] Auto Rename Tag (formulahendry.auto-rename-tag) - HTML/JSX productivity
  - [ ] GitLens (eamodio.gitlens) - Enhanced Git capabilities

  **Next.js/React Specific:**
  - [ ] ES7+ React/Redux/React-Native snippets (dsznajder.es7-react-js-snippets)
  - [ ] React Developer Tools (ms-vscode.vscode-react-native) - Component debugging
  - [ ] Next.js snippets (PulkitGangwar.nextjs-snippets) - Framework shortcuts

  **Database & APIs:**
  - [ ] Thunder Client (rangav.vscode-thunder-client) - API testing
  - [ ] PostgreSQL (ms-ossdata.vscode-postgresql) - Database queries
  - [ ] Supabase Snippets (supabase.supabase-snippets) - Platform integration

  **AI Agent Productivity:**
  - [ ] Error Lens (usernamehw.errorlens) - Inline error display
  - [ ] Bracket Pair Colorizer 2 (CoenraadS.bracket-pair-colorizer-2) - Code navigation
  - [ ] Path Intellisense (christian-kohler.path-intellisense) - File path completion
  - [ ] Auto Import - ES6, TS, JSX, TSX (steoates.autoimport) - Smart imports

**VS Code Workspace Configuration (.vscode/settings.json):**
```json
{
  "typescript.preferences.useAliasesForRenames": false,
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true,
    "source.organizeImports": true
  },
  "biome.enabled": true,
  "biome.formatOnSave": true,
  "biome.lintOnSave": true,
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "emmet.includeLanguages": {
    "typescript": "typescriptreact",
    "javascript": "javascriptreact"
  },
  "git.autofetch": true,
  "git.enableSmartCommit": true,
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "*.ts": "${capture}.js, ${capture}.d.ts.map, ${capture}.d.ts, ${capture}.js.map",
    "*.tsx": "${capture}.ts, ${capture}.js",
    "package.json": "package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb"
  }
}
```

**VS Code Tasks Configuration (.vscode/tasks.json):**
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "type": "npm",
      "script": "dev",
      "group": "build",
      "label": "Start Development Server",
      "detail": "Run Next.js development server"
    },
    {
      "type": "npm",
      "script": "ai:setup",
      "group": "build",
      "label": "AI Agent Setup",
      "detail": "Complete project setup for AI agents"
    },
    {
      "type": "npm",
      "script": "check",
      "group": "test",
      "label": "Run All Checks",
      "detail": "Lint, type-check, and test"
    },
    {
      "type": "npm",
      "script": "db:studio",
      "group": "build",
      "label": "Open Database Studio",
      "detail": "Launch Supabase Studio"
    }
  ]
}
```

### 3. Project Knowledge
- [ ] Read complete architecture document (docs/architecture.md)
- [ ] Review PRD and understand business requirements
- [ ] Study code style guide and naming conventions
- [ ] Understand database schema and RLS policies
- [ ] Review API documentation and test endpoints
```

**Agent Specialization Areas:**

**Frontend Specialist Agent:**
- React component development using shadcn/ui
- State management with Zustand
- Form handling and validation
- Real-time UI updates via Supabase subscriptions
- Mobile-responsive design implementation

**Backend Specialist Agent:**
- API route development with proper error handling
- Database schema design and RLS policy creation
- External API integration (MoneyHub, Google OAuth)
- Business logic implementation
- Performance optimization and caching

**Full-Stack Agent:**
- End-to-end feature implementation
- Cross-stack debugging and optimization
- Integration testing and quality assurance
- Documentation and code review
- Deployment and monitoring

### Code Review Process

**Automated Review Checklist:**
```markdown
## 🔍 Pull Request Checklist

### Code Quality
- [ ] Code follows established naming conventions
- [ ] TypeScript types are properly defined (no `any` types)
- [ ] Error handling implemented according to standards
- [ ] Input validation using Zod schemas
- [ ] Database queries use RLS policies appropriately

### Testing
- [ ] Unit tests written for new functionality
- [ ] Integration tests updated if API changes
- [ ] E2E tests added for new user workflows
- [ ] All tests passing locally
- [ ] No console errors in browser during manual testing

### Security
- [ ] No sensitive data exposed in code or logs
- [ ] Authentication required for protected endpoints
- [ ] Input sanitization implemented
- [ ] RLS policies protect data access
- [ ] Environment variables used for configuration

### Business Logic
- [ ] Implementation matches PRD requirements
- [ ] Edge cases handled appropriately
- [ ] User experience flow validated
- [ ] Privacy controls working correctly
- [ ] Financial calculations verified for accuracy
```

### Agent Collaboration Guidelines

**Communication Standards:**
- **Commit Messages:** Use conventional commit format
  - `feat: add household invitation system`
  - `fix: resolve settlement calculation bug`
  - `docs: update API documentation`
  - `test: add transaction categorization tests`

- **Branch Naming:** Follow pattern `<agent-id>/<feature-type>/<brief-description>`
  - `frontend-agent/feature/household-dashboard`
  - `backend-agent/fix/auth-token-refresh`
  - `fullstack-agent/refactor/error-handling`

**Quality Standards for AI Agents:**
- **Test Coverage:** Minimum 80% for new code
- **TypeScript Strict:** No `any` types, all interfaces defined
- **Performance:** No regression in page load times
- **Financial Calculations:** 100% accuracy required
- **Privacy Controls:** RLS policies thoroughly tested

**Escalation Procedures:**
- **Security Concerns:** Immediately escalate any potential security issues
- **Performance Degradation:** Alert if response times increase significantly
- **Data Inconsistencies:** Report any financial calculation discrepancies
- **External API Issues:** Notify team of MoneyHub or other service problems
- **Architecture Questions:** Escalate decisions that affect system design

## Infrastructure as Code

### Environment Configuration Management

**Vercel Environment Management:**
```typescript
// scripts/setup-environments.ts
import { execSync } from 'child_process';

interface EnvironmentConfig {
  name: string;
  domain?: string;
  variables: Record<string, string>;
  secrets: string[];
}

const environments: EnvironmentConfig[] = [
  {
    name: 'development',
    variables: {
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NODE_ENV: 'development',
    },
    secrets: [
      'SUPABASE_SERVICE_ROLE_KEY',
      'MONEYHUB_CLIENT_SECRET',
      'GOOGLE_CLIENT_SECRET',
    ],
  },
  {
    name: 'staging',
    domain: 'staging.myfinancepal.com',
    variables: {
      NEXT_PUBLIC_APP_URL: 'https://staging.myfinancepal.com',
      NEXT_PUBLIC_SUPABASE_URL: 'https://staging-project.supabase.co',
      NODE_ENV: 'production',
      MONEYHUB_API_URL: 'https://sandbox.api.moneyhub.co.uk',
    },
    secrets: [
      'SUPABASE_SERVICE_ROLE_KEY_STAGING',
      'MONEYHUB_CLIENT_SECRET_STAGING',
      'GOOGLE_CLIENT_SECRET',
    ],
  },
  {
    name: 'production',
    domain: 'myfinancepal.com',
    variables: {
      NEXT_PUBLIC_APP_URL: 'https://myfinancepal.com',
      NEXT_PUBLIC_SUPABASE_URL: 'https://prod-project.supabase.co',
      NODE_ENV: 'production',
      MONEYHUB_API_URL: 'https://api.moneyhub.co.uk',
    },
    secrets: [
      'SUPABASE_SERVICE_ROLE_KEY_PROD',
      'MONEYHUB_CLIENT_SECRET_PROD',
      'GOOGLE_CLIENT_SECRET',
    ],
  },
];

async function setupEnvironments() {
  console.log('🚀 Setting up Vercel environments...');

  for (const env of environments) {
    console.log(`\n📝 Configuring ${env.name} environment...`);

    // Set environment variables
    for (const [key, value] of Object.entries(env.variables)) {
      try {
        execSync(
          `vercel env add ${key} ${env.name} --value="${value}" --force`,
          { stdio: 'inherit' }
        );
        console.log(`✅ Set ${key} for ${env.name}`);
      } catch (error) {
        console.error(`❌ Failed to set ${key}:`, error.message);
      }
    }
  }
}
```

### Supabase Database Configuration

**Environment-Specific Database Setup:**
```typescript
// supabase/config/environments.ts
interface DatabaseConfig {
  environment: 'development' | 'staging' | 'production';
  projectId: string;
  apiUrl: string;
  features: {
    realtime: boolean;
    auth: boolean;
    storage: boolean;
    edgeFunctions: boolean;
  };
  pooling: {
    enabled: boolean;
    mode: 'transaction' | 'session';
    maxConnections: number;
  };
  rls: {
    enabled: boolean;
    bypassRole?: string;
  };
}

export const databaseConfigs: Record<string, DatabaseConfig> = {
  development: {
    environment: 'development',
    projectId: 'local-dev',
    apiUrl: 'http://localhost:54321',
    features: {
      realtime: true,
      auth: true,
      storage: true,
      edgeFunctions: false,
    },
    pooling: {
      enabled: false,
      mode: 'session',
      maxConnections: 10,
    },
    rls: {
      enabled: true,
      bypassRole: 'service_role',
    },
  },
  staging: {
    environment: 'staging',
    projectId: 'myfinancepal-staging',
    apiUrl: 'https://staging-project.supabase.co',
    features: {
      realtime: true,
      auth: true,
      storage: true,
      edgeFunctions: true,
    },
    pooling: {
      enabled: true,
      mode: 'transaction',
      maxConnections: 50,
    },
    rls: {
      enabled: true,
    },
  },
  production: {
    environment: 'production',
    projectId: 'myfinancepal-prod',
    apiUrl: 'https://prod-project.supabase.co',
    features: {
      realtime: true,
      auth: true,
      storage: true,
      edgeFunctions: true,
    },
    pooling: {
      enabled: true,
      mode: 'transaction',
      maxConnections: 100,
    },
    rls: {
      enabled: true,
    },
  },
};
```

### Automated Deployment Configuration

**GitHub Actions Infrastructure Pipeline:**
```yaml
# .github/workflows/infrastructure.yml
name: Infrastructure Management

on:
  push:
    branches: [main]
    paths: ['infrastructure/**', '.github/workflows/infrastructure.yml']

jobs:
  validate-infrastructure:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Validate environment configs
        run: npm run validate:infrastructure

      - name: Check database migration syntax
        run: npm run validate:migrations

      - name: Verify environment variables
        run: npm run verify:env-vars

  deploy-staging-infrastructure:
    if: github.ref == 'refs/heads/main'
    needs: validate-infrastructure
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy infrastructure changes
        run: npm run deploy:staging-infrastructure
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Run database migrations
        run: npm run migrate:staging

      - name: Verify deployment health
        run: npm run health-check:staging
```

### Configuration Validation and Testing

**Infrastructure Testing:**
- **Environment Validation:** Automated validation of all environment configurations
- **Database Connectivity:** Health checks for all database connections
- **External API Testing:** Verification of MoneyHub and Google API connectivity
- **Deployment Verification:** Post-deployment health checks and rollback capabilities
- **Configuration Drift Detection:** Monitoring for infrastructure configuration changes

**Key Benefits:**
- **Environment Parity:** Consistent configuration across all environments prevents deployment issues
- **Automated Validation:** Infrastructure testing catches configuration errors before deployment
- **Version Control:** All infrastructure configuration stored in Git for change tracking
- **Rollback Capability:** Automated deployment pipeline supports quick rollbacks if issues occur
- **Health Monitoring:** Continuous validation ensures infrastructure remains healthy

## User Analytics & Business Intelligence

### Data Collection Strategy

**Privacy-First Analytics Framework:**
```typescript
// lib/analytics/privacy-first-collector.ts
interface AnalyticsEvent {
  event: string;
  userId?: string;
  sessionId: string;
  timestamp: string;
  properties: Record<string, any>;
  context: {
    page: string;
    userAgent: string;
    referrer?: string;
    viewport: { width: number; height: number };
  };
}

export class PrivacyFirstAnalytics {
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.getCurrentUserId();
  }

  // Core business metrics tracking
  trackUserOnboarding(step: string, success: boolean, metadata?: Record<string, any>) {
    this.track('user_onboarding', {
      step,
      success,
      ...metadata,
    });
  }

  trackAccountConnection(provider: string, success: boolean, errorType?: string) {
    this.track('account_connection', {
      provider,
      success,
      error_type: errorType,
      timestamp: new Date().toISOString(),
    });
  }

  trackHouseholdActivity(action: string, householdSize: number, metadata?: Record<string, any>) {
    this.track('household_activity', {
      action,
      household_size: householdSize,
      ...metadata,
    });
  }

  trackExpenseSharing(ruleType: string, memberCount: number, transactionAmount: number) {
    this.track('expense_sharing', {
      rule_type: ruleType,
      member_count: memberCount,
      // Round transaction amount to protect financial privacy
      transaction_amount_range: this.categorizeAmount(transactionAmount),
    });
  }

  private categorizeAmount(amount: number): string {
    if (amount <= 10) return '0-10';
    if (amount <= 50) return '11-50';
    if (amount <= 100) return '51-100';
    if (amount <= 500) return '101-500';
    if (amount <= 1000) return '501-1000';
    return '1000+';
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    // Remove or hash any PII
    const sanitized = { ...properties };

    // Remove sensitive financial data
    delete sanitized.account_number;
    delete sanitized.sort_code;
    delete sanitized.exact_balance;

    // Hash email addresses if present
    if (sanitized.email) {
      sanitized.email_hash = this.hashEmail(sanitized.email);
      delete sanitized.email;
    }

    return sanitized;
  }
}

// Global analytics instance
export const analytics = new PrivacyFirstAnalytics();
```

### Business Intelligence Dashboard

**Key Metrics Tracked:**
- **User Metrics:** Total users, daily/weekly/monthly active users, retention rates
- **Onboarding Funnel:** Signup to account connection, household creation, first transaction sync
- **Feature Adoption:** Household creation rates, expense rule usage, settlement completion
- **Financial Insights:** Accounts connected by type, transaction volume trends, net worth tracking
- **Technical Performance:** API response times, error rates, uptime monitoring

**Real-Time Analytics Dashboard:**
```typescript
// Interactive dashboard for business insights
export function BusinessDashboard({ userRole }: DashboardProps) {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);

  // Key Performance Indicators
  const kpis = [
    { name: 'Total Users', value: metrics?.userMetrics.totalUsers },
    { name: 'Active Users', value: metrics?.userMetrics.activeUsers.daily },
    { name: 'Households', value: metrics?.featureAdoption.householdCreation.totalHouseholds },
    { name: 'API Performance', value: `${metrics?.technicalMetrics.apiPerformance.averageResponseTime}ms` },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.name}>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-sm text-muted-foreground">{kpi.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onboarding Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Onboarding Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics?.onboardingMetrics.dropoffPoints}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="step" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completionRate" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Data Privacy and Compliance

**GDPR-Compliant Analytics:**
```typescript
// lib/analytics/privacy-compliance.ts
export class AnalyticsPrivacyManager {
  // Automatic data retention management
  async enforceDataRetention() {
    const retentionPeriods = {
      analytics_events: 90, // days
      user_sessions: 30,
      error_logs: 365,
      performance_metrics: 180,
    };

    for (const [table, days] of Object.entries(retentionPeriods)) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      await this.cleanupOldData(table, cutoffDate);
    }
  }

  // User data export for GDPR requests
  async exportUserData(userId: string): Promise<UserDataExport> {
    const analyticsData = await this.getUserAnalyticsEvents(userId);

    return {
      userId,
      exportDate: new Date().toISOString(),
      data: {
        analyticsEvents: this.anonymizeEvents(analyticsData),
        note: 'Financial transaction details excluded for security.',
      },
    };
  }

  // Complete user data deletion
  async deleteUserData(userId: string): Promise<DeletionReport> {
    const tablesAffected = [
      'analytics_events',
      'user_sessions',
      'performance_logs',
      'error_events',
    ];

    const deletionResults: Record<string, number> = {};

    for (const table of tablesAffected) {
      const deletedCount = await this.deleteUserDataFromTable(table, userId);
      deletionResults[table] = deletedCount;
    }

    return {
      userId,
      deletionDate: new Date().toISOString(),
      tablesAffected,
      recordsDeleted: deletionResults,
      status: 'completed',
    };
  }
}
```

**Analytics Benefits:**
- **Privacy-First Design:** Analytics collect business insights without compromising user privacy
- **Real-time Insights:** Live dashboard enables data-driven decision making
- **GDPR Compliance:** Automated data retention and user data export/deletion capabilities
- **Business Value:** Metrics directly tied to PRD success criteria and business goals
- **Technical Performance:** Analytics infrastructure designed not to impact application performance

---

## Architecture Summary

This comprehensive architecture document provides the complete technical foundation for MyFinancePal's AI-driven development. The design prioritizes:

**✅ AI Agent Success:** Simple, well-documented patterns with extensive examples
**✅ Security First:** Database-level privacy controls and comprehensive input validation
**✅ Rapid Development:** Zero-DevOps deployment with managed services
**✅ User Privacy:** Granular sharing controls with household data isolation
**✅ UK Compliance:** GDPR-ready with FCA-compliant financial data handling
**✅ Scalability:** Architecture supports growth from 100 to 100,000+ users

The stack (Next.js + Supabase + MoneyHub + Vercel) maximizes development velocity while maintaining enterprise-grade security and compliance standards required for financial applications.

**Next Steps:**
1. **Setup Development Environment** using the provided scripts and configurations
2. **Begin Epic 1 Implementation** starting with authentication and user management
3. **Implement Core Components** following the established patterns and standards
4. **Deploy to Staging** using the automated CI/CD pipeline
5. **Iterate Based on User Feedback** while maintaining architectural principles

This architecture serves as the single source of truth for all development decisions and will evolve with the product while maintaining its core principles of simplicity, security, and AI agent compatibility.