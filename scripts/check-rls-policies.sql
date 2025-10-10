-- Check if RLS policies exist on profiles table

-- Check 1: See all policies on profiles table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check 2: Check if specific household member policy exists
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'Household members can view each other''s profiles';

-- Check 3: Test if the API is using service role correctly
-- This should show what the config.supabase.serviceRoleKey is set to
SELECT current_setting('request.jwt.claims', true) as jwt_claims;
