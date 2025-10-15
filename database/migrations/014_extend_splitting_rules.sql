-- Migration 014: Create and Extend Expense Splitting Rules Schema
-- Story 4.1: Expense Splitting Rules Engine
-- Date: 2025-10-15

-- Create expense_splitting_rules table
CREATE TABLE IF NOT EXISTS expense_splitting_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('merchant', 'category', 'amount_threshold', 'default')) DEFAULT 'merchant',
  priority INTEGER NOT NULL DEFAULT 100,

  -- Matching criteria (only one should be set based on rule_type)
  merchant_pattern TEXT,
  category_match TEXT,
  min_amount DECIMAL(15,2),
  max_amount DECIMAL(15,2),

  -- Splitting configuration
  split_percentage JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  apply_to_existing_transactions BOOLEAN DEFAULT false
);

-- Add splitting_rule_id to transactions table if it doesn't exist
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS splitting_rule_id UUID REFERENCES expense_splitting_rules(id);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_expense_splitting_rules_household_priority
  ON expense_splitting_rules(household_id, priority ASC, is_active);

CREATE INDEX IF NOT EXISTS idx_expense_splitting_rules_rule_type
  ON expense_splitting_rules(rule_type) WHERE is_active = true;

-- Add comment for documentation
COMMENT ON COLUMN expense_splitting_rules.rule_type IS
  'Type of rule: merchant (match by merchant_pattern), category (match by category_match), amount_threshold (match by min/max_amount), default (catch-all)';

COMMENT ON COLUMN expense_splitting_rules.priority IS
  'Rule priority (1 = highest). When multiple rules match a transaction, highest priority wins.';

COMMENT ON COLUMN expense_splitting_rules.min_amount IS
  'Minimum transaction amount for amount_threshold rules (nullable)';

COMMENT ON COLUMN expense_splitting_rules.max_amount IS
  'Maximum transaction amount for amount_threshold rules (nullable)';

COMMENT ON COLUMN expense_splitting_rules.apply_to_existing_transactions IS
  'Flag to trigger bulk application to historical transactions';

-- Update function to automatically set updated_at timestamp
CREATE OR REPLACE FUNCTION update_expense_splitting_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS expense_splitting_rules_updated_at ON expense_splitting_rules;
CREATE TRIGGER expense_splitting_rules_updated_at
  BEFORE UPDATE ON expense_splitting_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_splitting_rules_updated_at();

-- Enable RLS on expense_splitting_rules
ALTER TABLE expense_splitting_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Household members can view rules for their household
CREATE POLICY expense_splitting_rules_select_policy ON expense_splitting_rules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = expense_splitting_rules.household_id
      AND household_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Household members can create rules for their household
CREATE POLICY expense_splitting_rules_insert_policy ON expense_splitting_rules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = expense_splitting_rules.household_id
      AND household_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Household members can update rules for their household
CREATE POLICY expense_splitting_rules_update_policy ON expense_splitting_rules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = expense_splitting_rules.household_id
      AND household_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Household members can delete rules for their household
CREATE POLICY expense_splitting_rules_delete_policy ON expense_splitting_rules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = expense_splitting_rules.household_id
      AND household_members.user_id = auth.uid()
    )
  );
