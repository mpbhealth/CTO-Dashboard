/*
  # Fix Quick Links Schema
  
  This migration fixes the schema mismatch between the app and database:
  1. Rename 'title' column to 'name' in quick_links table
  2. Add 'click_count' column to quick_links table
*/

-- Add click_count column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quick_links' 
    AND column_name = 'click_count'
  ) THEN
    ALTER TABLE public.quick_links ADD COLUMN click_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Rename 'title' to 'name' if 'title' exists and 'name' doesn't
DO $$
BEGIN
  -- Check if 'title' exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quick_links' 
    AND column_name = 'title'
  ) THEN
    -- Check if 'name' doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'quick_links' 
      AND column_name = 'name'
    ) THEN
      ALTER TABLE public.quick_links RENAME COLUMN title TO name;
    ELSE
      -- Both exist, copy data from title to name where name is null
      UPDATE public.quick_links SET name = title WHERE name IS NULL AND title IS NOT NULL;
    END IF;
  ELSE
    -- 'title' doesn't exist, add 'name' if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'quick_links' 
      AND column_name = 'name'
    ) THEN
      ALTER TABLE public.quick_links ADD COLUMN name TEXT NOT NULL DEFAULT '';
    END IF;
  END IF;
END $$;

-- Drop 'title' column if 'name' now exists (cleanup)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quick_links' 
    AND column_name = 'title'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quick_links' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.quick_links DROP COLUMN title;
  END IF;
END $$;

-- Ensure name is NOT NULL
ALTER TABLE public.quick_links ALTER COLUMN name SET NOT NULL;

-- Add index on click_count for sorting
CREATE INDEX IF NOT EXISTS idx_quick_links_click_count ON public.quick_links(click_count DESC);

-- Add index on name for searching
CREATE INDEX IF NOT EXISTS idx_quick_links_name ON public.quick_links(name);

-- Refresh the schema cache (this helps PostgREST pick up the changes)
NOTIFY pgrst, 'reload schema';

