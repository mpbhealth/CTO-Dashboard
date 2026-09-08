/*
  # Add Superuser Column to Profiles
  
  1. Changes
    - Add is_superuser column to profiles table for admin override capabilities
    - Set default to false
    - Mark specific admin emails as superusers
    - Create index for performance
  
  2. Security
    - Column is managed by database only
    - Cannot be set by regular users
    - Used in RLS policies for admin access
*/

-- Add is_superuser column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_superuser'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_superuser boolean DEFAULT false;
  END IF;
END $$;

-- Mark admin users as superusers
UPDATE public.profiles
SET is_superuser = true
WHERE email LIKE '%@mympb.com'
  AND (
    email LIKE 'vrt@%' 
    OR email LIKE 'catherine@%' 
    OR email LIKE 'vinnie%@%'
  );

-- Create index for superuser lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_superuser 
ON public.profiles(is_superuser) 
WHERE is_superuser = true;