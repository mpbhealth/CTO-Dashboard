-- ============================================================================
-- COMPREHENSIVE RLS & AUTH CLEANUP MIGRATION
-- ============================================================================
-- This migration consolidates and fixes multiple issues across migrations:
--
-- 1. Ensures is_admin_user() helper function exists with SECURITY DEFINER
-- 2. Creates additional helper functions for role checks
-- 3. Consolidates profile creation trigger to single definitive function
-- 4. Ensures all profile policies are non-recursive
-- 5. Optimizes Admin Control Center policies to use helper functions
-- 6. Fixes potential missing SECURITY DEFINER on critical functions
-- ============================================================================

-- ============================================================================
-- PART 1: Core Helper Functions (SECURITY DEFINER)
-- ============================================================================

-- Drop and recreate to ensure clean state
DROP FUNCTION IF EXISTS is_admin_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_staff_or_higher(uuid) CASCADE;

-- Function to check if user is admin (ceo, cto, admin)
CREATE OR REPLACE FUNCTION is_admin_user(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT role INTO user_role
  FROM profiles
  WHERE user_id = check_user_id;
  
  RETURN COALESCE(user_role IN ('admin', 'ceo', 'cto'), false);
END;
$$;

-- Function to get user's role directly (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_role(check_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  IF check_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT role INTO user_role
  FROM profiles
  WHERE user_id = check_user_id;
  
  RETURN user_role;
END;
$$;

-- Function to check if user is staff or higher role
CREATE OR REPLACE FUNCTION is_staff_or_higher(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT role INTO user_role
  FROM profiles
  WHERE user_id = check_user_id;
  
  RETURN COALESCE(user_role IN ('admin', 'ceo', 'cto', 'staff', 'cfo', 'cmo', 'manager'), false);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION is_staff_or_higher(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_staff_or_higher(uuid) TO service_role;

-- ============================================================================
-- PART 2: Consolidated Profile Creation Trigger
-- ============================================================================

-- Drop all conflicting trigger functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_profile_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS ensure_profile_exists() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create single definitive profile creation function
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  user_name text;
  user_role text;
  default_org_id text;
BEGIN
  -- Get email
  user_email := COALESCE(NEW.email, '');
  
  -- Get name from metadata or derive from email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(user_email, '@', 1)
  );
  
  -- Get role from metadata, default to 'staff'
  user_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'staff'));
  
  -- Validate role
  IF user_role NOT IN ('admin', 'ceo', 'cto', 'cfo', 'cmo', 'staff', 'manager', 'member') THEN
    user_role := 'staff';
  END IF;
  
  -- Default org ID (for MPB Health - can be overridden via metadata)
  default_org_id := COALESCE(
    NEW.raw_user_meta_data->>'org_id',
    '00000000-0000-0000-0000-000000000000'
  );
  
  -- Insert profile (use ON CONFLICT to handle race conditions)
  INSERT INTO profiles (
    user_id,
    email,
    full_name,
    display_name,
    role,
    org_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_email,
    user_name,
    user_name,
    user_role,
    default_org_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW()
  WHERE profiles.email IS NULL OR profiles.email = '';
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail signup
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop existing trigger and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_on_signup();

-- ============================================================================
-- PART 3: Ensure Profiles Table Policies Are Clean
-- ============================================================================

-- Make sure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL possible existing profile policies (comprehensive cleanup)
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their org" ON profiles;
DROP POLICY IF EXISTS "profiles_self_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON profiles;

-- Create definitive non-recursive policies

-- SELECT: Users can view own profile OR admins can view all
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR 
        is_admin_user(auth.uid())
    );

-- INSERT: Users can create their own profile OR admins can create any
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        OR 
        is_admin_user(auth.uid())
    );

-- UPDATE: Users can update their own profile OR admins can update any
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE
    TO authenticated
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

-- DELETE: Only admins can delete profiles
CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE
    TO authenticated
    USING (
        is_admin_user(auth.uid())
    );

-- ============================================================================
-- PART 4: Optimize Admin Control Center Policies
-- ============================================================================

-- These tables use staff_or_higher checks - update to use helper function
-- This is optional but improves consistency and potentially performance

-- member_profiles
DROP POLICY IF EXISTS "admin_member_profiles" ON member_profiles;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_profiles' AND table_schema = 'public') THEN
    CREATE POLICY "admin_member_profiles" ON member_profiles 
      FOR ALL 
      TO authenticated
      USING (is_staff_or_higher(auth.uid()))
      WITH CHECK (is_staff_or_higher(auth.uid()));
  END IF;
END $$;

-- member_dependents
DROP POLICY IF EXISTS "admin_member_dependents" ON member_dependents;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_dependents' AND table_schema = 'public') THEN
    CREATE POLICY "admin_member_dependents" ON member_dependents 
      FOR ALL 
      TO authenticated
      USING (is_staff_or_higher(auth.uid()))
      WITH CHECK (is_staff_or_higher(auth.uid()));
  END IF;
END $$;

-- emergency_contacts
DROP POLICY IF EXISTS "admin_emergency_contacts" ON emergency_contacts;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emergency_contacts' AND table_schema = 'public') THEN
    CREATE POLICY "admin_emergency_contacts" ON emergency_contacts 
      FOR ALL 
      TO authenticated
      USING (is_staff_or_higher(auth.uid()))
      WITH CHECK (is_staff_or_higher(auth.uid()));
  END IF;
END $$;

