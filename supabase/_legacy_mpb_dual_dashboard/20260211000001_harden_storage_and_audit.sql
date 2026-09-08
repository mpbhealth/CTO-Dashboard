-- =============================================================================
-- Migration: Harden Storage Policies & Audit Log Security
-- Date: 2026-02-11
-- Description:
--   1. Restricts storage bucket access by role (ctod, ceod, shared)
--   2. Restricts DELETE to admin-only on ctod/ceod buckets
--   3. Creates a SECURITY DEFINER function for audit log inserts
--   4. Ensures RLS on email-related tables
-- =============================================================================

-- ============================================================
-- PART 1: Storage Policy Hardening
-- ============================================================

-- Helper function to get user role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ---------- CTOD bucket: CTO, admin, staff only ----------

-- Drop existing overly-permissive policies if they exist
DO $$
BEGIN
  -- Drop SELECT policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'ctod_select_policy') THEN
    DROP POLICY "ctod_select_policy" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'ctod_insert_policy') THEN
    DROP POLICY "ctod_insert_policy" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'ctod_update_policy') THEN
    DROP POLICY "ctod_update_policy" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'ctod_delete_policy') THEN
    DROP POLICY "ctod_delete_policy" ON storage.objects;
  END IF;

  -- Drop CEOD policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'ceod_select_policy') THEN
    DROP POLICY "ceod_select_policy" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'ceod_insert_policy') THEN
    DROP POLICY "ceod_insert_policy" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'ceod_update_policy') THEN
    DROP POLICY "ceod_update_policy" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'ceod_delete_policy') THEN
    DROP POLICY "ceod_delete_policy" ON storage.objects;
  END IF;
END $$;

-- CTOD bucket policies
CREATE POLICY "ctod_select_policy" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'ctod'
    AND auth.role() = 'authenticated'
    AND public.get_user_role() IN ('cto', 'admin', 'staff')
  );

CREATE POLICY "ctod_insert_policy" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'ctod'
    AND auth.role() = 'authenticated'
    AND public.get_user_role() IN ('cto', 'admin', 'staff')
  );

CREATE POLICY "ctod_update_policy" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'ctod'
    AND auth.role() = 'authenticated'
    AND public.get_user_role() IN ('cto', 'admin', 'staff')
  );

CREATE POLICY "ctod_delete_policy" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'ctod'
    AND auth.role() = 'authenticated'
    AND public.get_user_role() = 'admin'
  );

-- ---------- CEOD bucket: CEO, CFO, CMO, admin only ----------

CREATE POLICY "ceod_select_policy" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'ceod'
    AND auth.role() = 'authenticated'
    AND public.get_user_role() IN ('ceo', 'cfo', 'cmo', 'admin')
  );

CREATE POLICY "ceod_insert_policy" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'ceod'
    AND auth.role() = 'authenticated'
    AND public.get_user_role() IN ('ceo', 'cfo', 'cmo', 'admin')
  );

CREATE POLICY "ceod_update_policy" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'ceod'
    AND auth.role() = 'authenticated'
    AND public.get_user_role() IN ('ceo', 'cfo', 'cmo', 'admin')
  );

CREATE POLICY "ceod_delete_policy" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'ceod'
    AND auth.role() = 'authenticated'
    AND public.get_user_role() = 'admin'
  );

-- ---------- Shared bucket: all authenticated (keep permissive) ----------
-- No changes needed for shared bucket


-- ============================================================
-- PART 2: Audit Log INSERT Restriction
-- ============================================================

-- Create a SECURITY DEFINER function that handles audit log insertions
-- This prevents arbitrary inserts by authenticated users
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb,
  p_ip_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.hipaa_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    created_at
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    p_ip_address,
    now()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Restrict direct INSERT on hipaa_audit_log to service_role only
-- Drop any existing permissive insert policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'hipaa_audit_log'
    AND policyname LIKE '%insert%'
  ) THEN
    -- We can't easily drop by pattern, so let's handle known names
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert audit logs" ON public.hipaa_audit_log';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.hipaa_audit_log';
    EXECUTE 'DROP POLICY IF EXISTS "audit_log_insert_policy" ON public.hipaa_audit_log';
  END IF;
END $$;

-- Only allow inserts via the SECURITY DEFINER function (runs as definer, not the user)
-- Users should call log_audit_event() instead of INSERT directly
CREATE POLICY "audit_log_insert_service_only" ON public.hipaa_audit_log
  FOR INSERT
  WITH CHECK (false);
  -- Direct inserts are blocked; use log_audit_event() function instead

-- Ensure SELECT is still allowed for authorized users (read their own audit logs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'hipaa_audit_log'
    AND policyname = 'audit_log_select_own'
  ) THEN
    CREATE POLICY "audit_log_select_own" ON public.hipaa_audit_log
      FOR SELECT
      USING (
        auth.role() = 'authenticated'
        AND (
          user_id = auth.uid()
          OR public.get_user_role() IN ('admin', 'cto', 'ceo')
        )
      );
  END IF;
END $$;


-- ============================================================
-- PART 3: Email Suite Table RLS Verification
-- ============================================================

-- Ensure RLS is enabled on email tables
ALTER TABLE IF EXISTS public.user_email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_sent_log ENABLE ROW LEVEL SECURITY;

-- Add refreshing_token flag for token refresh race condition protection
ALTER TABLE IF EXISTS public.user_email_accounts
  ADD COLUMN IF NOT EXISTS refreshing_token boolean DEFAULT false;

-- user_email_accounts: users can only access their own accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_email_accounts'
    AND policyname = 'email_accounts_own_select'
  ) THEN
    CREATE POLICY "email_accounts_own_select" ON public.user_email_accounts
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_email_accounts'
    AND policyname = 'email_accounts_own_insert'
  ) THEN
    CREATE POLICY "email_accounts_own_insert" ON public.user_email_accounts
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_email_accounts'
    AND policyname = 'email_accounts_own_update'
  ) THEN
    CREATE POLICY "email_accounts_own_update" ON public.user_email_accounts
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_email_accounts'
    AND policyname = 'email_accounts_own_delete'
  ) THEN
    CREATE POLICY "email_accounts_own_delete" ON public.user_email_accounts
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- email_sent_log: users can only access their own sent logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'email_sent_log'
    AND policyname = 'email_sent_log_own_select'
  ) THEN
    CREATE POLICY "email_sent_log_own_select" ON public.email_sent_log
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'email_sent_log'
    AND policyname = 'email_sent_log_own_insert'
  ) THEN
    CREATE POLICY "email_sent_log_own_insert" ON public.email_sent_log
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
