-- Migration: 009_allow_household_member_profiles
-- Description: Allow household members to view each other's profiles
-- Story: 3.2 - Transaction Privacy Controls (fix for viewing shared transaction owners)
-- Date: 2025-10-10

-- Add policy to allow household members to view each other's profiles
CREATE POLICY "Household members can view each other's profiles" ON profiles
  FOR SELECT USING (
    -- Allow viewing profiles of users who are in the same household
    EXISTS (
      SELECT 1
      FROM household_members hm1
      JOIN household_members hm2 ON hm1.household_id = hm2.household_id
      WHERE hm1.user_id = auth.uid()
      AND hm2.user_id = profiles.id
    )
  );

-- Add comment
COMMENT ON POLICY "Household members can view each other's profiles" ON profiles IS
  'Allows users to view profiles of other members in their households - needed for displaying transaction owner names';
