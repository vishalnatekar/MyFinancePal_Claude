# Coding Standards

## Critical Fullstack Rules

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

## Naming Conventions

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
