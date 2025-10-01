# Technical Assumptions

## Repository Structure: Monorepo
Single repository containing frontend and backend packages with shared utilities. Enables coordinated deployments and shared component libraries while maintaining clear separation between services.

## Service Architecture
**Monolithic backend** initially with well-defined internal service boundaries for future extraction. Core services include: Authentication Service, Account Aggregation Service, Household Management Service, Expense Splitting Engine, and Settlement Tracking Service. This approach reduces operational complexity while maintaining clean architecture for scaling.

## Testing Requirements
**Unit + Integration Testing** with focus on financial calculation accuracy and API integration reliability. Automated testing for expense splitting rules, settlement calculations, and data aggregation flows. Manual testing for OAuth flows and third-party API edge cases.

## Additional Technical Assumptions and Requests

- **Frontend Framework:** React with Next.js for SSR capabilities and SEO optimization, TypeScript for type safety
- **Backend Technology:** Node.js with Express framework for rapid development and JavaScript ecosystem consistency
- **Database:** PostgreSQL for transactional integrity with Redis for session management and caching
- **Authentication:** Google OAuth 2.0 integration with JWT token management
- **Third-party Integration:** Yodlee or Plaid SDK for financial data aggregation with fallback manual entry
- **Hosting:** AWS or Vercel deployment with UK data residency for compliance
- **Security:** AES-256 encryption at rest, TLS 1.3 in transit, secure API key management
- **Monitoring:** Application performance monitoring and error tracking for financial data accuracy
- **API Design:** RESTful APIs with OpenAPI documentation for future integration possibilities
