/*
  # Note Sharing System for CEO and CTO Dashboards

  1. Schema Changes to Existing Tables
    - Extend `notes` table with sharing and collaboration fields
    - Add `owner_role` (text: 'ceo' or 'cto') - which dashboard owns the note
    - Add `created_for_role` (text: 'ceo' or 'cto' or null) - if note was created specifically for someone
    - Add `is_shared` (boolean) - quick flag for shared notes
    - Add `is_collaborative` (boolean) - if recipients can edit
    - Add `title` (text) - note title for better organization
    - Update existing `user_id` to `created_by` for consistency

  2. New Tables
    - `note_shares` - Junction table for granular sharing permissions
      - `id` (uuid, primary key)
      - `note_id` (uuid, foreign key to notes)
      - `shared_by_user_id` (uuid, foreign key to auth.users)
      - `shared_with_user_id` (uuid, foreign key to auth.users)
      - `shared_with_role` (text: 'ceo' or 'cto')
      - `permission_level` (text: 'view' or 'edit')
      - `share_message` (text, optional message when sharing)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `note_notifications` - Track notifications for shared notes
      - `id` (uuid, primary key)
      - `note_id` (uuid, foreign key to notes)
      - `recipient_user_id` (uuid, foreign key to auth.users)
      - `notification_type` (text: 'shared', 'edited', 'unshared', 'commented')
      - `is_read` (boolean)
      - `sent_via` (text: 'in-app', 'email', 'both')
      - `metadata` (jsonb, additional context)
      - `created_at` (timestamptz)

    - `note_comments` - Comments on shared notes
      - `id` (uuid, primary key)
      - `note_id` (uuid, foreign key to notes)
      - `user_id` (uuid, foreign key to auth.users)
      - `comment_text` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on all tables
    - Users can view their own notes
    - Users can view notes shared with them
    - Users can edit notes they own or have edit permission for
    - Users can share their own notes
    - Users can view their own notifications

  4. Indexes
    - Add indexes on owner_role, created_by, is_shared for efficient queries
    - Add indexes on note_shares for quick lookups
    - Add indexes on notifications for unread counts
*/

-- First, safely rename user_id to created_by in notes table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'user_id'
  ) THEN
    -- Check if created_by already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'notes' AND column_name = 'created_by'
    ) THEN
      ALTER TABLE notes RENAME COLUMN user_id TO created_by;
    ELSE
      -- If both exist, copy data and drop user_id
      UPDATE notes SET created_by = user_id WHERE created_by IS NULL;
      ALTER TABLE notes DROP COLUMN IF EXISTS user_id;
    END IF;
  END IF;
END $$;

-- Add new columns to notes table
DO $$
BEGIN
  -- Add owner_role if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'owner_role') THEN
    ALTER TABLE notes ADD COLUMN owner_role text CHECK (owner_role IN ('ceo', 'cto'));
  END IF;

  -- Add created_for_role if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'created_for_role') THEN
    ALTER TABLE notes ADD COLUMN created_for_role text CHECK (created_for_role IN ('ceo', 'cto'));
  END IF;

  -- Add is_shared if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'is_shared') THEN
    ALTER TABLE notes ADD COLUMN is_shared boolean DEFAULT false;
  END IF;

  -- Add is_collaborative if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'is_collaborative') THEN
    ALTER TABLE notes ADD COLUMN is_collaborative boolean DEFAULT false;
  END IF;

  -- Add title if not exists (some migrations may have already added it)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'title') THEN
    ALTER TABLE notes ADD COLUMN title text;
  END IF;

  -- Safely drop NOT NULL constraint from title if it exists
  BEGIN
    ALTER TABLE notes ALTER COLUMN title DROP NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore error if constraint doesn't exist
  END;
END $$;

-- Ensure created_by is not null
ALTER TABLE notes ALTER COLUMN created_by SET NOT NULL;

-- Create note_shares table
CREATE TABLE IF NOT EXISTS note_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_role text CHECK (shared_with_role IN ('ceo', 'cto')) NOT NULL,
  permission_level text CHECK (permission_level IN ('view', 'edit')) DEFAULT 'view' NOT NULL,
  share_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(note_id, shared_with_user_id)
);

-- Create note_notifications table
CREATE TABLE IF NOT EXISTS note_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type text CHECK (notification_type IN ('shared', 'edited', 'unshared', 'commented')) NOT NULL,
  is_read boolean DEFAULT false,
  sent_via text CHECK (sent_via IN ('in-app', 'email', 'both')) DEFAULT 'both',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create note_comments table
CREATE TABLE IF NOT EXISTS note_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Backfill existing notes with owner_role based on user's profile role
DO $$
DECLARE
  note_record RECORD;
  user_role text;
