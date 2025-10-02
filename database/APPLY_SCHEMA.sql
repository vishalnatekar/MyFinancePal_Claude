-- ============================================
-- MyFinancePal Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Profiles table for additional user information
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Households table
CREATE TABLE IF NOT EXISTS public.households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    settlement_day INTEGER CHECK (settlement_day >= 1 AND settlement_day <= 31) DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Household members junction table
CREATE TABLE IF NOT EXISTS public.household_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(household_id, user_id)
);

-- Categories table for expense categorization
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, household_id)
);

-- ============================================
-- FINANCIAL ACCOUNTS (THIS IS THE KEY TABLE!)
-- ============================================

CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    truelayer_account_id TEXT,
    truelayer_connection_id TEXT,
    account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment', 'credit')),
    account_name TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced TIMESTAMP WITH TIME ZONE,
    is_manual BOOLEAN NOT NULL DEFAULT FALSE,
    connection_status TEXT DEFAULT 'active' CHECK (connection_status IN ('active', 'expired', 'failed')),
    encrypted_access_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account sync history table
CREATE TABLE IF NOT EXISTS public.account_sync_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE NOT NULL,
    sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'failed', 'in_progress')),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT
);

-- OAuth states table
CREATE TABLE IF NOT EXISTS public.oauth_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_token TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider_id TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE NOT NULL,
  truelayer_transaction_id TEXT,
  amount DECIMAL(15,2) NOT NULL,
  merchant_name TEXT,
  category TEXT,
  date DATE NOT NULL,
  description TEXT,
  currency TEXT NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('DEBIT', 'CREDIT')),
  is_shared_expense BOOLEAN DEFAULT FALSE,
  manual_override BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- DATA PROCESSING TABLES (Story 2.2)
-- ============================================

-- Account balance history
CREATE TABLE IF NOT EXISTS public.account_balance_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE NOT NULL,
  balance DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transaction processing metadata
CREATE TABLE IF NOT EXISTS public.transaction_processing_metadata (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_id UUID NOT NULL,
  fingerprint TEXT NOT NULL,
  duplicate_cluster_id UUID,
  processing_status TEXT CHECK (processing_status IN ('pending', 'processed', 'duplicate', 'error')),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Data sync tracking
CREATE TABLE IF NOT EXISTS public.data_sync_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE NOT NULL,
  sync_type TEXT CHECK (sync_type IN ('manual', 'scheduled', 'retry')),
  status TEXT CHECK (status IN ('started', 'processing', 'completed', 'failed')),
  transactions_processed INTEGER DEFAULT 0,
  duplicates_found INTEGER DEFAULT 0,
  errors_encountered TEXT[],
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_financial_accounts_user_id ON public.financial_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_truelayer_connection_id ON public.financial_accounts(truelayer_connection_id);
CREATE INDEX IF NOT EXISTS idx_account_sync_history_account_id ON public.account_sync_history(account_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_state_token ON public.oauth_states(state_token);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON public.oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_truelayer_id ON public.transactions(truelayer_transaction_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_account_date ON public.account_balance_history(account_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_fingerprint ON public.transaction_processing_metadata(fingerprint);
CREATE INDEX IF NOT EXISTS idx_transaction_processing_transaction_id ON public.transaction_processing_metadata(transaction_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_account_status ON public.data_sync_logs(account_id, status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_processing_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sync_logs ENABLE ROW LEVEL SECURITY;

-- Financial Accounts RLS Policies
DROP POLICY IF EXISTS "Users can view their own financial accounts" ON public.financial_accounts;
CREATE POLICY "Users can view their own financial accounts" ON public.financial_accounts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own financial accounts" ON public.financial_accounts;
CREATE POLICY "Users can insert their own financial accounts" ON public.financial_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own financial accounts" ON public.financial_accounts;
CREATE POLICY "Users can update their own financial accounts" ON public.financial_accounts
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own financial accounts" ON public.financial_accounts;
CREATE POLICY "Users can delete their own financial accounts" ON public.financial_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Transactions RLS Policies
DROP POLICY IF EXISTS "Users can view transactions for their accounts" ON public.transactions;
CREATE POLICY "Users can view transactions for their accounts" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.financial_accounts
            WHERE public.financial_accounts.id = public.transactions.account_id
            AND public.financial_accounts.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can insert transactions" ON public.transactions;
CREATE POLICY "System can insert transactions" ON public.transactions
    FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "System can update transactions" ON public.transactions;
CREATE POLICY "System can update transactions" ON public.transactions
    FOR UPDATE USING (TRUE);

-- Account Sync History RLS
DROP POLICY IF EXISTS "Users can view sync history for their accounts" ON public.account_sync_history;
CREATE POLICY "Users can view sync history for their accounts" ON public.account_sync_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.financial_accounts
            WHERE public.financial_accounts.id = public.account_sync_history.account_id
            AND public.financial_accounts.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can insert sync history" ON public.account_sync_history;
CREATE POLICY "System can insert sync history" ON public.account_sync_history
    FOR INSERT WITH CHECK (TRUE);

-- OAuth States RLS
DROP POLICY IF EXISTS "Users can view their own OAuth states" ON public.oauth_states;
CREATE POLICY "Users can view their own OAuth states" ON public.oauth_states
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert OAuth states" ON public.oauth_states;
CREATE POLICY "System can insert OAuth states" ON public.oauth_states
    FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "System can delete OAuth states" ON public.oauth_states;
CREATE POLICY "System can delete OAuth states" ON public.oauth_states
    FOR DELETE USING (TRUE);

-- Data Processing Tables RLS
DROP POLICY IF EXISTS "System can manage transaction metadata" ON public.transaction_processing_metadata;
CREATE POLICY "System can manage transaction metadata" ON public.transaction_processing_metadata
    FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "Users can view balance history for their accounts" ON public.account_balance_history;
CREATE POLICY "Users can view balance history for their accounts" ON public.account_balance_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.financial_accounts
            WHERE public.financial_accounts.id = public.account_balance_history.account_id
            AND public.financial_accounts.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can insert balance history" ON public.account_balance_history;
CREATE POLICY "System can insert balance history" ON public.account_balance_history
    FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can view sync logs for their accounts" ON public.data_sync_logs;
CREATE POLICY "Users can view sync logs for their accounts" ON public.data_sync_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.financial_accounts
            WHERE public.financial_accounts.id = public.data_sync_logs.account_id
            AND public.financial_accounts.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can manage sync logs" ON public.data_sync_logs;
CREATE POLICY "System can manage sync logs" ON public.data_sync_logs
    FOR ALL USING (TRUE);
