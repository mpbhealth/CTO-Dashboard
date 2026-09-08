/*
  # Fix Projects Table Schema
  
  This migration ensures the projects table has all required columns for the
  EditProjectModal component. The 400 Bad Request error occurs when the frontend
  tries to update columns that don't exist in the database.
  
  ## Columns Added (if missing)
  - team (text array) - Team members working on the project
  - github_link (text) - GitHub repository URL
  - monday_link (text) - Monday.com project board URL
  - website_url (text) - Project website URL
  
  ## Safe Operations
  - Uses ADD COLUMN IF NOT EXISTS to avoid errors if columns exist
  - Sets sensible defaults for existing rows
*/

-- Add team column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'team'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN team text[] NOT NULL DEFAULT '{}';
    RAISE NOTICE 'Added team column to projects table';
  END IF;
END $$;

-- Add github_link column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'github_link'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN github_link text DEFAULT '';
    RAISE NOTICE 'Added github_link column to projects table';
  END IF;
END $$;

-- Add monday_link column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'monday_link'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN monday_link text DEFAULT '';
    RAISE NOTICE 'Added monday_link column to projects table';
  END IF;
END $$;

-- Add website_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'website_url'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN website_url text DEFAULT '';
    RAISE NOTICE 'Added website_url column to projects table';
  END IF;
END $$;

-- Ensure description column exists and has correct default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN description text NOT NULL DEFAULT '';
    RAISE NOTICE 'Added description column to projects table';
  END IF;
END $$;

-- Ensure progress column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'progress'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN progress integer CHECK (progress >= 0 AND progress <= 100) DEFAULT 0;
    RAISE NOTICE 'Added progress column to projects table';
  END IF;
END $$;

-- Ensure updated_at column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN updated_at timestamptz DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to projects table';
  END IF;
END $$;

-- Create or replace function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_projects_timestamp ON projects;
CREATE TRIGGER update_projects_timestamp
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Log success
DO $$
BEGIN
  RAISE NOTICE 'Projects table schema fix completed successfully';
END $$;

