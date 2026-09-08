/*
  # Fix Role Routing and Profile Creation

  1. Auto-create Profiles
    - Create trigger to automatically create profiles when new users sign up
    - Ensures no user is ever without a profile row
    - Infers role from email domain

  2. Role Helper Function
    - Add `current_role()` function for use in RLS policies
    - Returns role from profiles table for current auth user

  3. Profile Defaults
    - Set sensible default values for new profiles
    - Ensure role is never null

  4. Superuser Support
    - Add superuser flag for admin override
    - Allow specific emails to have elevated permissions
*/

CREATE OR REPLACE FUNCTION public.infer_role_from_email(email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  email := lower(trim(email));

  IF email LIKE 'catherine@%mympb.com' THEN
    RETURN 'ceo';
  ELSIF email LIKE 'vrt@%mympb.com' OR email LIKE 'vinnie%@mympb.com' THEN
    RETURN 'admin';
  ELSE
    RETURN 'staff';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inferred_role text;
  user_display_name text;
  default_org_id uuid;
BEGIN
  inferred_role := public.infer_role_from_email(new.email);

  user_display_name := COALESCE(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    new.email
  );

  -- org_id is required (NOT NULL) - use default organization UUID
  default_org_id := '00000000-0000-0000-0000-000000000000'::uuid;

  INSERT INTO public.profiles (id, email, display_name, role, org_id, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    user_display_name,
    inferred_role,
    default_org_id,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    role = COALESCE(profiles.role, EXCLUDED.role),
    updated_at = now();

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_superuser boolean DEFAULT false;

UPDATE public.profiles
SET is_superuser = true
WHERE email LIKE '%@mympb.com'
  AND (email LIKE 'vrt@%' OR email LIKE 'catherine@%' OR email LIKE 'vinnie%');

CREATE OR REPLACE FUNCTION public.is_superuser()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_superuser FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_superuser ON public.profiles(is_superuser) WHERE is_superuser = true;
