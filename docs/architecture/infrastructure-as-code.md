# Infrastructure as Code

## Environment Configuration Management

**Vercel Environment Management:**
```typescript
// scripts/setup-environments.ts
import { execSync } from 'child_process';

interface EnvironmentConfig {
  name: string;
  domain?: string;
  variables: Record<string, string>;
  secrets: string[];
}

const environments: EnvironmentConfig[] = [
  {
    name: 'development',
    variables: {
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NODE_ENV: 'development',
    },
    secrets: [
      'SUPABASE_SERVICE_ROLE_KEY',
      'TRUELAYER_CLIENT_SECRET',
      'GOOGLE_CLIENT_SECRET',
    ],
  },
  {
    name: 'staging',
    domain: 'staging.myfinancepal.com',
    variables: {
      NEXT_PUBLIC_APP_URL: 'https://staging.myfinancepal.com',
      NEXT_PUBLIC_SUPABASE_URL: 'https://staging-project.supabase.co',
      NODE_ENV: 'production',
      TRUELAYER_API_URL: 'https://sandbox.api.truelayer.com',
    },
    secrets: [
      'SUPABASE_SERVICE_ROLE_KEY_STAGING',
      'TRUELAYER_CLIENT_SECRET_STAGING',
      'GOOGLE_CLIENT_SECRET',
    ],
  },
  {
    name: 'production',
    domain: 'myfinancepal.com',
    variables: {
      NEXT_PUBLIC_APP_URL: 'https://myfinancepal.com',
      NEXT_PUBLIC_SUPABASE_URL: 'https://prod-project.supabase.co',
      NODE_ENV: 'production',
      TRUELAYER_API_URL: 'https://api.truelayer.com',
    },
    secrets: [
      'SUPABASE_SERVICE_ROLE_KEY_PROD',
      'TRUELAYER_CLIENT_SECRET_PROD',
      'GOOGLE_CLIENT_SECRET',
    ],
  },
];

async function setupEnvironments() {
  console.log('🚀 Setting up Vercel environments...');

  for (const env of environments) {
    console.log(`\n📝 Configuring ${env.name} environment...`);

    // Set environment variables
    for (const [key, value] of Object.entries(env.variables)) {
      try {
        execSync(
          `vercel env add ${key} ${env.name} --value="${value}" --force`,
          { stdio: 'inherit' }
        );
        console.log(`✅ Set ${key} for ${env.name}`);
      } catch (error) {
        console.error(`❌ Failed to set ${key}:`, error.message);
      }
    }
  }
}
```

## Supabase Database Configuration

**Environment-Specific Database Setup:**
```typescript
// supabase/config/environments.ts
interface DatabaseConfig {
  environment: 'development' | 'staging' | 'production';
  projectId: string;
  apiUrl: string;
  features: {
    realtime: boolean;
    auth: boolean;
    storage: boolean;
    edgeFunctions: boolean;
  };
  pooling: {
    enabled: boolean;
    mode: 'transaction' | 'session';
    maxConnections: number;
  };
  rls: {
    enabled: boolean;
    bypassRole?: string;
  };
}

export const databaseConfigs: Record<string, DatabaseConfig> = {
  development: {
    environment: 'development',
    projectId: 'local-dev',
    apiUrl: 'http://localhost:54321',
    features: {
      realtime: true,
      auth: true,
      storage: true,
      edgeFunctions: false,
    },
    pooling: {
      enabled: false,
      mode: 'session',
      maxConnections: 10,
    },
    rls: {
      enabled: true,
      bypassRole: 'service_role',
    },
  },
  staging: {
    environment: 'staging',
    projectId: 'myfinancepal-staging',
    apiUrl: 'https://staging-project.supabase.co',
    features: {
      realtime: true,
      auth: true,
      storage: true,
      edgeFunctions: true,
    },
    pooling: {
      enabled: true,
      mode: 'transaction',
      maxConnections: 50,
    },
    rls: {
      enabled: true,
    },
  },
  production: {
    environment: 'production',
    projectId: 'myfinancepal-prod',
    apiUrl: 'https://prod-project.supabase.co',
    features: {
      realtime: true,
      auth: true,
      storage: true,
      edgeFunctions: true,
    },
    pooling: {
      enabled: true,
      mode: 'transaction',
      maxConnections: 100,
    },
    rls: {
      enabled: true,
    },
  },
};
```

## Automated Deployment Configuration

**GitHub Actions Infrastructure Pipeline:**
```yaml
# .github/workflows/infrastructure.yml
name: Infrastructure Management

on:
  push:
    branches: [main]
    paths: ['infrastructure/**', '.github/workflows/infrastructure.yml']

jobs:
  validate-infrastructure:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Validate environment configs
        run: npm run validate:infrastructure

      - name: Check database migration syntax
        run: npm run validate:migrations

      - name: Verify environment variables
        run: npm run verify:env-vars

  deploy-staging-infrastructure:
    if: github.ref == 'refs/heads/main'
    needs: validate-infrastructure
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy infrastructure changes
        run: npm run deploy:staging-infrastructure
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Run database migrations
        run: npm run migrate:staging

      - name: Verify deployment health
        run: npm run health-check:staging
```

## Configuration Validation and Testing

**Infrastructure Testing:**
- **Environment Validation:** Automated validation of all environment configurations
- **Database Connectivity:** Health checks for all database connections
- **External API Testing:** Verification of TrueLayer and Google API connectivity
- **Deployment Verification:** Post-deployment health checks and rollback capabilities
- **Configuration Drift Detection:** Monitoring for infrastructure configuration changes

**Key Benefits:**
- **Environment Parity:** Consistent configuration across all environments prevents deployment issues
- **Automated Validation:** Infrastructure testing catches configuration errors before deployment
- **Version Control:** All infrastructure configuration stored in Git for change tracking
- **Rollback Capability:** Automated deployment pipeline supports quick rollbacks if issues occur
- **Health Monitoring:** Continuous validation ensures infrastructure remains healthy
