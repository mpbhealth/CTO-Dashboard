/*
  # Add Missing Roadmap Columns

  ## Overview
  Adds missing columns to roadmap_items table that are referenced in the UI but don't exist in the schema.

  ## Changes
  1. Add quarter column for quarterly planning
  2. Add owner column for ownership tracking (text field for now)
  3. Add department column for departmental organization

  ## Notes
  - Uses safe ALTER TABLE with IF NOT EXISTS checks
  - Maintains backward compatibility with existing data
*/

-- Add quarter column for quarterly planning
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roadmap_items' AND column_name = 'quarter'
  ) THEN
    ALTER TABLE public.roadmap_items ADD COLUMN quarter TEXT;
  END IF;
END $$;

-- Add owner column (text field for flexibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roadmap_items' AND column_name = 'owner'
  ) THEN
    ALTER TABLE public.roadmap_items ADD COLUMN owner TEXT;
  END IF;
END $$;

-- Add department column for organizational tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roadmap_items' AND column_name = 'department'
  ) THEN
    ALTER TABLE public.roadmap_items ADD COLUMN department TEXT;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_roadmap_quarter ON public.roadmap_items(quarter);
CREATE INDEX IF NOT EXISTS idx_roadmap_department ON public.roadmap_items(department);