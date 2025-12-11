/*
  # Fix RLS Policy Column References

  This migration fixes RLS policies that incorrectly reference column names:
  
  1. profiles table uses `user_id` to reference auth.users, NOT `id`
     - profiles.id is an auto-generated UUID (primary key)
     - profiles.user_id references auth.users(id)
     - When comparing to auth.uid(), use: profiles.user_id = auth.uid()

  2. notes table uses `created_by` as the owner column

  3. assignments table uses `assigned_to` and `assigned_by`
     - assigned_to = user assigned to the task
     - assigned_by = user who created/assigned the task
*/

-- ============================================================================
-- PART 1: notes SELECT policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own and shared notes" ON notes;
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can view shared notes" ON notes;

CREATE POLICY "Users can view own and shared notes"
  ON notes FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = created_by
    OR EXISTS (
      SELECT 1 FROM note_shares 
      WHERE note_shares.note_id = notes.id 
        AND (
          note_shares.shared_with_user_id = (SELECT auth.uid())
          OR (
            note_shares.shared_with_role IS NOT NULL 
            AND EXISTS (
              SELECT 1 FROM profiles p 
              WHERE p.user_id = (SELECT auth.uid())
                AND p.role = note_shares.shared_with_role
            )
          )
        )
    )
    OR EXISTS (
      SELECT 1 FROM note_notifications nn
      WHERE nn.note_id = notes.id
        AND nn.recipient_user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- PART 2: notes INSERT policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can insert notes" ON notes;

CREATE POLICY "Users can insert notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
  );

-- ============================================================================
-- PART 3: notes UPDATE policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can update notes" ON notes;

CREATE POLICY "Users can update notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR (
      is_collaborative = true 
      AND EXISTS (
        SELECT 1 FROM note_shares 
        WHERE note_shares.note_id = notes.id 
          AND note_shares.shared_with_user_id = (SELECT auth.uid())
          AND note_shares.permission_level = 'edit'
      )
    )
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    OR (
      is_collaborative = true 
      AND EXISTS (
        SELECT 1 FROM note_shares 
        WHERE note_shares.note_id = notes.id 
          AND note_shares.shared_with_user_id = (SELECT auth.uid())
          AND note_shares.permission_level = 'edit'
      )
    )
  );

-- ============================================================================
-- PART 4: notes DELETE policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can delete notes" ON notes;

CREATE POLICY "Users can delete notes"
  ON notes FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

-- ============================================================================
-- PART 5: note_shares SELECT policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their shares" ON note_shares;

CREATE POLICY "Users can view their shares"
  ON note_shares FOR SELECT
  TO authenticated
  USING (
    shared_by_user_id = (SELECT auth.uid()) 
    OR shared_with_user_id = (SELECT auth.uid())
    OR (
      shared_with_role IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = (SELECT auth.uid())
          AND p.role = shared_with_role
      )
    )
  );

-- ============================================================================
-- PART 6: share_note_with_role function
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
  SELECT created_by INTO v_note_owner FROM notes WHERE id = p_note_id;
  
  IF v_note_owner IS NULL OR v_note_owner <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to share this note');
  END IF;
  
  SELECT ARRAY_AGG(u.id) INTO v_target_users
  FROM auth.users u
  WHERE EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = u.id 
      AND p.role = p_target_role
  );
  
  INSERT INTO note_shares (note_id, shared_by_user_id, shared_with_role, permission_level, share_message)
  VALUES (p_note_id, auth.uid(), p_target_role, p_permission_level, p_share_message)
  ON CONFLICT DO NOTHING;
  
  UPDATE notes SET is_shared = true, is_collaborative = (p_permission_level = 'edit')
  WHERE id = p_note_id;
  
  IF v_target_users IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_target_users LOOP
      IF v_user_id <> auth.uid() THEN
        INSERT INTO note_notifications (note_id, recipient_user_id, notification_type, metadata)
        VALUES (p_note_id, v_user_id, 'shared', jsonb_build_object('shared_by', auth.uid(), 'message', p_share_message));
      END IF;
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================================
-- PART 7: assignments policies (uses assigned_to/assigned_by columns)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can create assignments" ON assignments;
DROP POLICY IF EXISTS "Users can update their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can delete their assignments" ON assignments;

CREATE POLICY "Users can view their assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    assigned_to = (SELECT auth.uid())
    OR assigned_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = (SELECT auth.uid())
        AND profiles.role IN ('ceo', 'cto', 'admin')
    )
  );

CREATE POLICY "Users can create assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    assigned_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = (SELECT auth.uid())
        AND profiles.role IN ('ceo', 'cto', 'admin')
    )
  );

CREATE POLICY "Users can update their assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (
    assigned_to = (SELECT auth.uid())
    OR assigned_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = (SELECT auth.uid())
        AND profiles.role IN ('ceo', 'cto', 'admin')
    )
  )
  WITH CHECK (
    assigned_to = (SELECT auth.uid())
    OR assigned_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = (SELECT auth.uid())
        AND profiles.role IN ('ceo', 'cto', 'admin')
    )
  );

CREATE POLICY "Users can delete their assignments"
  ON assignments FOR DELETE
  TO authenticated
  USING (
    assigned_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = (SELECT auth.uid())
        AND profiles.role IN ('ceo', 'cto', 'admin')
    )
  );

-- ============================================================================
-- PART 8: Performance indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);
CREATE INDEX IF NOT EXISTS idx_note_shares_note_id ON note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_with_user ON note_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_with_role ON note_shares(shared_with_role);
CREATE INDEX IF NOT EXISTS idx_note_notifications_note_id ON note_notifications(note_id);
CREATE INDEX IF NOT EXISTS idx_note_notifications_recipient ON note_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_by ON assignments(assigned_by);
