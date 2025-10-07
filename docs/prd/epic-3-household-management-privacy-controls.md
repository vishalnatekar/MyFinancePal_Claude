# Epic 3: Household Management & Privacy Controls

**Goal:** Enable household creation with privacy-first sharing controls where users can selectively share accounts with household members. This epic delivers the foundational household infrastructure while preserving individual financial privacy.

## Story 3.1: Household Creation and Invitation System

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
7. Household invitation expiry and resend functionality
8. Email templates for invitations and household updates

## Story 3.2: Account Sharing Privacy Controls

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

## Story 3.3: Household Dashboard and Shared View

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

## Story 3.4: Household Notification System

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
