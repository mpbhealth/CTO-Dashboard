-- ============================================================================
-- FIX: Notes 500 Errors & Outlook Calendar Setup
-- ============================================================================
-- This migration fixes:
-- 1. Notes RLS policies using wrong column (p.id instead of p.user_id)
-- 2. Creates outlook_config table for calendar integration
-- ============================================================================

-- ============================================================================
-- PART 1: Fix Notes RLS Policies (critical bug fix)
-- ============================================================================

-- The existing policies incorrectly use p.id = auth.uid() 
-- but profiles.id is NOT the user_id - profiles.user_id is!

-- Drop all existing notes policies
DROP POLICY IF EXISTS "Users can view own and shared notes" ON notes;
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can view shared notes" ON notes;
DROP POLICY IF EXISTS "notes_select_own" ON notes;
DROP POLICY IF EXISTS "notes_select_shared" ON notes;
DROP POLICY IF EXISTS "notes_select_role_shared" ON notes;
DROP POLICY IF EXISTS "notes_insert" ON notes;
DROP POLICY IF EXISTS "notes_update_own" ON notes;
DROP POLICY IF EXISTS "notes_update_collaborative" ON notes;
DROP POLICY IF EXISTS "notes_delete" ON notes;
DROP POLICY IF EXISTS "Users can insert notes" ON notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

-- Drop note_shares policies
DROP POLICY IF EXISTS "Users can view their shares" ON note_shares;
DROP POLICY IF EXISTS "note_shares_select" ON note_shares;
DROP POLICY IF EXISTS "note_shares_insert" ON note_shares;
DROP POLICY IF EXISTS "note_shares_delete" ON note_shares;
DROP POLICY IF EXISTS "Users can create shares" ON note_shares;
DROP POLICY IF EXISTS "Users can delete shares" ON note_shares;

-- Drop note_notifications policies
DROP POLICY IF EXISTS "Users can view their notifications" ON note_notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON note_notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON note_notifications;
DROP POLICY IF EXISTS "note_notifications_select" ON note_notifications;
DROP POLICY IF EXISTS "note_notifications_update" ON note_notifications;
DROP POLICY IF EXISTS "note_notifications_insert" ON note_notifications;

-- ============================================================================
-- PART 2: Create CORRECTED Notes Policies
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own notes
CREATE POLICY "notes_select_own"
  ON notes FOR SELECT
  TO authenticated
  USING (
    COALESCE(created_by, user_id) = auth.uid()
  );

-- SELECT: Users can view notes shared with them directly
CREATE POLICY "notes_select_shared_direct"
  ON notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM note_shares ns
      WHERE ns.note_id = notes.id
        AND ns.shared_with_user_id = auth.uid()
    )
  );

-- SELECT: Users can view notes shared with their role
-- FIXED: Use user_id instead of id for profiles lookup
CREATE POLICY "notes_select_shared_by_role"
  ON notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM note_shares ns
      WHERE ns.note_id = notes.id
        AND ns.shared_with_role IS NOT NULL
        AND ns.shared_with_role = (
          SELECT p.role FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
        )
    )
  );

-- SELECT: Users can view notes they were notified about
CREATE POLICY "notes_select_notified"
  ON notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM note_notifications nn
      WHERE nn.note_id = notes.id
        AND nn.recipient_user_id = auth.uid()
    )
  );

-- INSERT: Users can create their own notes
CREATE POLICY "notes_insert"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(created_by, user_id) = auth.uid()
  );

-- UPDATE: Users can update their own notes
CREATE POLICY "notes_update_own"
  ON notes FOR UPDATE
  TO authenticated
  USING (
    COALESCE(created_by, user_id) = auth.uid()
  )
  WITH CHECK (
    COALESCE(created_by, user_id) = auth.uid()
  );

-- UPDATE: Users with edit permission can update collaborative notes
CREATE POLICY "notes_update_collaborative"
  ON notes FOR UPDATE
  TO authenticated
  USING (
    is_collaborative = true
    AND EXISTS (
      SELECT 1 FROM note_shares ns
      WHERE ns.note_id = notes.id
        AND ns.shared_with_user_id = auth.uid()
        AND ns.permission_level = 'edit'
    )
  );

