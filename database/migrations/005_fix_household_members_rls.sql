-- Migration: 005_fix_household_members_rls
-- Description: Fix infinite recursion in household_members RLS policy
-- Date: 2025-10-08

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view members of households they belong to" ON household_members;

-- Create a simple, non-recursive policy
-- Users can see their own membership record OR records from households where they are a member
CREATE POLICY "Users can view members of households they belong to" ON household_members
    FOR SELECT USING (
        -- User can see their own membership
        user_id = auth.uid()
        OR
        -- User can see members of households where they themselves are a member
        -- We avoid recursion by checking if ANY row exists with matching household_id and their user_id
        -- This uses a lateral join which PostgreSQL optimizes differently than a subquery
        EXISTS (
            SELECT 1
            FROM household_members AS hm_check
            WHERE hm_check.household_id = household_members.household_id
              AND hm_check.user_id = auth.uid()
            LIMIT 1
        )
    );

-- The key fix: Disable RLS for the subquery by using a security definer function
CREATE OR REPLACE FUNCTION public.is_household_member(household_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM household_members
        WHERE household_id = household_id_param
          AND user_id = user_id_param
    );
END;
$$;

-- Now recreate the policy using the security definer function
DROP POLICY IF EXISTS "Users can view members of households they belong to" ON household_members;

CREATE POLICY "Users can view members of households they belong to" ON household_members
    FOR SELECT USING (
        user_id = auth.uid()
        OR
        is_household_member(household_id, auth.uid())
    );
