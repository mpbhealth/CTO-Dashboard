-- ============================================================================
-- FIX: Profiles Recursive RLS Policy (500 Error)
-- ============================================================================
-- The existing "profiles_admin_all" policy causes a recursive loop because
-- it queries the profiles table to check access to the profiles table.
-- This causes a 500 error when fetching profiles.
--
-- Solution: Use a SECURITY DEFINER function to check admin status
-- without triggering RLS policies (breaking the recursion).
-- ============================================================================

-- Step 1: Create a SECURITY DEFINER function to check if user is admin
-- This function bypasses RLS policies, preventing recursive checks
CREATE OR REPLACE FUNCTION is_admin_user(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Direct query without RLS (SECURITY DEFINER)
  SELECT role INTO user_role
  FROM profiles
  WHERE user_id = check_user_id;
  
  RETURN user_role IN ('admin', 'ceo', 'cto');
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO authenticated;

-- Step 2: Drop the problematic recursive policies
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- Also drop any legacy policy names that might exist
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Step 3: Recreate policies with NON-RECURSIVE checks

-- SELECT: Users can view their own profile OR admins can view all
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT
    USING (
        auth.uid() = user_id  -- Own profile (direct check, no recursion)
        OR 
        is_admin_user(auth.uid())  -- Admin check via SECURITY DEFINER function
    );

-- UPDATE: Users can update their own profile OR admins can update all
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE
    USING (
        auth.uid() = user_id
        OR 
        is_admin_user(auth.uid())
    )
    WITH CHECK (
        auth.uid() = user_id
        OR 
        is_admin_user(auth.uid())
    );

-- INSERT: Users can insert their own profile OR admins can insert any
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR 
        is_admin_user(auth.uid())
    );

-- DELETE: Only admins can delete profiles
CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE
    USING (
        is_admin_user(auth.uid())
    );

-- Step 4: Ensure the profile exists for the user (auto-create if missing)
-- This function is called on signup but we add a safeguard here
CREATE OR REPLACE FUNCTION ensure_profile_exists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create profile if it doesn't exist
  -- org_id is required (NOT NULL) - use default organization UUID
  INSERT INTO profiles (user_id, email, full_name, display_name, role, org_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    '00000000-0000-0000-0000-000000000000'::uuid
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger (in case it was corrupted)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION ensure_profile_exists();

-- Step 5: Verification - output status
DO $$
DECLARE
  policy_count int;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'profiles';
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Profiles RLS Fix Complete';
  RAISE NOTICE 'Total policies on profiles table: %', policy_count;
  RAISE NOTICE '==============================================';
END $$;
