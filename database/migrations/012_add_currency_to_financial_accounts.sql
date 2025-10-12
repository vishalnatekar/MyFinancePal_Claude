-- Add currency column to financial_accounts table
-- This supports multi-currency accounts and household financial tracking

ALTER TABLE financial_accounts
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GBP';

-- Add comment to explain the column
COMMENT ON COLUMN financial_accounts.currency IS 'Currency code (ISO 4217) for the account balance. Defaults to GBP.';

-- Update any existing rows to have the default currency if NULL
UPDATE financial_accounts
SET currency = 'GBP'
WHERE currency IS NULL;
