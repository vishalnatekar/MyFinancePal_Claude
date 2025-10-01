# MyFinancePal Product Requirements Document (PRD)

## Goals and Background Context

### Goals
- Enable 10,000+ UK households to automate expense sharing without sacrificing financial privacy
- Provide comprehensive net worth tracking across all account types via third-party aggregation
- Eliminate manual expense reconciliation saving users 2+ hours monthly per household
- Establish privacy-first household finance platform supporting couples, flatmates, and families
- Achieve £50k ARR within 18 months through freemium-to-premium conversion
- Build competitive moat through unique combination of aggregation + household sharing

### Background Context

MyFinancePal addresses a significant gap in the UK personal finance market where existing solutions force users to choose between financial privacy and expense convenience. Current solutions like Lumio only serve couples, while aggregators like Emma lack household features entirely. The combination of mature Open Banking infrastructure and growing demand for shared financial management creates an optimal market opportunity.

The privacy-first approach differentiates MyFinancePal by allowing selective account sharing - partners can collaborate on expenses while maintaining individual investment privacy. This addresses the core tension preventing adoption of existing joint finance solutions.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-22 | 1.0 | Initial PRD creation based on Project Brief | Business Analyst |

## Requirements

### Functional Requirements

**FR1:** The system shall support Google SSO authentication for user registration and login with encrypted token storage.

**FR2:** The system shall integrate with Yodlee/Plaid APIs to aggregate bank accounts, investment accounts, and supported broker accounts with OAuth authentication flows.

**FR3:** The system shall provide manual account entry functionality for institutions not supported by third-party aggregators.

**FR4:** The system shall calculate and display individual net worth across all connected accounts with historical tracking over time.

**FR5:** The system shall enable household creation where users can invite partners/flatmates via email with accept/decline functionality.

**FR6:** The system shall provide granular account sharing controls where users select which accounts are visible to household members.

**FR7:** The system shall implement configurable expense splitting rules based on merchant names, transaction categories, and amount thresholds.

**FR8:** The system shall automatically categorize transactions as "shared" or "personal" based on user-defined rules with manual override capability.

**FR9:** The system shall calculate monthly settlement amounts showing who owes whom within each household.

**FR10:** The system shall provide settlement tracking with manual "mark as settled" functionality and settlement history.

**FR11:** The system shall send notifications when household members make shared expense transactions.

**FR12:** The system shall provide separate dashboard views for "Individual Finances" and "Household View" with appropriate privacy filtering.

### Non-Functional Requirements

**NFR1:** The system shall maintain 99.5% uptime for all core functionality with automated monitoring and alerting.

**NFR2:** The system shall complete account synchronization within 6 hours of initiation with user progress indicators.

**NFR3:** The system shall load dashboard pages within 2 seconds on standard broadband connections.

**NFR4:** The system shall comply with UK FCA regulations for financial data aggregation and GDPR requirements for data protection.

**NFR5:** The system shall encrypt all financial data at rest using AES-256 encryption and in transit using TLS 1.3.

**NFR6:** The system shall support modern web browsers (Chrome 90+, Safari 14+, Firefox 88+) with responsive design for mobile devices.

## User Interface Design Goals

### Overall UX Vision
Clean, trustworthy interface that prioritizes financial data clarity and privacy controls. The design should feel secure and professional while remaining approachable for everyday users. Emphasis on progressive disclosure - show simple overviews first, detailed data on demand. Privacy-first design with clear visual indicators of what's shared vs private.

### Key Interaction Paradigms
- **Tab-based navigation** between "My Finances" and "Household" views to maintain privacy separation
- **One-click sharing controls** with clear toggle states for account visibility
- **Rule-based automation setup** through guided workflows rather than complex configuration
- **Progressive onboarding** starting with single account connection, expanding gradually
- **Notification-driven transparency** keeping household members informed of shared expenses

### Core Screens and Views
- **Dashboard (Individual)** - Net worth overview, account summaries, recent transactions
- **Dashboard (Household)** - Shared expenses, settlement status, household member activity
- **Account Management** - Connect accounts, sharing controls, sync status
- **Expense Rules** - Configure splitting rules, merchant categorization, splitting percentages
- **Settlement Center** - Current balances, settlement history, mark-as-paid functionality
- **Account Connection Flow** - Google SSO, Yodlee OAuth, manual entry fallback

### Accessibility: WCAG AA
Ensure compliance with WCAG AA standards including keyboard navigation, screen reader support, and sufficient color contrast ratios for financial data readability.

