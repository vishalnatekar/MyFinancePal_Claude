-- Migration: 006_household_invitations_rls_fix
-- Description: Fix RLS policies for household_invitations table with service role bypass
-- Date: 2025-10-08

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view invitations for their households" ON household_invitations;
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON household_invitations;
DROP POLICY IF EXISTS "Household members can create invitations" ON household_invitations;
DROP POLICY IF EXISTS "Invited users can update their invitation" ON household_invitations;
DROP POLICY IF EXISTS "Service role full access" ON household_invitations;

-- Disable RLS for service role by creating a permissive policy
-- This ensures the service role (used in API routes) can access all data
CREATE POLICY "Service role bypass" ON household_invitations
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also allow authenticated users to view invitations (for the invite page)
CREATE POLICY "Anyone can view invitations" ON household_invitations
  AS PERMISSIVE
  FOR SELECT
  USING (true);
