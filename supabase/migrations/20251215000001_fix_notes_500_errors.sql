/*
  # Fix Notes 500 Errors
  
  This migration fixes the 500 errors occurring on notes-related API calls by:
  
  1. Ensuring all required columns exist on notes table
  2. Fixing RLS policies to use correct column references
  3. Adding coalesce for user_id/created_by column references
  4. Making RLS policies more resilient to missing data
  
  The main issue is that RLS policies are failing due to column reference issues.
*/

-- ============================================================================
-- PART 1: Ensure notes table has all required columns
-- ============================================================================

-- Ensure notes table exists
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'user_id') THEN
    ALTER TABLE notes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'created_by') THEN
    ALTER TABLE notes ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'title') THEN
    ALTER TABLE notes ADD COLUMN title text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'owner_role') THEN
    ALTER TABLE notes ADD COLUMN owner_role text CHECK (owner_role IS NULL OR owner_role IN ('ceo', 'cto'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'created_for_role') THEN
    ALTER TABLE notes ADD COLUMN created_for_role text CHECK (created_for_role IS NULL OR created_for_role IN ('ceo', 'cto'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'is_shared') THEN
    ALTER TABLE notes ADD COLUMN is_shared boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'is_collaborative') THEN
    ALTER TABLE notes ADD COLUMN is_collaborative boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'category') THEN
    ALTER TABLE notes ADD COLUMN category text DEFAULT 'general';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'tags') THEN
    ALTER TABLE notes ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'is_pinned') THEN
    ALTER TABLE notes ADD COLUMN is_pinned boolean DEFAULT false;
  END IF;
END $$;

-- Backfill created_by from user_id where null
UPDATE notes SET created_by = user_id WHERE created_by IS NULL AND user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: Ensure note_shares table exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS note_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
  shared_by_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_role text CHECK (shared_with_role IS NULL OR shared_with_role IN ('ceo', 'cto')),
  permission_level text CHECK (permission_level IN ('view', 'edit')) DEFAULT 'view',
  share_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 3: Ensure note_notifications table exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS note_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text CHECK (notification_type IN ('shared', 'edited', 'unshared', 'commented')),
  is_read boolean DEFAULT false,
  sent_via text CHECK (sent_via IN ('in-app', 'email', 'both')) DEFAULT 'in-app',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE note_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: Drop ALL existing policies to start fresh
-- ============================================================================

-- Notes policies
DROP POLICY IF EXISTS "Users can view own and shared notes" ON notes;
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can view shared notes" ON notes;
DROP POLICY IF EXISTS "Users can insert notes" ON notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
DROP POLICY IF EXISTS "Users can select their own notes" ON notes;
DROP POLICY IF EXISTS "Users manage own notes" ON notes;

-- Note shares policies
DROP POLICY IF EXISTS "Users can view their shares" ON note_shares;
DROP POLICY IF EXISTS "Users can create shares" ON note_shares;
DROP POLICY IF EXISTS "Users can delete shares" ON note_shares;

-- Note notifications policies
DROP POLICY IF EXISTS "Users can view their notifications" ON note_notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON note_notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON note_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON note_notifications;

-- ============================================================================
-- PART 5: Create SIMPLE, working RLS policies for notes
-- ============================================================================

-- SELECT: Users can see notes they created (via user_id or created_by)
CREATE POLICY "notes_select_own"
  ON notes FOR SELECT
  TO authenticated
  USING (
    COALESCE(created_by, user_id) = auth.uid()
  );

-- SELECT: Users can see notes shared with them
CREATE POLICY "notes_select_shared"
  ON notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM note_shares ns
      WHERE ns.note_id = notes.id
        AND ns.shared_with_user_id = auth.uid()
    )
  );

-- SELECT: Users can see notes shared with their role
CREATE POLICY "notes_select_role_shared"
  ON notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM note_shares ns
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE ns.note_id = notes.id
        AND ns.shared_with_role = p.role
    )
  );

-- INSERT: Users can create notes (set created_by to their id)
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

-- UPDATE: Users with edit permission can update shared notes
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
-- PART 6: Create RLS policies for note_shares
-- ============================================================================

-- SELECT: Users can see shares they created or received
CREATE POLICY "note_shares_select"
  ON note_shares FOR SELECT
  TO authenticated
  USING (
    shared_by_user_id = auth.uid()
    OR shared_with_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = shared_with_role
    )
  );

-- INSERT: Users can create shares for notes they own
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

-- DELETE: Users can delete shares they created
CREATE POLICY "note_shares_delete"
  ON note_shares FOR DELETE
  TO authenticated
  USING (
    shared_by_user_id = auth.uid()
  );

-- ============================================================================
-- PART 7: Create RLS policies for note_notifications
-- ============================================================================

-- SELECT: Users can see their own notifications
CREATE POLICY "note_notifications_select"
  ON note_notifications FOR SELECT
  TO authenticated
  USING (
    recipient_user_id = auth.uid()
  );

-- UPDATE: Users can update (mark as read) their own notifications
CREATE POLICY "note_notifications_update"
  ON note_notifications FOR UPDATE
  TO authenticated
  USING (
    recipient_user_id = auth.uid()
  )
  WITH CHECK (
    recipient_user_id = auth.uid()
  );

-- INSERT: Allow inserting notifications (for sharing functionality)
CREATE POLICY "note_notifications_insert"
  ON note_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- PART 8: Create/update share_note_with_role function
-- ============================================================================

DROP FUNCTION IF EXISTS share_note_with_role(uuid, text, text, text);

CREATE OR REPLACE FUNCTION share_note_with_role(
  p_note_id uuid,
  p_target_role text,
  p_permission_level text DEFAULT 'view',
  p_share_message text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_note_owner uuid;
  v_target_users uuid[];
  v_user_id uuid;
BEGIN
  -- Get the note owner
  SELECT COALESCE(created_by, user_id) INTO v_note_owner 
  FROM notes WHERE id = p_note_id;
  
  -- Check authorization
  IF v_note_owner IS NULL OR v_note_owner <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to share this note');
  END IF;
  
  -- Get users with the target role
  SELECT ARRAY_AGG(user_id) INTO v_target_users
  FROM profiles
  WHERE role = p_target_role;
  
  -- Create the share record
  INSERT INTO note_shares (note_id, shared_by_user_id, shared_with_role, permission_level, share_message)
  VALUES (p_note_id, auth.uid(), p_target_role, p_permission_level, p_share_message)
  ON CONFLICT DO NOTHING;
  
  -- Mark note as shared
  UPDATE notes SET is_shared = true, is_collaborative = (p_permission_level = 'edit')
  WHERE id = p_note_id;
  
  IF v_target_users IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_target_users LOOP
      IF v_user_id <> auth.uid() THEN
        INSERT INTO note_notifications (note_id, recipient_user_id, notification_type, metadata)
        VALUES (p_note_id, v_user_id, 'shared', jsonb_build_object('shared_by', auth.uid(), 'message', p_share_message))
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================================
-- PART 9: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_owner_role ON notes(owner_role);
CREATE INDEX IF NOT EXISTS idx_notes_is_shared ON notes(is_shared) WHERE is_shared = true;
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_note_shares_note_id ON note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_with_user ON note_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_with_role ON note_shares(shared_with_role);

CREATE INDEX IF NOT EXISTS idx_note_notifications_recipient ON note_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_note_notifications_note_id ON note_notifications(note_id);
CREATE INDEX IF NOT EXISTS idx_note_notifications_is_read ON note_notifications(is_read) WHERE is_read = false;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

