-- Migration: 010_allow_viewing_shared_transaction_accounts
-- Description: Allow users to view financial account info for shared transactions
-- Story: 3.2 - Transaction Privacy Controls (fix for viewing shared transaction account details)
-- Date: 2025-10-10

-- Add policy to allow viewing financial accounts linked to shared transactions
CREATE POLICY "Users can view accounts linked to shared transactions" ON financial_accounts
  FOR SELECT USING (
    -- Allow viewing accounts that have transactions shared with user's households
    EXISTS (
      SELECT 1
      FROM transactions t
      JOIN household_members hm ON hm.household_id = t.shared_with_household_id
      WHERE t.account_id = financial_accounts.id
      AND t.is_shared_expense = true
      AND t.shared_with_household_id IS NOT NULL
      AND hm.user_id = auth.uid()
    )
  );

-- Add comment
COMMENT ON POLICY "Users can view accounts linked to shared transactions" ON financial_accounts IS
  'Allows users to view basic financial account info (id, user_id) for accounts that have transactions shared with their households';
