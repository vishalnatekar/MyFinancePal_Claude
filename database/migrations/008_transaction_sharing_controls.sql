-- Migration: 008_transaction_sharing_controls
-- Description: Add transaction-level sharing privacy controls for household management
-- Story: 3.2 - Transaction Privacy Controls
-- Date: 2025-10-09

-- ==============================================================================
-- STEP 1: Add new columns to transactions table for sharing metadata
-- ==============================================================================

-- Add shared_with_household_id column (nullable - null means private)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS shared_with_household_id UUID REFERENCES households(id) ON DELETE SET NULL;

-- Add shared_at timestamp to track when transaction was shared
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE;

-- Add shared_by to track who initiated sharing
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS shared_by UUID REFERENCES auth.users(id);

-- ==============================================================================
-- STEP 2: Create transaction_sharing_history table for audit logging
-- ==============================================================================

CREATE TABLE IF NOT EXISTS transaction_sharing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('shared', 'unshared')),
  changed_by UUID REFERENCES auth.users(id) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new table
ALTER TABLE transaction_sharing_history ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- STEP 3: Create indexes for performance optimization
-- ==============================================================================

-- Index for filtering transactions by household
CREATE INDEX IF NOT EXISTS idx_transactions_shared_with_household
ON transactions(shared_with_household_id, date DESC)
WHERE shared_with_household_id IS NOT NULL;

-- Index for filtering by sharing status
CREATE INDEX IF NOT EXISTS idx_transactions_is_shared_expense
ON transactions(is_shared_expense, date DESC);

-- Index for transaction_sharing_history queries
CREATE INDEX IF NOT EXISTS idx_sharing_history_transaction_id
ON transaction_sharing_history(transaction_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_sharing_history_household_id
ON transaction_sharing_history(household_id, changed_at DESC);

-- ==============================================================================
-- STEP 4: Update RLS policies for transaction-level privacy
-- ==============================================================================

-- Drop old transaction sharing policy if it exists
DROP POLICY IF EXISTS "Users can view shared transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view shared transactions based on sharing level" ON transactions;

-- Users can view their own transactions (keep existing)
-- This policy should already exist from previous migrations

-- Create new policy for viewing shared transactions
CREATE POLICY "Users can view shared transactions" ON transactions
  FOR SELECT USING (
    -- Users can view transactions explicitly shared with households they belong to
    is_shared_expense = true
    AND shared_with_household_id IS NOT NULL
    AND shared_with_household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy for users to update sharing settings on their own transactions
CREATE POLICY "Users can update sharing settings for their transactions" ON transactions
  FOR UPDATE USING (
    account_id IN (
      SELECT id FROM public.financial_accounts
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT id FROM public.financial_accounts
      WHERE user_id = auth.uid()
    )
  );

-- ==============================================================================
-- STEP 5: Create RLS policies for transaction_sharing_history
-- ==============================================================================

-- Users can view sharing history for their own transactions
CREATE POLICY "Users can view sharing history for their transactions" ON transaction_sharing_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transactions t
      JOIN financial_accounts fa ON fa.id = t.account_id
      WHERE t.id = transaction_sharing_history.transaction_id
      AND fa.user_id = auth.uid()
    )
  );

-- Household members can view sharing history for their household
CREATE POLICY "Household members can view sharing history" ON transaction_sharing_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = transaction_sharing_history.household_id
      AND hm.user_id = auth.uid()
    )
  );

