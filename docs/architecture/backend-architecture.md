# Backend Architecture

## Service Architecture

**Function Organization:**
```
app/api/
├── auth/
│   └── callback/route.ts      # OAuth callback handler
├── user/
│   └── profile/route.ts       # User profile management
├── accounts/
│   ├── route.ts              # GET/POST accounts
│   ├── [id]/
│   │   ├── route.ts          # Account details
│   │   └── sharing/route.ts   # Update sharing settings
│   └── connect/route.ts       # TrueLayer connection
├── households/
│   ├── route.ts              # GET/POST households
│   └── [id]/
│       ├── route.ts          # Household details
│       ├── invite/route.ts    # Member invitations
│       ├── members/route.ts   # Member management
│       └── rules/route.ts     # Splitting rules
├── transactions/
│   ├── route.ts              # GET transactions
│   ├── [id]/
│   │   └── categorize/route.ts # Override categorization
│   └── sync/route.ts          # Trigger TrueLayer sync
└── dashboard/
    ├── individual/route.ts    # Personal dashboard
    └── household/
        └── [id]/route.ts      # Household dashboard
```

**Function Template (AI Agent Pattern):**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Input validation schema for AI agents
const CreateHouseholdSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  settlement_day: z.number().min(1).max(31).default(1),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication (standard pattern for AI agents)
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Input validation (Zod pattern AI agents understand)
    const body = await request.json();
    const validatedData = CreateHouseholdSchema.parse(body);

    // 3. Business logic (clear, single responsibility)
    const { data: household, error } = await supabase
      .from('households')
      .insert({
        ...validatedData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create household' }, { status: 500 });
    }

    // 4. Add creator as member
    await supabase
      .from('household_members')
      .insert({
        household_id: household.id,
        user_id: user.id,
        role: 'creator',
      });

    // 5. Return success response
    return NextResponse.json(household, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Retry Strategies and Circuit Breaker Patterns

**Exponential Backoff for External APIs:**
```typescript
// TrueLayer API client with retry logic
export class TrueLayerClient {
  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken()}`,
            ...options.headers,
          },
        });

        if (response.ok) {
          return response.json();
        }

        // Don't retry on client errors (400-499)
        if (response.status >= 400 && response.status < 500) {
          throw new ExternalServiceError(
            'TrueLayer',
            `Client error: ${response.status}`
          );
        }

        // Retry on server errors (500+) or network issues
        throw new Error(`Server error: ${response.status}`);

      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new ExternalServiceError('TrueLayer', lastError.message);
  }
}
```

**Circuit Breaker for Service Protection:**
```typescript
// Circuit breaker to protect against cascading failures
export class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold = 5,      // Failures before opening
    private timeout = 60000,    // 1 minute timeout
    private resetTime = 30000   // 30 seconds to try again
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.resetTime) {
        this.state = 'HALF_OPEN';
      } else {
        throw new ExternalServiceError(
          'Service',
          'Circuit breaker is OPEN - service temporarily unavailable'
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage in TrueLayer service
const trueLayerCircuitBreaker = new CircuitBreaker();

export async function syncUserAccounts(userId: string) {
  try {
    return await trueLayerCircuitBreaker.execute(async () => {
      return await trueLayerClient.getAccounts(userId);
    });
  } catch (error) {
    // Graceful degradation - show cached data
    return await getCachedAccounts(userId);
  }
}
```

## User-Friendly Error Messages

**Error Message Mapping:**
```typescript
// User-friendly error messages for common scenarios
const ERROR_MESSAGES = {
  NETWORK_ERROR: {
    title: 'Connection Problem',
    message: 'Please check your internet connection and try again.',
    action: 'Retry',
  },
  EXTERNAL_SERVICE_ERROR: {
    title: 'Temporary Service Issue',
    message: 'We\'re having trouble connecting to your bank. This usually resolves quickly.',
    action: 'Try Again Later',
  },
  VALIDATION_ERROR: {
    title: 'Invalid Information',
    message: 'Please check the information you entered and try again.',
    action: 'Fix and Retry',
  },
  UNAUTHORIZED: {
    title: 'Session Expired',
    message: 'Please sign in again to continue.',
    action: 'Sign In',
  },
  RATE_LIMIT_ERROR: {
    title: 'Too Many Requests',
    message: 'Please wait a moment before trying again.',
    action: 'Wait and Retry',
  },
} as const;

// Error display component
export function ErrorAlert({ error }: { error: ApiClientError }) {
  const errorConfig = ERROR_MESSAGES[error.code] || ERROR_MESSAGES.NETWORK_ERROR;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{errorConfig.title}</AlertTitle>
      <AlertDescription className="mt-2">
        {errorConfig.message}
        {error.isRetryable && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            {errorConfig.action}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

## Database Architecture

**Data Access Layer (Repository Pattern):**
```typescript
// Service layer for AI agents to implement
export class HouseholdRepository {
  constructor(private supabase: SupabaseClient) {}

  async findUserHouseholds(userId: string): Promise<Household[]> {
    const { data, error } = await this.supabase
      .from('households')
      .select(`
        *,
        household_members!inner(role),
        _count:household_members(count)
      `)
      .eq('household_members.user_id', userId);

    if (error) throw new Error(`Failed to fetch households: ${error.message}`);
    return data || [];
  }

  async createHousehold(data: CreateHouseholdData): Promise<Household> {
    const { data: household, error } = await this.supabase
      .from('households')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to create household: ${error.message}`);
    return household;
  }
}
```

## Authentication and Authorization

**Auth Middleware (AI Agent Implementation):**
```typescript
// Reusable auth utility for AI agents
export async function authenticateRequest(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Authentication required');
  }

  return { user, supabase };
}

// Usage in API routes
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    // Protected logic here
    const data = await supabase
      .from('some_table')
      .select('*');

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
```
