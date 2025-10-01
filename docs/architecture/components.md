# Components

Based on our Next.js + Supabase architecture, here are the major logical components across the fullstack:

## Frontend Application (Next.js Web App)

**Responsibility:** User interface, client-side routing, state management, and API communication

**Key Interfaces:**
- React components using shadcn/ui design system
- Zustand stores for client state management
- Supabase client for real-time subscriptions
- API service layer for backend communication

**Dependencies:** Supabase Auth, Backend API, External Auth Providers

**Technology Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand

## Authentication Service

**Responsibility:** User authentication, session management, and OAuth integration with Google

**Key Interfaces:**
- OAuth callback handling
- JWT token validation middleware
- User session persistence
- Protected route enforcement

**Dependencies:** Google OAuth APIs, Supabase Auth

**Technology Stack:** Supabase Auth (managed service), Next.js API routes for callbacks

## Account Aggregation Service

**Responsibility:** Financial data synchronization, TrueLayer integration, and account management

**Key Interfaces:**
- TrueLayer integration
- Scheduled account synchronization
- Transaction data processing and normalization
- Account connection status management

**Dependencies:** TrueLayer API, Database, Transaction Processing Service

**Technology Stack:** Next.js API routes, TrueLayer SDK, PostgreSQL

## Household Management Service

**Responsibility:** Household creation, member invitations, and privacy controls

**Dependencies:** Email Service, User Service, Database

**Technology Stack:** Next.js API routes, Supabase database, Email integration

## Expense Splitting Engine

**Responsibility:** Automated transaction categorization and expense splitting calculations

**Dependencies:** Transaction data, Household rules, Database

**Technology Stack:** Next.js API routes, PostgreSQL, Background processing

## Database Layer (Supabase)

**Responsibility:** Data persistence, Row Level Security enforcement, and real-time subscriptions

**Technology Stack:** Supabase PostgreSQL, Row Level Security, Real-time engine
