/*
  # Fix trigger already exists error

  1. Changes
    - Add conditional check for trigger existence before creation
    - Ensure update_modified_column function exists
    - Fix the trigger creation to avoid conflicts

  2. Notes
    - This fixes the error: trigger "update_notes_updated_at" for relation "notes" already exists
    - Uses DO block to check for trigger existence before creation
*/

-- First ensure the function exists
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if trigger exists before creating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_notes_updated_at'
    AND tgrelid = 'notes'::regclass
  ) THEN
    CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
  END IF;
END
$$;