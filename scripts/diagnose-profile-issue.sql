-- Comprehensive diagnostic for profile viewing issue
-- Run this in Supabase SQL Editor

-- ==========================================
-- TEST 1: Check if migration 009 policy exists
-- ==========================================
SELECT
  '=== CHECK 1: RLS Policy for Household Members ===' as test_section,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ Policy EXISTS'
    ELSE '✗ Policy MISSING - Need to run migration 009'
  END as status
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'Household members can view each other''s profiles';

-- ==========================================
-- TEST 2: List ALL policies on profiles table
-- ==========================================
SELECT
  '=== CHECK 2: All Policies on Profiles Table ===' as test_section,
  policyname,
  cmd,
  SUBSTRING(qual::text, 1, 100) as policy_condition
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ==========================================
-- TEST 3: Check if profiles exist for users
-- ==========================================
SELECT
  '=== CHECK 3: Users vs Profiles Count ===' as test_section,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  CASE
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.profiles)
    THEN '✓ All users have profiles'
    ELSE '✗ Some users missing profiles'
  END as status;

-- ==========================================
-- TEST 4: Check household members relationship
-- ==========================================
SELECT
  '=== CHECK 4: Sample Household Membership ===' as test_section,
  h.name as household_name,
  COUNT(hm.user_id) as member_count
FROM households h
JOIN household_members hm ON h.id = hm.household_id
GROUP BY h.id, h.name
LIMIT 5;

-- ==========================================
-- TEST 5: Test actual profile visibility for shared transactions
-- ==========================================
-- This simulates what the API does
SELECT
  '=== CHECK 5: Profile Data for Transaction Owners ===' as test_section,
  t.merchant_name,
  t.is_shared_expense,
  fa.user_id as owner_user_id,
  p.email as owner_email,
  p.full_name as owner_full_name,
  COALESCE(p.full_name, p.email, 'Unknown') as display_name
FROM transactions t
JOIN financial_accounts fa ON fa.id = t.account_id
LEFT JOIN profiles p ON p.id = fa.user_id
WHERE t.is_shared_expense = true
LIMIT 10;

-- ==========================================
-- TEST 6: Check if trigger exists
-- ==========================================
SELECT
  '=== CHECK 6: Auto-Create Profile Trigger ===' as test_section,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ Trigger EXISTS'
    ELSE '✗ Trigger MISSING'
  END as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
