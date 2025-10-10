-- Migration: 011_rollback_recursive_policy
-- Description: Rollback the recursive policy that causes infinite recursion
-- Date: 2025-10-10

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view accounts linked to shared transactions" ON financial_accounts;
