/*
# Fix Duplicate Trigger Issues

1. Clean Up Existing Triggers
  - Drop existing triggers that may conflict
  - Recreate them safely using proper patterns

2. Security
  - No impact on RLS policies
  - Only affects trigger definitions
*/

-- Fix the duplicate trigger issue for notes table
DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;

-- Recreate the trigger safely
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Also fix assignments trigger if it exists
DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.assignments;

-- Create assignments trigger safely  
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure the trigger functions exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';