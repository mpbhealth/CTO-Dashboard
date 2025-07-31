/*
  # Create Users and Assignments Tables

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `avatar_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `assignments`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `assigned_to` (uuid, references users)
      - `project_id` (uuid, references projects, optional)
      - `status` (text, with validation)
      - `due_date` (date, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated user access
    - Users can only access their own assignments

  3. Performance
    - Add indexes for efficient queries
    - Optimize for common lookups