### Branding
Clean, modern financial technology aesthetic. Trustworthy color palette emphasizing security (blues, grays) with accent colors for positive actions (greens for settlements, gentle notifications). Minimal visual complexity to focus attention on financial data accuracy.

### Target Device and Platforms: Web Responsive
Mobile-first responsive design optimized for smartphones and tablets, with enhanced desktop experience. Progressive Web App capabilities for app-like mobile experience without native app complexity.

## Technical Assumptions

### Repository Structure: Monorepo
Single repository containing frontend and backend packages with shared utilities. Enables coordinated deployments and shared component libraries while maintaining clear separation between services.

### Service Architecture
**Monolithic backend** initially with well-defined internal service boundaries for future extraction. Core services include: Authentication Service, Account Aggregation Service, Household Management Service, Expense Splitting Engine, and Settlement Tracking Service. This approach reduces operational complexity while maintaining clean architecture for scaling.

### Testing Requirements
**Unit + Integration Testing** with focus on financial calculation accuracy and API integration reliability. Automated testing for expense splitting rules, settlement calculations, and data aggregation flows. Manual testing for OAuth flows and third-party API edge cases.

### Additional Technical Assumptions and Requests

- **Frontend Framework:** React with Next.js for SSR capabilities and SEO optimization, TypeScript for type safety
- **Backend Technology:** Node.js with Express framework for rapid development and JavaScript ecosystem consistency
- **Database:** PostgreSQL for transactional integrity with Redis for session management and caching
- **Authentication:** Google OAuth 2.0 integration with JWT token management
- **Third-party Integration:** Yodlee or Plaid SDK for financial data aggregation with fallback manual entry
- **Hosting:** AWS or Vercel deployment with UK data residency for compliance
- **Security:** AES-256 encryption at rest, TLS 1.3 in transit, secure API key management
- **Monitoring:** Application performance monitoring and error tracking for financial data accuracy
- **API Design:** RESTful APIs with OpenAPI documentation for future integration possibilities

## Epic List

**Epic 1: Foundation & Authentication Infrastructure**
Establish project setup with Google SSO authentication, basic user management, and core infrastructure that delivers a working authenticated application.

**Epic 2: Individual Account Aggregation & Net Worth Tracking**
Implement Yodlee/Plaid integration for account connections and individual financial dashboard with net worth calculations.

**Epic 3: Household Management & Privacy Controls**
Enable household creation, member invitation system, and granular sharing controls for selective account visibility.

**Epic 4: Expense Splitting & Settlement Tracking**
Build the core differentiating feature - configurable expense splitting rules, automated categorization, and settlement calculation with tracking.

## Epic 1: Foundation & Authentication Infrastructure

**Goal:** Establish a secure, production-ready foundation with Google SSO authentication, basic user management, and deployment infrastructure. This epic delivers a functional authenticated web application that validates the core technical stack and provides the platform for all future features.

### Story 1.1: Project Setup and Development Environment

As a developer,
I want a properly configured development environment with CI/CD pipeline,
so that I can develop features efficiently with automated testing and deployment.

**Acceptance Criteria:**
1. Monorepo structure established with frontend (Next.js/React) and backend (Node.js/Express) packages
2. TypeScript configuration across both frontend and backend
3. PostgreSQL database setup with migration scripts
4. Redis configuration for session management
5. ESLint and Prettier configuration for code quality
6. Git repository with initial commit and branch protection rules
7. Basic CI/CD pipeline for automated testing and deployment
8. Environment configuration for development, staging, and production

### Story 1.2: Google SSO Authentication Implementation

As a user,
I want to sign up and log in using my Google account,
so that I can access the application securely without creating new passwords.

**Acceptance Criteria:**
1. Google OAuth 2.0 integration configured with proper scopes
2. "Sign in with Google" button prominently displayed on landing page
3. Successful authentication creates user record in database
4. JWT token generation and secure storage in httpOnly cookies
5. Session management with automatic token refresh
6. Logout functionality that clears all authentication tokens
7. Error handling for OAuth failures and network issues
8. Redirect to appropriate page after successful authentication

### Story 1.3: Basic User Profile and Dashboard

As a authenticated user,
I want to see my profile information and a basic dashboard,
so that I can confirm my account is working and navigate the application.