-- DELETE: Users can delete their own notes
CREATE POLICY "notes_delete"
  ON notes FOR DELETE
  TO authenticated
  USING (
    COALESCE(created_by, user_id) = auth.uid()
  );

-- ============================================================================
-- PART 3: Create CORRECTED Note Shares Policies
-- ============================================================================

-- SELECT: Users can see shares they created, received, or for their role
CREATE POLICY "note_shares_select"
  ON note_shares FOR SELECT
  TO authenticated
  USING (
    shared_by_user_id = auth.uid()
    OR shared_with_user_id = auth.uid()
    OR (
      shared_with_role IS NOT NULL
      AND shared_with_role = (
        SELECT p.role FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
      )
    )
  );

-- INSERT: Users can share notes they own
CREATE POLICY "note_shares_insert"
  ON note_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    shared_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM notes n
      WHERE n.id = note_id
        AND COALESCE(n.created_by, n.user_id) = auth.uid()
    )
  );

-- UPDATE: Users can update shares they created
CREATE POLICY "note_shares_update"
  ON note_shares FOR UPDATE
  TO authenticated
  USING (shared_by_user_id = auth.uid())
  WITH CHECK (shared_by_user_id = auth.uid());

-- DELETE: Users can delete shares they created
CREATE POLICY "note_shares_delete"
  ON note_shares FOR DELETE
  TO authenticated
  USING (shared_by_user_id = auth.uid());

-- ============================================================================
-- PART 4: Create CORRECTED Note Notifications Policies
-- ============================================================================

-- SELECT: Users can view their own notifications
CREATE POLICY "note_notifications_select"
  ON note_notifications FOR SELECT
  TO authenticated
  USING (recipient_user_id = auth.uid());

-- UPDATE: Users can update their own notifications (mark as read)
CREATE POLICY "note_notifications_update"
  ON note_notifications FOR UPDATE
  TO authenticated
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

-- INSERT: Allow inserting notifications (for sharing functionality)
CREATE POLICY "note_notifications_insert"
  ON note_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- DELETE: Users can delete their own notifications
CREATE POLICY "note_notifications_delete"
  ON note_notifications FOR DELETE
  TO authenticated
  USING (recipient_user_id = auth.uid());

-- ============================================================================
-- PART 5: Create Outlook Config Table (for calendar integration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS outlook_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on outlook_config
ALTER TABLE outlook_config ENABLE ROW LEVEL SECURITY;

-- Only admins can access outlook_config
CREATE POLICY "outlook_config_admin_only"
  ON outlook_config FOR ALL
  TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Grant service_role full access (for edge functions)
GRANT ALL ON outlook_config TO service_role;

-- ============================================================================
-- PART 6: Create indexes for better performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_owner_role ON notes(owner_role);
CREATE INDEX IF NOT EXISTS idx_note_shares_note_id ON note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_with_user ON note_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_with_role ON note_shares(shared_with_role);
CREATE INDEX IF NOT EXISTS idx_note_notifications_recipient ON note_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_note_notifications_unread ON note_notifications(recipient_user_id, is_read) WHERE is_read = false;

-- ============================================================================
-- PART 7: Notify PostgREST to reload schema cache
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  notes_policy_count int;
  shares_policy_count int;
  notifications_policy_count int;
BEGIN
  SELECT COUNT(*) INTO notes_policy_count FROM pg_policies WHERE tablename = 'notes';
  SELECT COUNT(*) INTO shares_policy_count FROM pg_policies WHERE tablename = 'note_shares';
  SELECT COUNT(*) INTO notifications_policy_count FROM pg_policies WHERE tablename = 'note_notifications';
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Notes & Outlook Fix Complete';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Notes policies: %', notes_policy_count;
  RAISE NOTICE 'Note shares policies: %', shares_policy_count;
  RAISE NOTICE 'Note notifications policies: %', notifications_policy_count;
  RAISE NOTICE 'Outlook config table: created';
  RAISE NOTICE '==============================================';
END $$;
