# Deployment Guide

This document outlines the deployment process for MyFinancePal using Vercel and GitHub Actions.

## Prerequisites

1. **GitHub Repository**: Code must be in a GitHub repository
2. **Vercel Account**: Connected to your GitHub account
3. **Supabase Project**: For production database
4. **Google OAuth**: Production OAuth credentials

## Environment Setup

### 1. Vercel Project Setup

1. Connect your GitHub repository to Vercel
2. Import the project and configure build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm ci`
   - **Development Command**: `npm run dev`

### 2. Environment Variables

Configure these environment variables in Vercel:

#### Production Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

#### Preview Environment Variables
Same as production but with staging Supabase project and OAuth credentials.

### 3. GitHub Secrets

Configure these secrets in your GitHub repository settings:

```bash
# Vercel deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Optional: Codecov token for test coverage
CODECOV_TOKEN=your_codecov_token
```

## Deployment Workflow

### Automatic Deployments

1. **Production Deployment**:
   - Triggered on push to `main` branch
   - Runs full CI/CD pipeline (lint, test, build, deploy)
   - Deploys to production Vercel environment

2. **Preview Deployments**:
   - Triggered on pull requests
   - Creates preview deployment for testing
   - Runs quality checks and tests

### Manual Deployment

You can also deploy manually using Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Branch Protection Rules

Configure these branch protection rules for the `main` branch:

1. **Require pull request reviews before merging**
2. **Require status checks to pass before merging**:
   - `test (18.x)`
   - `test (20.x)`
   - `e2e-test`
   - `security-audit`
3. **Require branches to be up to date before merging**
4. **Include administrators** in protection rules
5. **Allow force pushes**: Disabled
6. **Allow deletions**: Disabled

## CI/CD Pipeline Stages

### 1. Quality Checks
- Linting (Biome)
- Type checking (TypeScript)
- Unit tests (Jest)
- Build verification

### 2. E2E Testing
- Playwright tests across multiple browsers
- Cross-device testing (desktop, mobile)

### 3. Security Audit
- npm audit for known vulnerabilities
- audit-ci for CI/CD specific security checks

### 4. Deployment
- Automatic deployment to Vercel on main branch
- Preview deployments for pull requests

## Monitoring and Observability

### Vercel Analytics
- Automatic performance monitoring
- Real user metrics
- Core web vitals tracking

### Error Tracking
- Vercel provides basic error tracking
- Consider integrating Sentry for production

### Database Monitoring
- Supabase provides built-in database monitoring
- Query performance metrics
- Connection monitoring

## Rollback Strategy

### Automatic Rollbacks
- Vercel automatically keeps previous deployments
- Can rollback instantly through Vercel dashboard

### Manual Rollbacks
```bash
# List deployments
vercel ls

# Promote a previous deployment
vercel promote <deployment-url>
```

## Environment-Specific Configuration

### Development
- Local Supabase instance
- Local environment variables
- Hot reload enabled

### Staging/Preview
- Staging Supabase project
- Preview environment variables
- Production-like environment

### Production
- Production Supabase project
- Production environment variables
- Optimized build

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables are set correctly
   - Verify all dependencies are in package.json
   - Check TypeScript compilation errors

2. **Database Connection Issues**
   - Verify Supabase environment variables
   - Check database migrations are applied
   - Validate RLS policies

3. **Authentication Issues**
   - Check Google OAuth configuration
   - Verify redirect URLs match deployment URL
   - Validate OAuth credentials

### Debugging

1. **Vercel Logs**: Check deployment logs in Vercel dashboard
2. **Function Logs**: Monitor API route execution logs
3. **Build Logs**: Review build process for errors

## Security Considerations

1. **Environment Variables**: Never commit secrets to repository
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure proper CORS policies
4. **Rate Limiting**: Implement API rate limiting
5. **Database Security**: Use RLS policies and proper permissions

## Performance Optimization

1. **Caching**: Leverage Vercel's edge caching
2. **Image Optimization**: Use Next.js Image component
3. **Bundle Analysis**: Regular bundle size monitoring
4. **Database Optimization**: Optimize queries and indexes