**Acceptance Criteria:**
1. User profile page displaying Google account information (name, email)
2. Basic dashboard layout with navigation structure
3. Secure route protection - unauthenticated users redirected to login
4. User session persistence across browser sessions
5. Responsive design working on mobile and desktop
6. Basic navigation menu with placeholder links for future features
7. "My Finances" and "Household" tab structure established
8. User can update basic preferences (email notifications, timezone)

## Epic 2: Individual Account Aggregation & Net Worth Tracking

**Goal:** Implement financial account aggregation using Yodlee/Plaid APIs and create a comprehensive individual dashboard with net worth tracking. This epic delivers the core financial value proposition for individual users before adding household complexity.

### Story 2.1: Yodlee/Plaid Integration Setup

As a user,
I want to connect my bank and investment accounts securely,
so that I can see all my financial data in one place.

**Acceptance Criteria:**
1. Yodlee/Plaid SDK integrated with proper API credentials and sandbox testing
2. OAuth flow for bank connections initiated from "Connect Account" button
3. Institution search functionality allowing users to find their banks/brokers
4. Secure token storage for account connections with encryption
5. Account connection status displayed with sync indicators
6. Error handling for failed connections with user-friendly messages
7. Manual entry fallback form for unsupported institutions
8. Account connection testing with at least 3 major UK banks
9. Data aggregation service running every 6 hours with progress indicators

### Story 2.2: Account Data Processing and Storage

As a user,
I want my account data to be accurately processed and stored,
so that I can trust the financial information displayed.

**Acceptance Criteria:**
1. Raw API data transformed into unified internal data model
2. Account balances, transaction history, and holdings properly parsed
3. Data validation rules ensuring financial data accuracy
4. Duplicate transaction detection and handling
5. Currency normalization for multi-currency accounts
6. Account categorization (checking, savings, investment, credit)
7. Historical data preservation for trend analysis
8. Data encryption at rest using AES-256
9. Automated data sync scheduling with manual refresh option

### Story 2.3: Individual Net Worth Dashboard

As a user,
I want to see my complete net worth across all accounts,
so that I can understand my overall financial position.

**Acceptance Criteria:**
1. Net worth calculation including all connected accounts (assets minus liabilities)
2. Account breakdown showing individual account balances
3. Asset categorization (cash, investments, property, other)
4. Historical net worth chart showing trends over time
5. Account sync status indicators (last updated, next sync)
6. Responsive design optimized for mobile viewing
7. Loading states and error handling for failed syncs
8. Account management section for adding/removing connections
9. Data export functionality for personal record keeping

### Story 2.4: Transaction History and Categorization

As a user,
I want to view and search my transaction history,
so that I can track my spending and identify patterns.

**Acceptance Criteria:**
1. Transaction list with pagination and infinite scroll
2. Search functionality by merchant, amount, date range
3. Basic transaction categorization (groceries, utilities, entertainment)
4. Transaction filtering by account, category, date range
5. Transaction detail view with merchant information
6. Manual transaction editing for corrections
7. Transaction export to CSV for analysis
8. Performance optimization for large transaction datasets
9. Mobile-friendly transaction browsing interface

## Epic 3: Household Management & Privacy Controls

**Goal:** Enable household creation with privacy-first sharing controls where users can selectively share accounts with household members. This epic delivers the foundational household infrastructure while preserving individual financial privacy.

### Story 3.1: Household Creation and Invitation System

As a user,
I want to create a household and invite my partner/flatmates,
so that we can start managing shared expenses together.

**Acceptance Criteria:**
1. Household creation flow with household name and description
2. Email invitation system for adding household members
3. Invitation acceptance/decline workflow with email notifications
4. Household member list with roles (creator, member)
5. Household settings page for managing basic information
6. Leave household functionality with data cleanup
7. Maximum household size limits (e.g., 6 members for performance)
8. Household invitation expiry and resend functionality
9. Email templates for invitations and household updates

### Story 3.2: Account Sharing Privacy Controls

As a user,
I want to control which of my accounts are visible to household members,
so that I can share relevant information while maintaining privacy.

**Acceptance Criteria:**
1. Account sharing toggle for each connected account (visible/private)
2. Clear visual indicators showing which accounts are shared
3. Shared account data visible in household members' "Household View"
4. Privacy controls persist across account syncs and updates
5. Bulk sharing controls for multiple accounts
6. Account sharing history and audit log
7. Warning prompts when sharing sensitive account types
8. Shared account balance updates reflected in household view
9. Granular sharing (balance only vs full transaction history)

