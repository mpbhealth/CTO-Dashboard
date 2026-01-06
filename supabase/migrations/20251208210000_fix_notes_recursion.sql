-- ============================================================================
-- FIX: Notes RLS Infinite Recursion
-- ============================================================================
-- Error: 'infinite recursion detected in policy for relation "notes"'
-- 
-- Cause: Policies on notes reference note_shares, and policies on note_shares
--        reference notes, creating a circular dependency.
--
-- Solution: Use SECURITY DEFINER functions to break the recursion cycle.
--           These functions execute with elevated privileges and bypass RLS.
-- ============================================================================

-- ============================================================================
-- PART 1: Drop ALL existing policies to start fresh
-- ============================================================================

-- Drop notes policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'notes' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON notes', pol.policyname);
    END LOOP;
END $$;

-- Drop note_shares policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'note_shares' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON note_shares', pol.policyname);
    END LOOP;
END $$;

-- Drop note_notifications policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'note_notifications' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON note_notifications', pol.policyname);
    END LOOP;
END $$;

-- ============================================================================
-- PART 2: Create SECURITY DEFINER helper functions
-- These bypass RLS to prevent recursion
-- ============================================================================

-- Function to check if user has a share for a note
CREATE OR REPLACE FUNCTION check_note_share_access(p_note_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM note_shares
    WHERE note_id = p_note_id
      AND shared_with_user_id = p_user_id
  );
$$;

-- Function to check if user's role has access to a note
CREATE OR REPLACE FUNCTION check_note_role_access(p_note_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM note_shares ns
    JOIN profiles p ON p.role = ns.shared_with_role
    WHERE ns.note_id = p_note_id
      AND p.user_id = p_user_id
      AND ns.shared_with_role IS NOT NULL
  );
$$;

-- Function to check if user was notified about a note
CREATE OR REPLACE FUNCTION check_note_notification_access(p_note_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM note_notifications
    WHERE note_id = p_note_id
      AND recipient_user_id = p_user_id
  );
$$;

-- Function to check if user owns a note (for note_shares policy)
CREATE OR REPLACE FUNCTION check_note_ownership(p_note_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM notes
    WHERE id = p_note_id
      AND COALESCE(created_by, user_id) = p_user_id
  );
$$;

