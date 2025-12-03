/*
  # Fix Note Sharing Policies
  
  This migration safely drops and recreates all note sharing policies.
  Run this if you get "policy already exists" errors.
*/

-- Drop existing policies on notes table (if they exist)
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can view shared notes" ON notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update collaborative notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

-- Drop existing policies on note_shares table (if they exist)
DROP POLICY IF EXISTS "Users can view shares for their notes" ON note_shares;
DROP POLICY IF EXISTS "Users can view shares shared with them" ON note_shares;
DROP POLICY IF EXISTS "Users can create shares for their notes" ON note_shares;
DROP POLICY IF EXISTS "Users can delete shares they created" ON note_shares;

-- Drop existing policies on note_notifications table (if they exist)
DROP POLICY IF EXISTS "Users can view their own notifications" ON note_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON note_notifications;
DROP POLICY IF EXISTS "System can create notifications" ON note_notifications;

-- Drop existing policies on note_comments table (if they exist)
DROP POLICY IF EXISTS "Users can view comments on accessible notes" ON note_comments;
DROP POLICY IF EXISTS "Users can create comments on accessible notes" ON note_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON note_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON note_comments;

-- =============================================
-- Recreate all policies
-- =============================================

-- Notes policies
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can view shared notes"
  ON notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM note_shares
      WHERE note_shares.note_id = notes.id
      AND note_shares.shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update collaborative notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM note_shares
      WHERE note_shares.note_id = notes.id
      AND note_shares.shared_with_user_id = auth.uid()
      AND note_shares.permission_level = 'edit'
    )
  );

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Note shares policies
CREATE POLICY "Users can view shares for their notes"
  ON note_shares FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_shares.note_id
      AND notes.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view shares shared with them"
  ON note_shares FOR SELECT
  TO authenticated
  USING (shared_with_user_id = auth.uid());

CREATE POLICY "Users can create shares for their notes"
  ON note_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_shares.note_id
      AND notes.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete shares they created"
  ON note_shares FOR DELETE
  TO authenticated
  USING (shared_by_user_id = auth.uid());

-- Note notifications policies
CREATE POLICY "Users can view their own notifications"
  ON note_notifications FOR SELECT
  TO authenticated
  USING (recipient_user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON note_notifications FOR UPDATE
  TO authenticated
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON note_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Note comments policies
CREATE POLICY "Users can view comments on accessible notes"
  ON note_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_comments.note_id
      AND (
        notes.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM note_shares
          WHERE note_shares.note_id = notes.id
          AND note_shares.shared_with_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create comments on accessible notes"
  ON note_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_comments.note_id
      AND (
        notes.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM note_shares
          WHERE note_shares.note_id = notes.id
          AND note_shares.shared_with_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own comments"
  ON note_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON note_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

