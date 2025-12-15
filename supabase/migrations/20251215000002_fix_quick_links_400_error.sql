/*
  # Fix Quick Links 400 Error
  
  This migration fixes the 400 Bad Request errors on quick_links insert operations.
  
  The issue is a schema mismatch - the app sends 'name' but the table might have 'title'.
  Also ensures proper RLS policies and column configuration.
*/

-- ============================================================================
-- PART 1: Ensure table exists with base structure
-- ============================================================================

CREATE TABLE IF NOT EXISTS quick_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 2: Handle title -> name column rename
-- ============================================================================

DO $$
BEGIN
  -- Check if 'name' column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quick_links' 
    AND column_name = 'name'
  ) THEN
    -- 'name' exists - good, just drop 'title' if it still exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'quick_links' 
      AND column_name = 'title'
    ) THEN
      -- Copy any data from title to name first
      UPDATE public.quick_links SET name = title WHERE name IS NULL AND title IS NOT NULL;
      -- Drop title
      ALTER TABLE public.quick_links DROP COLUMN title;
    END IF;
  ELSE
    -- 'name' doesn't exist
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'quick_links' 
      AND column_name = 'title'
    ) THEN
      -- Rename title to name
      ALTER TABLE public.quick_links RENAME COLUMN title TO name;
    ELSE
      -- Neither exists, add name
      ALTER TABLE public.quick_links ADD COLUMN name TEXT NOT NULL DEFAULT '';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- PART 3: Ensure all required columns exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quick_links' AND column_name = 'url') THEN
    ALTER TABLE public.quick_links ADD COLUMN url TEXT NOT NULL DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quick_links' AND column_name = 'description') THEN
    ALTER TABLE public.quick_links ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quick_links' AND column_name = 'category') THEN
    ALTER TABLE public.quick_links ADD COLUMN category TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quick_links' AND column_name = 'icon') THEN
    ALTER TABLE public.quick_links ADD COLUMN icon TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quick_links' AND column_name = 'is_favorite') THEN
    ALTER TABLE public.quick_links ADD COLUMN is_favorite BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quick_links' AND column_name = 'click_count') THEN
    ALTER TABLE public.quick_links ADD COLUMN click_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quick_links' AND column_name = 'created_by') THEN
    ALTER TABLE public.quick_links ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- PART 4: Ensure name is NOT NULL
-- ============================================================================

-- Update any null names to empty string first
UPDATE public.quick_links SET name = '' WHERE name IS NULL;

-- Make name NOT NULL
ALTER TABLE public.quick_links ALTER COLUMN name SET NOT NULL;

-- ============================================================================
-- PART 5: Enable RLS
-- ============================================================================

ALTER TABLE public.quick_links ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 6: Drop and recreate RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all quick links" ON quick_links;
DROP POLICY IF EXISTS "Users can manage their own quick links" ON quick_links;
DROP POLICY IF EXISTS "Users manage own quick links" ON quick_links;
DROP POLICY IF EXISTS "CTO and admin all quick links" ON quick_links;
DROP POLICY IF EXISTS "quick_links_select" ON quick_links;
DROP POLICY IF EXISTS "quick_links_insert" ON quick_links;
DROP POLICY IF EXISTS "quick_links_update" ON quick_links;
DROP POLICY IF EXISTS "quick_links_delete" ON quick_links;

-- Everyone can view quick links
CREATE POLICY "quick_links_select"
  ON quick_links FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own quick links
CREATE POLICY "quick_links_insert"
  ON quick_links FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Users can update their own quick links OR admins/CTO/CEO can update all
CREATE POLICY "quick_links_update"
  ON quick_links FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'cto', 'ceo')
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'cto', 'ceo')
    )
  );

-- Users can delete their own quick links OR admins/CTO/CEO can delete all
CREATE POLICY "quick_links_delete"
  ON quick_links FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'cto', 'ceo')
    )
  );

-- ============================================================================
-- PART 7: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_quick_links_created_by ON quick_links(created_by);
CREATE INDEX IF NOT EXISTS idx_quick_links_category ON quick_links(category);
CREATE INDEX IF NOT EXISTS idx_quick_links_click_count ON quick_links(click_count DESC);
CREATE INDEX IF NOT EXISTS idx_quick_links_name ON quick_links(name);

-- ============================================================================
-- PART 8: Grant permissions
-- ============================================================================

GRANT ALL ON quick_links TO authenticated;
GRANT ALL ON quick_links TO service_role;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

