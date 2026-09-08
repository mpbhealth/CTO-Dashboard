/*
  # Create member_enrollments table for enrollment data import
  
  1. New Tables
    - `member_enrollments` - Stores enrollment data imported from 3rd party system
      - `id` (uuid, primary key)
      - `enrollment_id` (text, unique)
      - `member_id` (text)
      - `enrollment_date` (timestamp with time zone)
      - `program_name` (text)
      - `enrollment_status` (text, constrained)
      - `enrollment_source` (text)
      - `premium_amount` (numeric)
      - `renewal_date` (date)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
  
  2. Security
    - Enable RLS on `member_enrollments` table
    - Add policies for authenticated users to read/write enrollment data
  
  3. Indexes
    - Add indexes for frequently queried columns (date, member_id, status)
*/

-- Create member_enrollments table
CREATE TABLE public.member_enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id text NOT NULL UNIQUE,
    member_id text NOT NULL,
    enrollment_date timestamp with time zone NOT NULL,
    program_name text NOT NULL,
    enrollment_status text NOT NULL,
    enrollment_source text,
    premium_amount numeric NOT NULL,
    renewal_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT member_enrollments_status_check CHECK (enrollment_status IN ('active', 'pending', 'cancelled', 'lapsed', 'completed'))
);

-- Add indexes for faster querying
CREATE INDEX idx_member_enrollments_date ON public.member_enrollments (enrollment_date DESC);
CREATE INDEX idx_member_enrollments_member_id ON public.member_enrollments (member_id);
CREATE INDEX idx_member_enrollments_status ON public.member_enrollments (enrollment_status);

-- Enable Row Level Security (RLS) for this table
ALTER TABLE public.member_enrollments ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow authenticated users to read member enrollments"
ON public.member_enrollments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert member enrollments"
ON public.member_enrollments FOR INSERT
TO authenticated
WITH CHECK (true);