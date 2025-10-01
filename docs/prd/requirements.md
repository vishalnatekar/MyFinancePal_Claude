# Requirements

## Functional Requirements

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

## Non-Functional Requirements

**NFR1:** The system shall maintain 99.5% uptime for all core functionality with automated monitoring and alerting.

**NFR2:** The system shall complete account synchronization within 6 hours of initiation with user progress indicators.

**NFR3:** The system shall load dashboard pages within 2 seconds on standard broadband connections.

**NFR4:** The system shall comply with UK FCA regulations for financial data aggregation and GDPR requirements for data protection.

**NFR5:** The system shall encrypt all financial data at rest using AES-256 encryption and in transit using TLS 1.3.

**NFR6:** The system shall support modern web browsers (Chrome 90+, Safari 14+, Firefox 88+) with responsive design for mobile devices.
