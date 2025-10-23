-- Migration 015: Transaction Categorization System
-- Story 4.2: Automatic Transaction Categorization
-- Adds confidence scoring, manual override tracking, and feedback system

-- Add new columns to transactions table for auto-categorization
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
ADD COLUMN IF NOT EXISTS manual_override BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_rule_id UUID REFERENCES expense_splitting_rules(id),
ADD COLUMN IF NOT EXISTS split_details JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN transactions.confidence_score IS 'Confidence level (0-100) of automatic categorization. NULL = not categorized';
COMMENT ON COLUMN transactions.manual_override IS 'True if user manually overrode automatic categorization';
COMMENT ON COLUMN transactions.original_rule_id IS 'Original rule that was applied before manual override';
COMMENT ON COLUMN transactions.split_details IS 'Split transaction details: {personal_amount, shared_amount, split_percentage}';

-- Create indexes for performance
-- Note: transactions don't have household_id directly, they link through financial_accounts
CREATE INDEX IF NOT EXISTS idx_transactions_confidence_score ON transactions(confidence_score) WHERE confidence_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_manual_override ON transactions(manual_override) WHERE manual_override = false;
CREATE INDEX IF NOT EXISTS idx_transactions_splitting_rule_id ON transactions(splitting_rule_id) WHERE splitting_rule_id IS NOT NULL;

-- Transaction override history table
CREATE TABLE IF NOT EXISTS transaction_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  original_rule_id UUID REFERENCES expense_splitting_rules(id),
  override_by UUID REFERENCES auth.users(id) NOT NULL,
  override_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  old_is_shared_expense BOOLEAN,
  new_is_shared_expense BOOLEAN,
  old_split_percentage JSONB,
  new_split_percentage JSONB,
  override_reason TEXT
);

COMMENT ON TABLE transaction_overrides IS 'History of manual overrides to automatic transaction categorization';

-- Rule feedback tracking table
CREATE TABLE IF NOT EXISTS rule_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  rule_id UUID REFERENCES expense_splitting_rules(id),
  household_id UUID REFERENCES households(id) NOT NULL,
  user_action TEXT CHECK (user_action IN ('accepted', 'rejected', 'overridden')) NOT NULL,
  original_confidence_score INTEGER,
  override_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE rule_feedback IS 'User feedback on rule matching quality for analytics and improvement';

-- Create indexes for feedback analytics
CREATE INDEX IF NOT EXISTS idx_rule_feedback_rule_id ON rule_feedback(rule_id, user_action);
CREATE INDEX IF NOT EXISTS idx_rule_feedback_household_id ON rule_feedback(household_id, created_at);

-- Enable Row Level Security
ALTER TABLE transaction_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view overrides for their own transactions or household transactions
CREATE POLICY transaction_overrides_household_access ON transaction_overrides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      JOIN financial_accounts fa ON fa.id = t.account_id
      WHERE t.id = transaction_overrides.transaction_id
      AND (
        -- User owns the account
        fa.user_id = auth.uid()
        OR
        -- Transaction is shared with user's household
        (
          t.is_shared_expense = true
          AND t.shared_with_household_id IN (
            SELECT household_id FROM household_members
            WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- RLS Policy: Users can create overrides for their own transactions or household transactions
CREATE POLICY transaction_overrides_create ON transaction_overrides
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
      JOIN financial_accounts fa ON fa.id = t.account_id
      WHERE t.id = transaction_overrides.transaction_id
      AND (
        -- User owns the account
        fa.user_id = auth.uid()
        OR
        -- Transaction is shared with user's household
        (
          t.is_shared_expense = true
          AND t.shared_with_household_id IN (
            SELECT household_id FROM household_members
            WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- RLS Policy: Users can view feedback for their household rules
CREATE POLICY rule_feedback_household_access ON rule_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = rule_feedback.household_id
      AND hm.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can create feedback for their household rules
CREATE POLICY rule_feedback_create ON rule_feedback
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = rule_feedback.household_id
      AND hm.user_id = auth.uid()
    )
  );
