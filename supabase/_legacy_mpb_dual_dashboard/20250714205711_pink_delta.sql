/*
  # Create Quick Links table

  1. New Tables
    - `quick_links`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `url` (text, not null)
      - `icon` (text)
      - `category` (text)
      - `click_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, references users.id)
  2. Security
    - Enable RLS on `quick_links` table
    - Add policy for authenticated users to manage their own links
    - Add policy for authenticated users to read all links
*/

-- Create Quick Links Table
CREATE TABLE IF NOT EXISTS public.quick_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  url text NOT NULL,
  icon text,
  category text,
  click_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.quick_links ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can read all quick links"
  ON public.quick_links
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own quick links"
  ON public.quick_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own quick links"
  ON public.quick_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own quick links"
  ON public.quick_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Add index for faster queries
CREATE INDEX idx_quick_links_category ON public.quick_links(category);
CREATE INDEX idx_quick_links_created_by ON public.quick_links(created_by);