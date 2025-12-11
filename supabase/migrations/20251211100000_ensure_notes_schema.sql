/*
  # Ensure Notes Table Schema for Daily Organizer

  This migration ensures the notes table has all required columns for the 
  enhanced notes system with sharing capabilities.

  1. Columns Added (if not exists):
    - title (text) - Optional note title
    - owner_role (text) - 'ceo' or 'cto' indicating dashboard ownership
    - created_for_role (text) - Role the note was created for
    - is_shared (boolean) - Whether note is shared
    - is_collaborative (boolean) - Whether note allows collaborative editing
    - created_by (uuid) - User who created the note
    - category (text) - Note category
    - tags (text[]) - Array of tags
    - is_pinned (boolean) - Whether note is pinned

  2. Security:
    - Updates RLS policies for enhanced access control
*/

-- Ensure notes table exists with base structure
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add new columns if they don't exist
DO $$
BEGIN
  -- Add title column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'title') THEN
    ALTER TABLE notes ADD COLUMN title text;
  END IF;

  -- Add owner_role column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'owner_role') THEN
    ALTER TABLE notes ADD COLUMN owner_role text CHECK (owner_role IN ('ceo', 'cto'));
  END IF;

  -- Add created_for_role column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'created_for_role') THEN
    ALTER TABLE notes ADD COLUMN created_for_role text CHECK (created_for_role IN ('ceo', 'cto'));
  END IF;

  -- Add is_shared column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'is_shared') THEN
    ALTER TABLE notes ADD COLUMN is_shared boolean DEFAULT false;
  END IF;

  -- Add is_collaborative column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'is_collaborative') THEN
    ALTER TABLE notes ADD COLUMN is_collaborative boolean DEFAULT false;
  END IF;

  -- Add created_by column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'created_by') THEN
    ALTER TABLE notes ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Add category column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'category') THEN
    ALTER TABLE notes ADD COLUMN category text DEFAULT 'general';
  END IF;

  -- Add tags column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'tags') THEN
    ALTER TABLE notes ADD COLUMN tags text[] DEFAULT '{}';
  END IF;

  -- Add is_pinned column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'is_pinned') THEN
    ALTER TABLE notes ADD COLUMN is_pinned boolean DEFAULT false;
  END IF;

  -- Add user_id column if it doesn't exist (for legacy compatibility)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'user_id') THEN
    ALTER TABLE notes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill created_by from user_id where null (only if user_id column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'user_id') THEN
    UPDATE notes SET created_by = user_id WHERE created_by IS NULL AND user_id IS NOT NULL;
  END IF;
END $$;

-- Backfill owner_role for existing notes (default to 'cto' for existing notes)
UPDATE notes SET owner_role = 'cto' WHERE owner_role IS NULL;

-- Create note_shares table if not exists
CREATE TABLE IF NOT EXISTS note_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
  shared_by_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_role text CHECK (shared_with_role IN ('ceo', 'cto')),
  permission_level text CHECK (permission_level IN ('view', 'edit')) DEFAULT 'view',
  share_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create note_notifications table if not exists
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

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_owner_role ON notes(owner_role);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_is_shared ON notes(is_shared);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_note_shares_note_id ON note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_with ON note_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_note_notifications_recipient ON note_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_note_notifications_unread ON note_notifications(is_read) WHERE is_read = false;

-- Drop and recreate RLS policies for notes
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can view shared notes" ON notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
DROP POLICY IF EXISTS "Users can select their own notes" ON notes;

-- Policy: Users can view their own notes or shared notes
CREATE POLICY "Users can view own and shared notes"
  ON notes FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() 
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM note_shares 
      WHERE note_shares.note_id = notes.id 
      AND note_shares.shared_with_user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own notes
CREATE POLICY "Users can insert notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() OR user_id = auth.uid()
  );

-- Policy: Users can update their own notes or collaborative shared notes
CREATE POLICY "Users can update notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() 
    OR user_id = auth.uid()
    OR (
      is_collaborative = true 
      AND EXISTS (
        SELECT 1 FROM note_shares 
        WHERE note_shares.note_id = notes.id 
        AND note_shares.shared_with_user_id = auth.uid()
        AND note_shares.permission_level = 'edit'
      )
    )
  );

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete notes"
  ON notes FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR user_id = auth.uid());

-- Policies for note_shares
DROP POLICY IF EXISTS "Users can view their shares" ON note_shares;
DROP POLICY IF EXISTS "Users can create shares" ON note_shares;
DROP POLICY IF EXISTS "Users can delete shares" ON note_shares;

CREATE POLICY "Users can view their shares"
  ON note_shares FOR SELECT
  TO authenticated
  USING (
    shared_by_user_id = auth.uid() 
    OR shared_with_user_id = auth.uid()
  );

CREATE POLICY "Users can create shares"
  ON note_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    shared_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM notes WHERE notes.id = note_id AND (notes.created_by = auth.uid() OR notes.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete shares"
  ON note_shares FOR DELETE
  TO authenticated
  USING (shared_by_user_id = auth.uid());

-- Policies for note_notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON note_notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON note_notifications;

CREATE POLICY "Users can view their notifications"
  ON note_notifications FOR SELECT
  TO authenticated
  USING (recipient_user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON note_notifications FOR UPDATE
  TO authenticated
  USING (recipient_user_id = auth.uid());

-- Create or replace function for sharing notes with a role
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

  -- Get users with the target role
  SELECT ARRAY_AGG(id) INTO v_target_users
  FROM auth.users u
  WHERE EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = u.id 
    AND up.role = p_target_role
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
