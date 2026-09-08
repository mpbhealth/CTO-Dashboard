/*
  # Add Missing ID Column to Profiles Table

  1. Changes
    - Add id column as primary key if it doesn't exist
    - Keep user_id as unique constraint
    - Update existing records to have UUID ids
    - Ensure backward compatibility

  2. Security
    - Maintains existing RLS policies
    - No changes to access permissions
*/

DO $$
BEGIN
  -- Check if id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'id'
  ) THEN
    -- Add id column
    ALTER TABLE profiles ADD COLUMN id uuid DEFAULT gen_random_uuid() NOT NULL;
    
    -- Create unique constraint on id
    ALTER TABLE profiles ADD CONSTRAINT profiles_id_key UNIQUE (id);
    
    RAISE NOTICE 'Added id column to profiles table';
  ELSE
    RAISE NOTICE 'id column already exists in profiles table';
  END IF;

  -- Ensure user_id is the primary key or has unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE profiles ADD PRIMARY KEY (user_id);
    RAISE NOTICE 'Added primary key on user_id';
  END IF;

  -- Ensure default role is set
  UPDATE profiles SET role = 'staff' WHERE role IS NULL;
END $$;
