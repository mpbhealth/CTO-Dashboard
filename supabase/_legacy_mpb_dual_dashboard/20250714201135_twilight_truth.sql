/*
  # Create notes table

  1. New Tables
     - `notes` - Stores user notes with content and timestamps
       - `id` (uuid, primary key)
       - `content` (text)
       - `created_at` (timestamptz)
       - `updated_at` (timestamptz)
       - `user_id` (uuid, foreign key to auth.users)
     
  2. Security
     - Enable RLS on `notes` table
     - Add policies for authenticated users to manage their own notes
     - Create trigger to auto-update the updated_at timestamp
*/

-- Create the notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create policies
CREATE POLICY "Users can select their own notes" 
  ON notes
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" 
  ON notes
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
  ON notes
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
  ON notes
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);