BEGIN
  FOR note_record IN SELECT id, created_by FROM notes WHERE owner_role IS NULL
  LOOP
    -- Get the user's role from profiles
    SELECT role INTO user_role
    FROM profiles
    WHERE id = note_record.created_by
    LIMIT 1;

    -- Default to 'cto' if no profile found
    IF user_role IS NULL THEN
      user_role := 'cto';
    END IF;

    -- Update the note with owner_role
    UPDATE notes
    SET owner_role = user_role
    WHERE id = note_record.id;
  END LOOP;
END $$;

-- Make owner_role required after backfill
ALTER TABLE notes ALTER COLUMN owner_role SET NOT NULL;

-- Create indexes for notes table
CREATE INDEX IF NOT EXISTS idx_notes_owner_role ON notes(owner_role);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_is_shared ON notes(is_shared) WHERE is_shared = true;
CREATE INDEX IF NOT EXISTS idx_notes_created_for_role ON notes(created_for_role) WHERE created_for_role IS NOT NULL;

-- Create indexes for note_shares table
CREATE INDEX IF NOT EXISTS idx_note_shares_note_id ON note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_by ON note_shares(shared_by_user_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_with ON note_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_with_role ON note_shares(shared_with_role);

-- Create indexes for note_notifications table
CREATE INDEX IF NOT EXISTS idx_note_notifications_recipient ON note_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_note_notifications_note_id ON note_notifications(note_id);
CREATE INDEX IF NOT EXISTS idx_note_notifications_is_read ON note_notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_note_notifications_created_at ON note_notifications(created_at DESC);

-- Create indexes for note_comments table
CREATE INDEX IF NOT EXISTS idx_note_comments_note_id ON note_comments(note_id);
CREATE INDEX IF NOT EXISTS idx_note_comments_user_id ON note_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_note_comments_created_at ON note_comments(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing note policies to recreate them
DROP POLICY IF EXISTS "Users manage own notes" ON notes;
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

-- Notes RLS Policies

-- Users can view their own notes
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Users can view notes shared with them
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

-- Users can create notes
CREATE POLICY "Users can create notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Users can update their own notes
CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Users can update shared notes if they have edit permission
CREATE POLICY "Users can edit shared notes with permission"
  ON notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM note_shares
      WHERE note_shares.note_id = notes.id
      AND note_shares.shared_with_user_id = auth.uid()
      AND note_shares.permission_level = 'edit'
      AND notes.is_collaborative = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM note_shares
      WHERE note_shares.note_id = notes.id
      AND note_shares.shared_with_user_id = auth.uid()
      AND note_shares.permission_level = 'edit'
      AND notes.is_collaborative = true
    )
  );

-- Users can delete their own notes
CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Note Shares RLS Policies

-- Users can view shares of their own notes
CREATE POLICY "Users can view shares of their notes"
  ON note_shares FOR SELECT
  TO authenticated
  USING (
    shared_by_user_id = auth.uid()
    OR shared_with_user_id = auth.uid()
  );

-- Users can create shares for their own notes
CREATE POLICY "Users can share their notes"
  ON note_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    shared_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_shares.note_id
      AND notes.created_by = auth.uid()
    )
  );

-- Users can update shares of their own notes
CREATE POLICY "Users can update shares of their notes"
  ON note_shares FOR UPDATE
  TO authenticated
  USING (shared_by_user_id = auth.uid())
  WITH CHECK (shared_by_user_id = auth.uid());

-- Users can delete shares of their own notes
CREATE POLICY "Users can unshare their notes"
  ON note_shares FOR DELETE
  TO authenticated
  USING (shared_by_user_id = auth.uid());

-- Note Notifications RLS Policies

-- Users can view their own notifications
CREATE POLICY "Users can view their notifications"
  ON note_notifications FOR SELECT
  TO authenticated
  USING (recipient_user_id = auth.uid());

-- System can create notifications (authenticated users for now)
CREATE POLICY "System can create notifications"
  ON note_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications"
  ON note_notifications FOR UPDATE
  TO authenticated
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete their notifications"
  ON note_notifications FOR DELETE
  TO authenticated
  USING (recipient_user_id = auth.uid());

-- Note Comments RLS Policies

-- Users can view comments on notes they have access to
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

-- Users can create comments on notes they have access to
CREATE POLICY "Users can comment on accessible notes"
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

-- Users can update their own comments
CREATE POLICY "Users can update their comments"
  ON note_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete their comments"
  ON note_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_note_shares_updated_at
  BEFORE UPDATE ON note_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_comments_updated_at
  BEFORE UPDATE ON note_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create helper function to get users by role
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

-- Create helper function to share note with role
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
