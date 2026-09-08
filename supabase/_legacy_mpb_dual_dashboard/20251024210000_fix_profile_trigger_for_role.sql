/*
  # Fix Profile Creation Trigger to Use Signup Role

  ## Overview
  Updates the profile creation trigger to properly extract the role from
  user metadata during signup, instead of defaulting to 'staff'.

  ## Changes
  - Update handle_new_user() function to read role from raw_user_meta_data
  - Default to 'staff' only if no role is provided
  - Backfill existing users with proper roles if they exist in metadata
*/

-- =====================================================
-- Update Function to Use Role from Signup Metadata
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    '00000000-0000-0000-0000-000000000000'::uuid
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = COALESCE(EXCLUDED.role, profiles.role),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    email = COALESCE(EXCLUDED.email, profiles.email);
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- Update Existing Profiles with Role from Metadata
-- =====================================================

-- Update existing profiles to use role from auth metadata if available
UPDATE public.profiles p
SET role = COALESCE(u.raw_user_meta_data->>'role', 'staff')
FROM auth.users u
WHERE p.user_id = u.id
  AND u.raw_user_meta_data->>'role' IS NOT NULL
  AND p.role = 'staff';

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a profile record with role from metadata when a new user signs up';
