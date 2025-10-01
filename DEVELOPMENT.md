# Development Guide

This guide provides detailed information for developers working on MyFinancePal.

## Quick Start

### Automated Setup
```bash
# Run the automated setup script
npm run setup
```

This script will:
- Copy environment variables template
- Install dependencies
- Set up git hooks
- Initialize local Supabase
- Run health checks

### Manual Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd myfinancepal
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your values
   ```

3. **Initialize git hooks**
   ```bash
   npx simple-git-hooks
   ```

4. **Set up local database**
   ```bash
   supabase start
   npm run db:types
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Daily Development

1. **Start your session**
   ```bash
   npm run health    # Check environment
   npm run dev       # Start dev server
   ```

2. **Before committing**
   ```bash
   npm run check     # Run all quality checks
   ```

3. **Testing**
   ```bash
   npm run test          # Unit tests
   npm run test:watch    # Watch mode
   npm run test:e2e      # E2E tests
   ```

### Code Quality

The project uses several tools to maintain code quality:

- **Biome**: Linting and formatting (replaces ESLint + Prettier)
- **TypeScript**: Type checking
- **Pre-commit hooks**: Automatic quality checks

### Git Workflow

1. **Branch naming convention**
   ```
   feature/add-expense-tracking
   fix/authentication-bug
   chore/update-dependencies
   docs/improve-readme
   ```

2. **Commit message format**
   ```
   feat: add expense splitting functionality
   fix: resolve authentication redirect issue
   docs: update deployment guide
   chore: bump dependencies
   ```

3. **Pull request process**
   - Create feature branch from `main`
   - Make changes and commit
   - Push branch and create PR
   - Ensure all CI checks pass
   - Request review from team members

## Architecture Overview

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Protected routes
│   ├── api/                # API endpoints
│   └── auth/               # Auth pages
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   └── household/          # Feature components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities & config
├── services/               # API client services
├── stores/                 # Zustand stores
├── types/                  # TypeScript types
└── styles/                 # Global styles
```

### Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth + Google OAuth
- **State Management**: Zustand
- **Testing**: Jest, React Testing Library, Playwright
- **Code Quality**: Biome, TypeScript
- **Deployment**: Vercel

## Coding Standards

### File Organization

- Use kebab-case for file names: `create-household.tsx`
- Use PascalCase for components: `CreateHousehold`
- Use camelCase for functions and variables: `createHousehold`
- Group related files in feature directories

### TypeScript Guidelines

- Enable strict mode (already configured)
- No `any` types allowed - use proper typing
- Define interfaces for all component props
- Use type imports: `import type { User } from './types'`

### React Patterns

- Use functional components with hooks
- Prefer composition over inheritance
- Keep components small and focused
- Use custom hooks for complex logic

### State Management

- Use Zustand for global state
- Keep state as close to components as possible
- Use React's built-in state for local component state
- Follow immutable update patterns

### API Development

- Use Zod for input validation
- Implement proper error handling
- Follow RESTful conventions
- Include authentication checks
- Use TypeScript for type safety

### Database Guidelines

- Use Row Level Security (RLS) policies
- Write migrations for schema changes
- Use transactions for multi-table operations
- Optimize queries with proper indexes

## Testing Strategy

### Unit Tests
- Test components in isolation
- Mock external dependencies
- Focus on component behavior
- Aim for 80%+ code coverage

### Integration Tests
- Test API endpoints
- Test database operations
- Test authentication flows
- Use realistic test data

### E2E Tests
- Test critical user journeys
- Test across different browsers
- Test responsive design
- Keep tests maintainable

## Performance Guidelines

### Frontend Performance
- Use Next.js Image component for images
- Implement proper loading states
- Minimize bundle size
- Use React.memo for expensive components

### Backend Performance
- Optimize database queries
- Use database indexes effectively
- Implement proper caching
- Monitor API response times

### Database Performance
- Use connection pooling
- Optimize query patterns
- Monitor slow queries
- Regular database maintenance

## Security Considerations

### Authentication
- Use httpOnly cookies for sessions
- Implement proper CSRF protection
- Validate all user inputs
- Use secure password policies

### Database Security
- Implement Row Level Security
- Use parameterized queries
- Encrypt sensitive data
- Regular security audits

### API Security
- Rate limiting on endpoints
- Input validation with Zod
- Proper error messages (no sensitive info)
- CORS configuration

## Troubleshooting

### Common Issues

1. **Build Errors**
   ```bash
   npm run health    # Check environment
   npm run clean     # Clear caches
   npm install       # Reinstall dependencies
   ```

2. **Database Issues**
   ```bash
   supabase status   # Check local DB
   supabase restart  # Restart local DB
   npm run db:types  # Regenerate types
   ```

3. **Type Errors**
   ```bash
   npm run type-check    # Check for errors
   npm run db:types      # Update DB types
   ```

4. **Test Failures**
   ```bash
   npm run test -- --verbose    # Detailed output
   npm run test -- --watch      # Watch mode
   ```

### Development Tools

- **VS Code Extensions**: TypeScript, Biome, Tailwind CSS
- **Browser DevTools**: React DevTools, Network tab
- **Database Tools**: Supabase Dashboard, pg_admin
- **API Testing**: Thunder Client, Postman

## Debugging

### Frontend Debugging
- Use React DevTools
- Console logging (remove before commit)
- Network tab for API calls
- Performance tab for optimization

### Backend Debugging
- Use Vercel function logs
- Console.log in API routes
- Database query logging
- Error monitoring tools

### Database Debugging
- Use Supabase logs
- SQL query analysis
- Connection monitoring
- Performance metrics

## Contributing

1. **Read the contributing guidelines**
2. **Set up your development environment**
3. **Create a feature branch**
4. **Write tests for your changes**
5. **Ensure all quality checks pass**
6. **Submit a pull request**

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Biome Documentation](https://biomejs.dev)

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and discussions
- **Team Chat**: For immediate help and collaboration
- **Documentation**: Check README and this guide first