-- claims
DROP POLICY IF EXISTS "admin_claims" ON claims;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'claims' AND table_schema = 'public') THEN
    CREATE POLICY "admin_claims" ON claims 
      FOR ALL 
      TO authenticated
      USING (is_staff_or_higher(auth.uid()))
      WITH CHECK (is_staff_or_higher(auth.uid()));
  END IF;
END $$;

-- claim_documents
DROP POLICY IF EXISTS "admin_claim_documents" ON claim_documents;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'claim_documents' AND table_schema = 'public') THEN
    CREATE POLICY "admin_claim_documents" ON claim_documents 
      FOR ALL 
      TO authenticated
      USING (is_staff_or_higher(auth.uid()))
      WITH CHECK (is_staff_or_higher(auth.uid()));
  END IF;
END $$;

-- claim_notes
DROP POLICY IF EXISTS "admin_claim_notes" ON claim_notes;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'claim_notes' AND table_schema = 'public') THEN
    CREATE POLICY "admin_claim_notes" ON claim_notes 
      FOR ALL 
      TO authenticated
      USING (is_staff_or_higher(auth.uid()))
      WITH CHECK (is_staff_or_higher(auth.uid()));
  END IF;
END $$;

-- support_tickets
DROP POLICY IF EXISTS "admin_support_tickets" ON support_tickets;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets' AND table_schema = 'public') THEN
    CREATE POLICY "admin_support_tickets" ON support_tickets 
      FOR ALL 
      TO authenticated
      USING (is_staff_or_higher(auth.uid()))
      WITH CHECK (is_staff_or_higher(auth.uid()));
  END IF;
END $$;

-- ticket_replies
DROP POLICY IF EXISTS "admin_ticket_replies" ON ticket_replies;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_replies' AND table_schema = 'public') THEN
    CREATE POLICY "admin_ticket_replies" ON ticket_replies 
      FOR ALL 
      TO authenticated
      USING (is_staff_or_higher(auth.uid()))
      WITH CHECK (is_staff_or_higher(auth.uid()));
  END IF;
END $$;

-- transactions
DROP POLICY IF EXISTS "admin_transactions" ON transactions;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') THEN
    CREATE POLICY "admin_transactions" ON transactions 
      FOR ALL 
      TO authenticated
      USING (is_staff_or_higher(auth.uid()))
      WITH CHECK (is_staff_or_higher(auth.uid()));
  END IF;
END $$;

-- blog_articles
DROP POLICY IF EXISTS "admin_blog_articles" ON blog_articles;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_articles' AND table_schema = 'public') THEN
    CREATE POLICY "admin_blog_articles" ON blog_articles 
      FOR ALL 
      TO authenticated
      USING (is_staff_or_higher(auth.uid()))
      WITH CHECK (is_staff_or_higher(auth.uid()));
  END IF;
END $$;

-- faq_items
DROP POLICY IF EXISTS "admin_faq_items" ON faq_items;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'faq_items' AND table_schema = 'public') THEN
    CREATE POLICY "admin_faq_items" ON faq_items 
      FOR ALL 
      TO authenticated
      USING (is_staff_or_higher(auth.uid()))
      WITH CHECK (is_staff_or_higher(auth.uid()));
  END IF;
END $$;

-- system_notifications
DROP POLICY IF EXISTS "admin_system_notifications" ON system_notifications;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_notifications' AND table_schema = 'public') THEN
    CREATE POLICY "admin_system_notifications" ON system_notifications 
      FOR ALL 
      TO authenticated
      USING (is_staff_or_higher(auth.uid()))
      WITH CHECK (is_staff_or_higher(auth.uid()));
  END IF;
END $$;

-- system_settings
DROP POLICY IF EXISTS "admin_system_settings" ON system_settings;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings' AND table_schema = 'public') THEN
    CREATE POLICY "admin_system_settings" ON system_settings 
      FOR ALL 
      TO authenticated
      USING (is_staff_or_higher(auth.uid()))
      WITH CHECK (is_staff_or_higher(auth.uid()));
  END IF;
END $$;

-- admin_actions_log
DROP POLICY IF EXISTS "admin_actions_log_policy" ON admin_actions_log;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_actions_log' AND table_schema = 'public') THEN
    CREATE POLICY "admin_actions_log_policy" ON admin_actions_log 
      FOR ALL 
      TO authenticated
      USING (is_staff_or_higher(auth.uid()))
      WITH CHECK (is_staff_or_higher(auth.uid()));
  END IF;
END $$;

-- ============================================================================
-- PART 5: Grant Service Role Full Access
-- ============================================================================

GRANT ALL ON profiles TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- ============================================================================
-- PART 6: Verification
-- ============================================================================

DO $$
DECLARE
  profile_policy_count int;
  helper_func_count int;
BEGIN
  -- Count profile policies
  SELECT COUNT(*) INTO profile_policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'profiles';
  
  -- Count helper functions
  SELECT COUNT(*) INTO helper_func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
  AND p.proname IN ('is_admin_user', 'get_user_role', 'is_staff_or_higher', 'create_user_profile_on_signup');
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Comprehensive RLS & Auth Cleanup Complete';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Profile policies: %', profile_policy_count;
  RAISE NOTICE 'Helper functions: %', helper_func_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Helper functions available:';
  RAISE NOTICE '  - is_admin_user(uuid) -> boolean';
  RAISE NOTICE '  - get_user_role(uuid) -> text';
  RAISE NOTICE '  - is_staff_or_higher(uuid) -> boolean';
  RAISE NOTICE '==============================================';
END $$;
