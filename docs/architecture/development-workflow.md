# Development Workflow

## Local Development Setup

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

## Environment Configuration

**Required Environment Variables:**

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend (.env.local)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
TRUELAYER_CLIENT_ID=your_truelayer_client_id
TRUELAYER_CLIENT_SECRET=your_truelayer_client_secret
TRUELAYER_API_URL=https://api.truelayer.com
TRUELAYER_ENVIRONMENT=sandbox

# Authentication
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Encryption (Required for secure token storage)
ENCRYPTION_KEY=your_secure_32_character_encryption_key_here
ENCRYPTION_SALT=your_secure_salt_value_here

# Email service
RESEND_API_KEY=your_resend_api_key

# Cron Jobs
CRON_SECRET=your_secure_cron_secret

# Development
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:54432/postgres
```
