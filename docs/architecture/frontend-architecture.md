# Frontend Architecture

## Component Architecture

**Component Organization:**
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── forms/          # Form components with validation
│   ├── charts/         # Financial data visualizations
│   └── layout/         # Navigation, headers, footers
├── app/                # Next.js 14 App Router pages
│   ├── (auth)/         # Authentication pages
│   ├── dashboard/      # Individual dashboard
│   ├── household/      # Household management
│   └── settings/       # User preferences
├── hooks/              # Custom React hooks
├── stores/             # Zustand state management
├── services/           # API client services
├── lib/                # Utilities and configurations
└── types/              # TypeScript interfaces
```

**Component Template (AI Agent Pattern):**
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ComponentNameProps {
  // Clear prop types for AI agents
  userId: string;
  onAction?: (data: SomeType) => void;
}

export function ComponentName({ userId, onAction }: ComponentNameProps) {
  const [loading, setLoading] = useState(false);

  // Clear, single-responsibility functions
  const handleAction = async () => {
    setLoading(true);
    try {
      // AI agents implement business logic here
      const result = await someService.performAction(userId);
      onAction?.(result);
    } catch (error) {
      console.error('Action failed:', error);
      // Error handling pattern AI agents can follow
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clear Component Purpose</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleAction} disabled={loading}>
          {loading ? 'Loading...' : 'Action'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

## State Management Architecture

**State Structure:**
```typescript
// Global state with Zustand (AI-friendly patterns)
interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;

  // Households state
  households: Household[];
  activeHousehold: string | null;
  setHouseholds: (households: Household[]) => void;
  setActiveHousehold: (id: string | null) => void;

  // Financial data state
  accounts: FinancialAccount[];
  transactions: Transaction[];
  setAccounts: (accounts: FinancialAccount[]) => void;
  setTransactions: (transactions: Transaction[]) => void;

  // UI state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}
```

## Routing Architecture

**Route Organization (Next.js 14 App Router):**
```
app/
├── page.tsx                    # Landing page
├── dashboard/
│   ├── page.tsx               # Individual dashboard
│   └── layout.tsx             # Dashboard layout
├── household/
│   ├── [id]/
│   │   ├── page.tsx          # Household dashboard
│   │   ├── members/page.tsx   # Member management
│   │   ├── rules/page.tsx     # Splitting rules
│   │   └── settlements/page.tsx # Settlement center
│   └── create/page.tsx        # Create household
├── accounts/
│   ├── page.tsx              # Account list
│   ├── connect/page.tsx      # TrueLayer connection
│   └── [id]/page.tsx         # Account details
├── settings/
│   ├── page.tsx              # User preferences
│   └── privacy/page.tsx      # Privacy controls
└── auth/
    ├── login/page.tsx        # Login page
    └── callback/page.tsx     # OAuth callback
```

## Frontend Services Layer

**API Client Setup:**
```typescript
// Unified API client for AI agents
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // AI agents implement these service methods
  async getAccounts(): Promise<FinancialAccount[]> {
    return this.request<FinancialAccount[]>('/accounts');
  }

  async createHousehold(data: CreateHouseholdRequest): Promise<Household> {
    return this.request<Household>('/households', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
```
