/*
  # Create member status updates table

  1. New Tables
    - `member_status_updates`
      - `id` (uuid, primary key)
      - `member_id` (text, not null)
      - `status_date` (timestamp with time zone, not null)
      - `new_status` (text, not null, with check constraint)
      - `reason` (text)
      - `source_system` (text)
      - `created_at` (timestamp with time zone, default now())
      - `updated_at` (timestamp with time zone, default now())
  2. Security
    - Enable RLS on `member_status_updates` table
    - Add policies for authenticated users
*/

CREATE TABLE public.member_status_updates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id text NOT NULL,
    status_date timestamp with time zone NOT NULL,
    new_status text NOT NULL,
    reason text,
    source_system text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT member_status_updates_new_status_check CHECK (new_status IN ('active', 'inactive', 'lapsed', 'churned', 'on_hold', 'suspended'))
);

-- Optional: Add indexes for faster querying
CREATE INDEX idx_member_status_updates_member_id ON public.member_status_updates (member_id);
CREATE INDEX idx_member_status_updates_status_date ON public.member_status_updates (status_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.member_status_updates ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (example policies, adjust as needed)
CREATE POLICY "Allow authenticated users to read member status updates"
ON public.member_status_updates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert member status updates"
ON public.member_status_updates FOR INSERT
TO authenticated
WITH CHECK (true);