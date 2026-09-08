/*
  # Create Team Members Table

  1. New Table
    - `team_members` - Store team member information with roles and status
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `role` (text, required)
      - `team` (text, required)
      - `status` (text, required) - Available, In Meeting, Focus Time, Away
      - `email` (text, optional)
      - `avatar_url` (text, optional)
      - `department` (text, required)
      - `hire_date` (date, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on team_members table
    - Add policies for authenticated users to manage team data
*/

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  team text NOT NULL,
  status text CHECK (status IN ('Available', 'In Meeting', 'Focus Time', 'Away')) NOT NULL DEFAULT 'Available',
  email text,
  avatar_url text,
  department text NOT NULL,
  hire_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can read team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to read team members (for public directory)
CREATE POLICY "Anonymous users can read team members"
  ON team_members
  FOR SELECT
  TO anon
  USING (true);

-- Insert initial team member data
INSERT INTO team_members (name, role, team, status, department, email, hire_date) VALUES
  ('Vinnie R. Tannous', 'Chief Technology Officer', 'Executive', 'Available', 'Executive', 'vinnie@mpbhealth.com', '2020-01-15'),
  ('Sarah Johnson', 'VP of Engineering', 'Engineering', 'In Meeting', 'Engineering', 'sarah@mpbhealth.com', '2021-03-10'),
  ('Michael Chen', 'Lead Backend Developer', 'Backend', 'Available', 'Engineering', 'michael@mpbhealth.com', '2021-06-20'),
  ('Emily Rodriguez', 'Frontend Team Lead', 'Frontend', 'Focus Time', 'Engineering', 'emily@mpbhealth.com', '2021-09-05'),
  ('David Kim', 'DevOps Engineer', 'Infrastructure', 'Available', 'Engineering', 'david@mpbhealth.com', '2022-01-12'),
  ('Daniel Jimenez', 'AI Engineer', 'AI & Automation', 'Available', 'Engineering', 'daniel@mpbhealth.com', '2022-04-18'),
  ('Vandana Rathore', 'Senior AI Developer', 'AI & Automation', 'In Meeting', 'Engineering', 'vandana@mpbhealth.com', '2022-07-25'),
  ('Alex Thompson', 'VP of Product', 'Product', 'Available', 'Product', 'alex@mpbhealth.com', '2021-11-30'),
  ('Maria Garcia', 'Operations Manager', 'Operations', 'Available', 'Operations', 'maria@mpbhealth.com', '2020-08-14'),
  ('Robert Wilson', 'Compliance Officer', 'Compliance', 'Focus Time', 'Compliance', 'robert@mpbhealth.com', '2020-12-03'),
  ('Carlos Silva', 'International Developer', 'International', 'Available', 'Engineering', 'carlos@mpbhealth.com', '2023-02-15'),
  ('Ana Rodriguez', 'UX Designer', 'Design', 'Available', 'Product', 'ana@mpbhealth.com', '2022-10-08');