### Story 3.3: Household Dashboard and Shared View

As a household member,
I want to see shared financial information from all household members,
so that I can understand our collective financial situation.

**Acceptance Criteria:**
1. Household dashboard showing combined shared account balances
2. Individual household member contribution summaries
3. Shared net worth calculation (only shared accounts)
4. Account ownership clearly labeled (whose account is whose)
5. Household member activity feed for transparency
6. Shared account sync status across all members
7. Household financial timeline showing major changes
8. Mobile-optimized household view with clear navigation
9. Data refresh controls for household-wide account sync

### Story 3.4: Household Notification System

As a household member,
I want to receive notifications about household financial activity,
so that I stay informed about shared expenses and account changes.

**Acceptance Criteria:**
1. Real-time notifications when household members add new shared accounts
2. Email notifications for large shared transactions (configurable threshold)
3. Weekly household summary emails with key financial updates
4. Notification preferences per household member
5. In-app notification center with notification history
6. Push notifications for urgent household financial events
7. Notification batching to avoid spam during bulk account syncs
8. Household member join/leave notifications
9. Privacy-respecting notifications (no sensitive account details)

## Epic 4: Expense Splitting & Settlement Tracking

**Goal:** Implement the core differentiating feature - configurable expense splitting rules with automated transaction categorization and settlement tracking. This epic transforms MyFinancePal from an aggregator into a household expense management platform.

### Story 4.1: Expense Splitting Rules Engine

As a household member,
I want to configure rules for automatically splitting shared expenses,
so that I don't have to manually categorize every transaction.

**Acceptance Criteria:**
1. Rule creation interface for merchant-based splitting ("All Tesco = shared")
2. Category-based rules (utilities, groceries) with configurable percentages
3. Amount threshold rules for high-value transactions
4. Default splitting percentages (50/50, custom ratios)
5. Rule priority system when multiple rules match a transaction
6. Bulk rule application to historical transactions
7. Rule templates for common household scenarios
8. Rule testing interface showing which transactions would match
9. Household-wide rule visibility and collaboration

### Story 4.2: Automatic Transaction Categorization

As a household member,
I want transactions to be automatically categorized as shared or personal,
so that expense splitting happens without manual intervention.

**Acceptance Criteria:**
1. Real-time transaction processing using configured rules
2. Clear visual indicators for shared vs personal transactions
3. Manual override capability for incorrectly categorized transactions
4. Transaction splitting preview before final categorization
5. Batch categorization for importing historical data
6. Split transaction support (partially shared expenses)
7. Uncategorized transaction queue for review
8. Category confidence scoring and user feedback loop
9. Performance optimization for high-volume transaction processing

### Story 4.3: Settlement Calculation and Tracking

As a household member,
I want to see who owes money to whom for shared expenses,
so that we can settle up fairly at the end of each month.

**Acceptance Criteria:**
1. Real-time settlement balance calculation between household members
2. Monthly settlement summaries with detailed breakdowns
3. Settlement history showing past settlements and payments
4. "Mark as settled" functionality for recording offline payments
5. Settlement reminders and notifications for overdue amounts
6. Export settlement summaries for record keeping
7. Settlement dispute resolution workflow
8. Multi-party settlement optimization (A owes B, B owes C scenarios)
9. Settlement verification with both parties confirming payment

### Story 4.4: Settlement Center and Payment Tracking

As a household member,
I want a dedicated area to manage all settlement activities,
so that I can easily track and resolve outstanding amounts.

**Acceptance Criteria:**
1. Centralized settlement dashboard showing all current balances
2. Settlement action center with payment reminders and requests
3. Settlement timeline showing payment history and upcoming dues
4. Settlement analytics showing spending patterns and fairness metrics
5. Custom settlement notes and payment references
6. Settlement calendar integration for payment due dates
7. Household settlement reports for transparency
8. Settlement goal setting and progress tracking
9. Integration with popular UK payment methods (bank transfer references)

## Next Steps

### UX Expert Prompt
Review this PRD and create comprehensive UI/UX designs for MyFinancePal focusing on the privacy-first household financial management approach. Prioritize the "Individual" vs "Household" navigation paradigm and ensure sharing controls are intuitive and trustworthy.

### Architect Prompt
Using this PRD as foundation, create the technical architecture for MyFinancePal including database schema, API specifications, and deployment architecture. Focus on the monorepo structure with React/Next.js frontend and Node.js backend, emphasizing security for financial data and scalable aggregation services.