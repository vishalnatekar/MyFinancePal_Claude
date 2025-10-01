# External APIs

MyFinancePal requires several external API integrations:

## TrueLayer API

- **Purpose:** UK banking data aggregation and payment initiation services
- **Documentation:** https://docs.truelayer.com/
- **Base URL:** `https://api.truelayer.com`
- **Authentication:** OAuth 2.0 with client credentials and user authorization
- **Rate Limits:** Generous limits for banking data and payments
- **Pricing:** Pay-as-you-go model (~£0.10-0.20 per connection, 1-2% per payment)

**Key Endpoints Used:**
- **Data API:**
  - `POST /auth/token` - Get access token
  - `GET /data/v1/accounts` - Retrieve user bank accounts
  - `GET /data/v1/accounts/{account_id}/transactions` - Fetch transaction history
  - `GET /auth/providers` - List supported UK banks
- **Payments API:**
  - `POST /payments/v3/payment-requests` - Initiate bank transfer
  - `GET /payments/v3/payment-requests/{id}` - Get payment status

**Integration Notes:** Excellent UK bank coverage including Monzo, Starling, Barclays, HSBC, and all major traditional banks. Strong payment initiation capabilities for household transfers. PAYG pricing model ideal for startups.

## Future Investment Broker Integration

- **Purpose:** Investment platform data aggregation (to be added in future phases)
- **Potential Providers:** Yodlee, Plaid, or Salt Edge
- **Current Approach:** Manual account entry with upgrade path to automated integration
- **Coverage Needed:** Hargreaves Lansdown, AJ Bell, Interactive Investor, Trading 212

## Google OAuth API

- **Purpose:** User authentication and profile data retrieval
- **Documentation:** https://developers.google.com/identity/protocols/oauth2
- **Base URL:** `https://oauth2.googleapis.com`
- **Authentication:** OAuth 2.0 with client credentials

## Supabase APIs (Managed Services)

- **Purpose:** Database, authentication, real-time subscriptions, and file storage
- **Documentation:** https://supabase.com/docs
- **Base URL:** `https://[project-id].supabase.co`
