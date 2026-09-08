/*
  # Create Profile Automatically on User Signup
  
  ## Overview
  This migration creates a trigger function that automatically creates a profile
  record when a new user signs up via auth.users.
  
  ## Changes
  - Create trigger function to auto-create profiles
  - Add trigger on auth.users insert
  - Backfill profiles for existing users without profiles
  
  ## Security
  - Function runs with security definer to bypass RLS
  - Only creates profiles, does not modify existing ones
*/

-- =====================================================
-- Create Function to Auto-Create Profile on Signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, display_name, role, org_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'staff',
    '00000000-0000-0000-0000-000000000000'::uuid
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- Create Trigger on auth.users
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Backfill Profiles for Existing Users
-- =====================================================

-- Create profiles for any existing auth.users without profiles
INSERT INTO public.profiles (user_id, email, full_name, display_name, role, org_id)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  'staff',
  '00000000-0000-0000-0000-000000000000'::uuid
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- Add Comment for Documentation
-- =====================================================

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a profile record when a new user signs up';
