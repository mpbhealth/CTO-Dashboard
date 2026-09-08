/*
  # Fix Notes RLS Policies

  This migration fixes the RLS policies for notes, note_shares, and note_notifications
  to properly handle:
  1. Role-based sharing (shared_with_role)
  2. Access to notes via notifications
  3. Proper INSERT policy for note_notifications
  4. Fix share_note_with_role function to use 'profiles' table instead of 'user_profiles'
*/

-- Drop and recreate RLS policies for notes
DROP POLICY IF EXISTS "Users can view own and shared notes" ON notes;
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can view shared notes" ON notes;

-- Policy: Users can view their own notes or shared notes (including role-based shares)
CREATE POLICY "Users can view own and shared notes"
  ON notes FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() 
    OR (user_id IS NOT NULL AND user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM note_shares 
      WHERE note_shares.note_id = notes.id 
      AND (
        note_shares.shared_with_user_id = auth.uid()
        OR (
          note_shares.shared_with_role IS NOT NULL 
          AND EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = note_shares.shared_with_role
          )
        )
      )
    )
    -- Also allow viewing if user received a notification for this note
    OR EXISTS (
      SELECT 1 FROM note_notifications nn
      WHERE nn.note_id = notes.id
      AND nn.recipient_user_id = auth.uid()
    )
  );

-- Drop and recreate note_shares view policy
DROP POLICY IF EXISTS "Users can view their shares" ON note_shares;

CREATE POLICY "Users can view their shares"
  ON note_shares FOR SELECT
  TO authenticated
  USING (
    shared_by_user_id = auth.uid() 
    OR shared_with_user_id = auth.uid()
    OR (
      shared_with_role IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = shared_with_role
      )
    )
  );

-- Add INSERT policy for note_notifications
DROP POLICY IF EXISTS "Users can insert notifications" ON note_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON note_notifications;

-- Allow authenticated users to insert notifications (needed for sharing)
CREATE POLICY "Users can insert notifications"
  ON note_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Drop and recreate share_note_with_role function with correct table reference
DROP FUNCTION IF EXISTS share_note_with_role(uuid, text, text, text);

CREATE OR REPLACE FUNCTION share_note_with_role(
  p_note_id uuid,
  p_target_role text,
  p_permission_level text DEFAULT 'view',
  p_share_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_note_owner uuid;
  v_target_users uuid[];
  v_user_id uuid;
  v_share_id uuid;
BEGIN
  -- Get the note owner
  SELECT created_by INTO v_note_owner FROM notes WHERE id = p_note_id;
  
  IF v_note_owner IS NULL THEN
    SELECT user_id INTO v_note_owner FROM notes WHERE id = p_note_id;
  END IF;
  
  IF v_note_owner IS NULL OR v_note_owner != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to share this note');
  END IF;

  -- Get users with the target role (using profiles table, not user_profiles)
  SELECT ARRAY_AGG(id) INTO v_target_users
  FROM auth.users u
  WHERE EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = u.id 
    AND p.role = p_target_role
  );

  -- If no users found with that role, still create a role-based share
  INSERT INTO note_shares (note_id, shared_by_user_id, shared_with_role, permission_level, share_message)
  VALUES (p_note_id, auth.uid(), p_target_role, p_permission_level, p_share_message)
  ON CONFLICT DO NOTHING;

  -- Update the note to mark as shared
  UPDATE notes SET is_shared = true, is_collaborative = (p_permission_level = 'edit')
  WHERE id = p_note_id;

  -- Create notifications for target users
  IF v_target_users IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_target_users
    LOOP
      IF v_user_id != auth.uid() THEN
        INSERT INTO note_notifications (note_id, recipient_user_id, notification_type, metadata)
        VALUES (p_note_id, v_user_id, 'shared', jsonb_build_object('shared_by', auth.uid(), 'message', p_share_message));
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
