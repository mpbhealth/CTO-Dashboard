/*
  # Add Missing Roadmap Columns

  1. Schema Changes
    - Add `quarter` column for roadmap item timeline
    - Add `owner` column for roadmap item assignment
    - Add `department` column for department categorization

  2. Purpose
    - Ensure compatibility with existing Roadmap component
    - Allow filtering by quarter, owner, and department
    - Maintain data integrity for CEO and CTO dashboards
*/

-- Add missing columns to roadmap_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roadmap_items' AND column_name = 'quarter'
  ) THEN
    ALTER TABLE public.roadmap_items
    ADD COLUMN quarter TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roadmap_items' AND column_name = 'owner'
  ) THEN
    ALTER TABLE public.roadmap_items
    ADD COLUMN owner TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roadmap_items' AND column_name = 'department'
  ) THEN
    ALTER TABLE public.roadmap_items
    ADD COLUMN department TEXT;
  END IF;
END $$;

-- Add helpful comment
COMMENT ON COLUMN public.roadmap_items.quarter IS 'Timeline quarter (e.g., Q1 2025, Q2 2025)';
COMMENT ON COLUMN public.roadmap_items.owner IS 'Person or team responsible for this roadmap item';
COMMENT ON COLUMN public.roadmap_items.department IS 'Department this roadmap item belongs to';
