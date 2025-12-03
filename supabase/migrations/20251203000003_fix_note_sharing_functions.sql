/*
  # Fix Note Sharing Functions
  
  This migration creates/replaces the note sharing RPC functions.
  Run this if you get 400 errors on share_note_with_role.
*/

-- Helper function to get users by role
CREATE OR REPLACE FUNCTION get_users_by_role(target_role text)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    u.email,
    COALESCE(p.full_name, u.email) as full_name
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.role = target_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main function to share a note with all users of a specific role
CREATE OR REPLACE FUNCTION share_note_with_role(
  p_note_id uuid,
  p_target_role text,
  p_permission_level text DEFAULT 'view',
  p_share_message text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_note_owner uuid;
  v_target_user RECORD;
  v_shares_created int := 0;
  v_result json;
BEGIN
  -- Verify the note exists and user owns it
  SELECT created_by INTO v_note_owner
  FROM notes
  WHERE id = p_note_id AND created_by = auth.uid();

  IF v_note_owner IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Note not found or you do not have permission to share it'
    );
  END IF;

  -- Update note to mark as shared and collaborative if edit permission
  UPDATE notes
  SET
    is_shared = true,
    is_collaborative = (p_permission_level = 'edit')
  WHERE id = p_note_id;

  -- Create shares for all users with target role
  FOR v_target_user IN
    SELECT user_id FROM get_users_by_role(p_target_role)
  LOOP
    -- Don't share with yourself
    IF v_target_user.user_id != auth.uid() THEN
      -- Insert or update share
      INSERT INTO note_shares (
        note_id,
        shared_by_user_id,
        shared_with_user_id,
        shared_with_role,
        permission_level,
        share_message
      )
      VALUES (
        p_note_id,
        auth.uid(),
        v_target_user.user_id,
        p_target_role,
        p_permission_level,
        p_share_message
      )
      ON CONFLICT (note_id, shared_with_user_id)
      DO UPDATE SET
        permission_level = EXCLUDED.permission_level,
        share_message = EXCLUDED.share_message,
        updated_at = now();

      -- Create notification
      INSERT INTO note_notifications (
        note_id,
        recipient_user_id,
        notification_type,
        sent_via,
        metadata
      )
      VALUES (
        p_note_id,
        v_target_user.user_id,
        'shared',
        'both',
        json_build_object(
          'shared_by', auth.uid(),
          'permission_level', p_permission_level,
          'share_message', p_share_message
        )
      );

      v_shares_created := v_shares_created + 1;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'shares_created', v_shares_created,
    'note_id', p_note_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