-- System can insert sharing history (via API routes with authenticated user)
CREATE POLICY "Authenticated users can insert sharing history" ON transaction_sharing_history
  FOR INSERT WITH CHECK (
    -- Only allow users to insert history for transactions they own
    EXISTS (
      SELECT 1 FROM transactions t
      JOIN financial_accounts fa ON fa.id = t.account_id
      WHERE fa.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- STEP 6: Create helper function for updating transaction sharing
-- ==============================================================================

-- Function to safely update transaction sharing and log the change
CREATE OR REPLACE FUNCTION update_transaction_sharing(
  p_transaction_id UUID,
  p_household_id UUID,
  p_is_shared BOOLEAN,
  p_changed_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_account_id UUID;
  v_account_owner_id UUID;
  v_action TEXT;
BEGIN
  -- Get transaction's account and verify ownership
  SELECT t.account_id, fa.user_id
  INTO v_account_id, v_account_owner_id
  FROM transactions t
  JOIN financial_accounts fa ON fa.id = t.account_id
  WHERE t.id = p_transaction_id;

  -- Verify the user owns the transaction's account
  IF v_account_owner_id != p_changed_by THEN
    RAISE EXCEPTION 'User does not own this transaction';
  END IF;

  -- Verify the user belongs to the target household (if sharing)
  IF p_is_shared AND NOT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = p_household_id AND user_id = p_changed_by
  ) THEN
    RAISE EXCEPTION 'User is not a member of the target household';
  END IF;

  -- Determine action type
  v_action := CASE
    WHEN p_is_shared THEN 'shared'
    ELSE 'unshared'
  END;

  -- Update transactions table
  UPDATE transactions
  SET
    is_shared_expense = p_is_shared,
    shared_with_household_id = CASE
      WHEN p_is_shared THEN p_household_id
      ELSE NULL
    END,
    shared_at = CASE
      WHEN p_is_shared THEN now()
      ELSE NULL
    END,
    shared_by = CASE
      WHEN p_is_shared THEN p_changed_by
      ELSE NULL
    END
  WHERE id = p_transaction_id;

  -- Insert audit log entry
  INSERT INTO transaction_sharing_history (
    transaction_id,
    household_id,
    action,
    changed_by,
    changed_at
  ) VALUES (
    p_transaction_id,
    p_household_id,
    v_action,
    p_changed_by,
    now()
  );

  RETURN TRUE;
END;
$$;

-- ==============================================================================
-- STEP 7: Create function for bulk transaction sharing updates
-- ==============================================================================

CREATE OR REPLACE FUNCTION bulk_update_transaction_sharing(
  p_transaction_ids UUID[],
  p_household_id UUID,
  p_is_shared BOOLEAN,
  p_changed_by UUID
)
RETURNS TABLE(
  transaction_id UUID,
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_error_msg TEXT;
BEGIN
  -- Process each transaction
  FOREACH v_transaction_id IN ARRAY p_transaction_ids
  LOOP
    BEGIN
      -- Call single update function
      PERFORM update_transaction_sharing(
        v_transaction_id,
        p_household_id,
        p_is_shared,
        p_changed_by
      );

      -- Return success
      transaction_id := v_transaction_id;
      success := TRUE;
      error_message := NULL;
      RETURN NEXT;

    EXCEPTION WHEN OTHERS THEN
      -- Return error
      transaction_id := v_transaction_id;
      success := FALSE;
      error_message := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

-- ==============================================================================
-- STEP 8: Add comment documentation for new fields
-- ==============================================================================

COMMENT ON COLUMN transactions.shared_with_household_id IS 'UUID of household that can view this transaction (NULL = private)';
COMMENT ON COLUMN transactions.shared_at IS 'Timestamp when transaction was shared with household';
COMMENT ON COLUMN transactions.shared_by IS 'User ID of who shared the transaction';
COMMENT ON TABLE transaction_sharing_history IS 'Audit log tracking all changes to transaction sharing settings';
COMMENT ON FUNCTION update_transaction_sharing IS 'Safely update transaction sharing status with validation and audit logging';
COMMENT ON FUNCTION bulk_update_transaction_sharing IS 'Bulk update transaction sharing with per-transaction error handling';

-- ==============================================================================
-- STEP 9: Migrate existing is_shared_expense data
-- ==============================================================================

-- For transactions already marked as shared, associate them with user's first household
-- Note: This is a best-effort migration. Users can adjust sharing settings after.
UPDATE transactions t
SET
  shared_with_household_id = (
    SELECT hm.household_id
    FROM financial_accounts fa
    JOIN household_members hm ON hm.user_id = fa.user_id
    WHERE fa.id = t.account_id
    LIMIT 1
  ),
  shared_at = t.created_at,
  shared_by = (
    SELECT fa.user_id
    FROM financial_accounts fa
    WHERE fa.id = t.account_id
  )
WHERE t.is_shared_expense = true
AND t.shared_with_household_id IS NULL;
