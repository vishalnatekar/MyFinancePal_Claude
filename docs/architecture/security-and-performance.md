# Security and Performance

## Security Requirements

**Frontend Security:**
- **CSP Headers:** `default-src 'self'; script-src 'self' 'unsafe-inline' vercel.live; connect-src 'self' *.supabase.co *.truelayer.com; img-src 'self' data: *.googleusercontent.com`
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

## Performance Optimization

**Frontend Performance:**
- **Bundle Size Target:** < 250KB initial bundle, < 1MB total assets
- **Loading Strategy:** Lazy loading for routes, dynamic imports for heavy components
- **Caching Strategy:** Aggressive caching of static assets (1 year), API responses (5 minutes)

**Backend Performance:**
- **Response Time Target:** < 200ms for dashboard APIs, < 500ms for complex queries
- **Database Optimization:** Strategic indexes on user_id, household_id, date columns
- **Caching Strategy:** Redis for session data, Vercel edge caching for static responses
