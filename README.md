# MyFinancePal

A modern household financial management application built with Next.js, TypeScript, and Supabase.

## Features

- 🏠 **Household Management**: Create and manage multiple households
- 💰 **Expense Tracking**: Track shared expenses and splits
- 👥 **Member Invitations**: Invite family/roommates via email
- 📊 **Balance Calculations**: Automatic balance tracking and settlements
- 🔐 **Secure Authentication**: Google OAuth integration
- 📱 **Responsive Design**: Works on desktop and mobile


## test
## Tech Stack2

- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Next.js API Routes with TypeScript
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with Google OAuth
- **State Management**: Zustand
- **Form Validation**: Zod
- **Code Quality**: Biome (ESLint + Prettier replacement)
- **Testing**: Jest, React Testing Library, Playwright
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for database and auth)
- Google OAuth credentials (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd myfinancepal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

   # Application
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Set up local database**
   ```bash
   # Install Supabase CLI
   npm install -g @supabase/cli

   # Initialize local Supabase
   supabase init
   supabase start

   # Run migrations
   supabase db reset
   ```

5. **Generate database types**
   ```bash
   npm run db:types
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Development Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Biome linting
- `npm run lint:fix` - Fix linting issues
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run check` - Run all quality checks (lint + type + test)

### AI Agent Scripts

- `npm run ai:setup` - Full setup for AI agents (install + types + seed)
- `npm run ai:fresh` - Clean restart (reset DB, regenerate types)

### Database Scripts

- `npm run db:reset` - Reset local Supabase database
- `npm run db:types` - Generate TypeScript types from database
- `npm run db:seed` - Seed database with sample data

## Project Structure

```
myfinancepal/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── api/                # API routes
│   │   ├── auth/               # Authentication pages
│   │   └── globals.css         # Global styles
│   ├── components/             # Reusable React components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── household/          # Household-specific components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions and configurations
│   ├── services/               # API client services
│   ├── stores/                 # Zustand state management
│   ├── styles/                 # Styling files
│   └── types/                  # TypeScript type definitions
├── database/                   # Database schema and migrations
├── tests/                      # Test files
├── supabase/                   # Supabase configuration
└── docs/                       # Documentation
```

## Database Schema

The application uses PostgreSQL with Row Level Security (RLS) policies:

- **profiles**: Extended user information
- **households**: Household/group information
- **household_members**: Junction table for household membership
- **categories**: Expense categories
- **expenses**: Individual expenses
- **expense_splits**: How expenses are split among members
- **settlements**: Payments between users

## Authentication

Authentication is handled by Supabase Auth with Google OAuth integration. Users can sign in with their Google account, and profiles are automatically created.

## Testing

- **Unit Tests**: Jest + React Testing Library for components and utilities
- **API Tests**: Supertest for API endpoint testing
- **E2E Tests**: Playwright for full user workflow testing

Run tests:
```bash
npm run test          # Unit tests
npm run test:watch    # Unit tests in watch mode
npm run test:e2e      # End-to-end tests
```

## Deployment

The application is designed to be deployed on Vercel with Supabase as the backend:

1. **Deploy to Vercel**
   - Connect your GitHub repository
   - Set environment variables in Vercel dashboard
   - Deploy automatically on git push

2. **Set up production database**
   - Create production Supabase project
   - Run migrations in production
   - Update environment variables

## Code Quality

This project uses modern tooling for code quality:

- **Biome**: Ultra-fast linter and formatter (replaces ESLint + Prettier)
- **TypeScript**: Strict type checking enabled
- **Pre-commit hooks**: Automatic linting and type checking before commits

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and commit: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.

