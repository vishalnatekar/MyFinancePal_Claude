-- Verification script for migration 010
-- Run this in Supabase SQL Editor to verify profiles were created

-- Check 1: Count total users vs profiles
SELECT
  'Total Users' as check_type,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT
  'Total Profiles' as check_type,
  COUNT(*) as count
FROM public.profiles;

-- Check 2: Find users without profiles (should be empty after migration)
SELECT
  au.id,
  au.email,
  au.created_at,
  'Missing Profile' as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Check 3: Sample of profiles to verify data
SELECT
  p.id,
  p.email,
  p.full_name,
  p.created_at
FROM public.profiles p
LIMIT 10;

-- Check 4: Verify trigger exists
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
