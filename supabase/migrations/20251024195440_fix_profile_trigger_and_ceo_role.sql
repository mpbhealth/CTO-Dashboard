/*
  # Fix Profile Creation and Update CEO Role

  ## Overview
  Fixes the profile creation trigger to properly handle role metadata
  and updates existing CEO user to have the correct role.

  ## Changes
  - Update trigger to handle uppercase role values from metadata
  - Fix existing CEO user profile
  - Ensure role validation works correctly
*/

-- =====================================================
-- Update Function to Handle Case-Insensitive Roles
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
    LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'staff')),
    '00000000-0000-0000-0000-000000000000'::uuid
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = LOWER(COALESCE(EXCLUDED.role, profiles.role)),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    email = COALESCE(EXCLUDED.email, profiles.email);
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- Update CEO User Profile
-- =====================================================

-- Update Catherine's profile to CEO role
UPDATE public.profiles
SET role = 'ceo'
WHERE email = 'catherine@mympb.com';

-- Update any other profiles with uppercase role metadata
UPDATE public.profiles p
SET role = LOWER(u.raw_user_meta_data->>'role')
FROM auth.users u
WHERE p.user_id = u.id
  AND u.raw_user_meta_data->>'role' IS NOT NULL
  AND LOWER(u.raw_user_meta_data->>'role') IN ('ceo', 'cto', 'admin', 'staff')
  AND p.role != LOWER(u.raw_user_meta_data->>'role');

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a profile record with lowercase role from metadata when a new user signs up';
