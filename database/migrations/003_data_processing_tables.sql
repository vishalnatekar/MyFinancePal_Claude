-- Migration: Add Data Processing and Storage Tables
-- Story 2.2: Account Data Processing and Storage

-- Account balance history
CREATE TABLE IF NOT EXISTS account_balance_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES financial_accounts(id) ON DELETE CASCADE NOT NULL,
  balance DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transaction processing metadata
CREATE TABLE IF NOT EXISTS transaction_processing_metadata (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_id UUID NOT NULL,
  fingerprint TEXT NOT NULL,
  duplicate_cluster_id UUID,
  processing_status TEXT CHECK (processing_status IN ('pending', 'processed', 'duplicate', 'error')),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Data sync tracking
CREATE TABLE IF NOT EXISTS data_sync_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES financial_accounts(id) ON DELETE CASCADE NOT NULL,
  sync_type TEXT CHECK (sync_type IN ('manual', 'scheduled', 'retry')),
  status TEXT CHECK (status IN ('started', 'processing', 'completed', 'failed')),
  transactions_processed INTEGER DEFAULT 0,
  duplicates_found INTEGER DEFAULT 0,
  errors_encountered TEXT[],
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Transactions table (if not already exists)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES financial_accounts(id) ON DELETE CASCADE NOT NULL,
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_balance_history_account_date ON account_balance_history(account_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_fingerprint ON transaction_processing_metadata(fingerprint);
CREATE INDEX IF NOT EXISTS idx_transaction_processing_transaction_id ON transaction_processing_metadata(transaction_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_account_status ON data_sync_logs(account_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_truelayer_id ON transactions(truelayer_transaction_id);

-- Enable Row Level Security
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_processing_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for account_balance_history
CREATE POLICY "Users can view balance history for their accounts" ON account_balance_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM financial_accounts
            WHERE financial_accounts.id = account_balance_history.account_id
            AND financial_accounts.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert balance history" ON account_balance_history
    FOR INSERT WITH CHECK (TRUE);

-- RLS Policies for transaction_processing_metadata
CREATE POLICY "System can manage transaction metadata" ON transaction_processing_metadata
    FOR ALL USING (TRUE);

-- RLS Policies for data_sync_logs
CREATE POLICY "Users can view sync logs for their accounts" ON data_sync_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM financial_accounts
            WHERE financial_accounts.id = data_sync_logs.account_id
            AND financial_accounts.user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage sync logs" ON data_sync_logs
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "System can update sync logs" ON data_sync_logs
    FOR UPDATE USING (TRUE);

-- RLS Policies for transactions
CREATE POLICY "Users can view transactions for their accounts" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM financial_accounts
            WHERE financial_accounts.id = transactions.account_id
            AND financial_accounts.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert transactions" ON transactions
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "System can update transactions" ON transactions
    FOR UPDATE USING (TRUE);

CREATE POLICY "Users can delete their transactions" ON transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM financial_accounts
            WHERE financial_accounts.id = transactions.account_id
            AND financial_accounts.user_id = auth.uid()
        )
    );