-- Function to check if user has edit permission on a note
CREATE OR REPLACE FUNCTION check_note_edit_permission(p_note_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM note_shares
    WHERE note_id = p_note_id
      AND shared_with_user_id = p_user_id
      AND permission_level = 'edit'
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_note_share_access TO authenticated;
GRANT EXECUTE ON FUNCTION check_note_role_access TO authenticated;
GRANT EXECUTE ON FUNCTION check_note_notification_access TO authenticated;
GRANT EXECUTE ON FUNCTION check_note_ownership TO authenticated;
GRANT EXECUTE ON FUNCTION check_note_edit_permission TO authenticated;

-- ============================================================================
-- PART 3: Create SIMPLE notes policies (no cross-table references in policy)
-- ============================================================================

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own notes
CREATE POLICY "notes_select_own"
  ON notes FOR SELECT
  TO authenticated
  USING (COALESCE(created_by, user_id) = auth.uid());

-- SELECT: Users can view notes shared with them (uses helper function)
CREATE POLICY "notes_select_shared"
  ON notes FOR SELECT
  TO authenticated
  USING (check_note_share_access(id, auth.uid()));

-- SELECT: Users can view notes shared with their role (uses helper function)
CREATE POLICY "notes_select_role"
  ON notes FOR SELECT
  TO authenticated
  USING (check_note_role_access(id, auth.uid()));

-- SELECT: Users can view notes they were notified about (uses helper function)
CREATE POLICY "notes_select_notified"
  ON notes FOR SELECT
  TO authenticated
  USING (check_note_notification_access(id, auth.uid()));

-- INSERT: Users can create their own notes
CREATE POLICY "notes_insert"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (COALESCE(created_by, user_id) = auth.uid());

-- UPDATE: Users can update their own notes
CREATE POLICY "notes_update_own"
  ON notes FOR UPDATE
  TO authenticated
  USING (COALESCE(created_by, user_id) = auth.uid())
  WITH CHECK (COALESCE(created_by, user_id) = auth.uid());

-- UPDATE: Users with edit permission can update collaborative notes
CREATE POLICY "notes_update_collab"
  ON notes FOR UPDATE
  TO authenticated
  USING (is_collaborative = true AND check_note_edit_permission(id, auth.uid()));

-- DELETE: Users can delete their own notes
CREATE POLICY "notes_delete"
  ON notes FOR DELETE
  TO authenticated
  USING (COALESCE(created_by, user_id) = auth.uid());

-- ============================================================================
-- PART 4: Create SIMPLE note_shares policies
-- ============================================================================

ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can see shares they created
CREATE POLICY "shares_select_created"
  ON note_shares FOR SELECT
  TO authenticated
  USING (shared_by_user_id = auth.uid());

-- SELECT: Users can see shares they received
CREATE POLICY "shares_select_received"
  ON note_shares FOR SELECT
  TO authenticated
  USING (shared_with_user_id = auth.uid());

-- SELECT: Users can see role-based shares for their role
CREATE POLICY "shares_select_role"
  ON note_shares FOR SELECT
  TO authenticated
  USING (
    shared_with_role IS NOT NULL
    AND shared_with_role = (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1)
  );

-- INSERT: Users can share notes they own (uses helper function)
CREATE POLICY "shares_insert"
  ON note_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    shared_by_user_id = auth.uid()
    AND check_note_ownership(note_id, auth.uid())
  );

-- UPDATE: Users can update shares they created
CREATE POLICY "shares_update"
  ON note_shares FOR UPDATE
  TO authenticated
  USING (shared_by_user_id = auth.uid())
  WITH CHECK (shared_by_user_id = auth.uid());

-- DELETE: Users can delete shares they created
CREATE POLICY "shares_delete"
  ON note_shares FOR DELETE
  TO authenticated
  USING (shared_by_user_id = auth.uid());

-- ============================================================================
-- PART 5: Create SIMPLE note_notifications policies
-- ============================================================================

ALTER TABLE note_notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own notifications
CREATE POLICY "notifications_select"
  ON note_notifications FOR SELECT
  TO authenticated
  USING (recipient_user_id = auth.uid());

-- INSERT: Allow creating notifications
CREATE POLICY "notifications_insert"
  ON note_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Users can update their own notifications
CREATE POLICY "notifications_update"
  ON note_notifications FOR UPDATE
  TO authenticated
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

-- DELETE: Users can delete their own notifications
CREATE POLICY "notifications_delete"
  ON note_notifications FOR DELETE
  TO authenticated
  USING (recipient_user_id = auth.uid());

-- ============================================================================
-- PART 6: Grant service_role full access
-- ============================================================================

GRANT ALL ON notes TO service_role;
GRANT ALL ON note_shares TO service_role;
GRANT ALL ON note_notifications TO service_role;

-- ============================================================================
-- Notify PostgREST to reload schema
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  notes_count int;
  shares_count int;
  notif_count int;
BEGIN
  SELECT COUNT(*) INTO notes_count FROM pg_policies WHERE tablename = 'notes';
  SELECT COUNT(*) INTO shares_count FROM pg_policies WHERE tablename = 'note_shares';
  SELECT COUNT(*) INTO notif_count FROM pg_policies WHERE tablename = 'note_notifications';
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Notes Recursion Fix Complete';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Notes policies: %', notes_count;
  RAISE NOTICE 'Note shares policies: %', shares_count;
  RAISE NOTICE 'Note notifications policies: %', notif_count;
  RAISE NOTICE 'Helper functions: 5 created';
  RAISE NOTICE '==============================================';
END $$;
