-- Migration: 010_auto_create_user_profiles
-- Description: Automatically create profile entries when new users sign up
-- Story: 3.2 - Transaction Privacy Controls (Bug Fix)
-- Date: 2025-10-10

-- ==============================================================================
-- STEP 1: Create function to handle new user signup
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new profile for the user
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ==============================================================================
-- STEP 2: Create trigger on auth.users table
-- ==============================================================================

-- Drop trigger if it already exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after a new user is inserted
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- STEP 3: Backfill existing users who don't have profiles
-- ==============================================================================

-- Insert profiles for any existing users who don't have one
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- STEP 4: Add comments for documentation
-- ==============================================================================

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a profile entry when a new user signs up via Supabase Auth';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger that creates profile entries for new users';
