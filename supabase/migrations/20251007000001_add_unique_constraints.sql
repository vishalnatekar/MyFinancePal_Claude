-- Migration: Add unique constraints for upsert operations
-- Date: 2025-10-07
-- Description: Add unique constraints to support upsert operations in account sync and transaction storage

-- Add unique constraint on financial_accounts.truelayer_account_id
-- This allows upsert to work when reconnecting accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'financial_accounts_truelayer_account_id_key'
  ) THEN
    ALTER TABLE financial_accounts
    ADD CONSTRAINT financial_accounts_truelayer_account_id_key
    UNIQUE (truelayer_account_id);
  END IF;
END $$;

-- Add unique constraint on transactions.truelayer_transaction_id
-- This allows upsert to work when syncing transactions to avoid duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_truelayer_transaction_id_key'
  ) THEN
    ALTER TABLE transactions
    ADD CONSTRAINT transactions_truelayer_transaction_id_key
    UNIQUE (truelayer_transaction_id);
  END IF;
END $$;

-- Add comment explaining the constraints
COMMENT ON CONSTRAINT financial_accounts_truelayer_account_id_key ON financial_accounts IS
'Ensures each TrueLayer account is stored only once, enabling upsert on reconnection';

COMMENT ON CONSTRAINT transactions_truelayer_transaction_id_key ON transactions IS
'Ensures each TrueLayer transaction is stored only once, enabling upsert on sync to avoid duplicates';
