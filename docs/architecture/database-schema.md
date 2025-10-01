# Database Schema

Here's the complete PostgreSQL schema with Row Level Security policies:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Users table (managed by Supabase Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  notification_preferences JSONB DEFAULT '{
    "email_notifications": true,
    "shared_expense_alerts": true,
    "settlement_reminders": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,

  PRIMARY KEY (id)
);

-- Households table
CREATE TABLE public.households (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  settlement_day INTEGER CHECK (settlement_day >= 1 AND settlement_day <= 31) DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Household members junction table
CREATE TABLE public.household_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  UNIQUE(household_id, user_id)
);

-- Financial accounts table
CREATE TABLE public.financial_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  truelayer_account_id TEXT, -- External API identifier
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment', 'credit', 'loan')),
  account_name TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  current_balance DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  is_shared BOOLEAN DEFAULT false,
  is_manual BOOLEAN DEFAULT false,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE NOT NULL,
  truelayer_transaction_id TEXT, -- External API identifier
  amount DECIMAL(15,2) NOT NULL,
  merchant_name TEXT,
  category TEXT,
  date DATE NOT NULL,
  description TEXT,
  is_shared_expense BOOLEAN DEFAULT false,
  splitting_rule_id UUID, -- References expense_splitting_rules
  manual_override BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Expense splitting rules table
CREATE TABLE public.expense_splitting_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  rule_name TEXT NOT NULL,
  merchant_pattern TEXT, -- Regex or exact match
  category_match TEXT,
  amount_threshold DECIMAL(15,2),
  split_percentage JSONB NOT NULL, -- {"user_id": percentage}
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key constraint for splitting rules
ALTER TABLE public.transactions
ADD CONSTRAINT fk_splitting_rule
FOREIGN KEY (splitting_rule_id) REFERENCES public.expense_splitting_rules(id);

-- Settlement tracking table
CREATE TABLE public.settlements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES public.users(id) NOT NULL,
  to_user_id UUID REFERENCES public.users(id) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  settlement_month DATE NOT NULL, -- First day of settlement month
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'disputed')),
  settled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_financial_accounts_user_id ON public.financial_accounts(user_id);
CREATE INDEX idx_financial_accounts_shared ON public.financial_accounts(is_shared) WHERE is_shared = true;
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX idx_transactions_shared ON public.transactions(is_shared_expense) WHERE is_shared_expense = true;
CREATE INDEX idx_household_members_user_id ON public.household_members(user_id);
CREATE INDEX idx_household_members_household_id ON public.household_members(household_id);
CREATE INDEX idx_settlements_household_month ON public.settlements(household_id, settlement_month);

-- Row Level Security Policies

-- Users: Users can only see/edit their own data
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Households: Users can see households they belong to
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their households" ON public.households
  FOR SELECT USING (
    id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create households" ON public.households
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Household members: Users can see members of their households
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view household members" ON public.household_members
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can join households" ON public.household_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Financial accounts: Users see own accounts + shared accounts in their households
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own accounts" ON public.financial_accounts
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view shared accounts in their households" ON public.financial_accounts
  FOR SELECT USING (
    is_shared = true AND user_id IN (
      SELECT hm.user_id FROM public.household_members hm
      WHERE hm.household_id IN (
        SELECT household_id FROM public.household_members
        WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can manage own accounts" ON public.financial_accounts
  FOR ALL USING (user_id = auth.uid());

-- Transactions: Users see own transactions + shared transactions in households
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM public.financial_accounts
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can view shared transactions" ON public.transactions
  FOR SELECT USING (
    is_shared_expense = true AND account_id IN (
      SELECT fa.id FROM public.financial_accounts fa
      JOIN public.household_members hm ON fa.user_id = hm.user_id
      WHERE fa.is_shared = true AND hm.household_id IN (
        SELECT household_id FROM public.household_members
        WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can manage own transactions" ON public.transactions
  FOR ALL USING (
    account_id IN (
      SELECT id FROM public.financial_accounts
      WHERE user_id = auth.uid()
    )
  );

-- Expense splitting rules: Users can see rules for their households
ALTER TABLE public.expense_splitting_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view household rules" ON public.expense_splitting_rules
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create household rules" ON public.expense_splitting_rules
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

-- Settlements: Users can see settlements for their households
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view household settlements" ON public.settlements
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );
```
