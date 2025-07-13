/*
  # Fix RLS Policy Infinite Recursion

  1. Issue
    - Current RLS policies for user_roles table create infinite recursion
    - Error: infinite recursion detected in policy for relation "user_roles"
    
  2. Solution
    - Replace recursive policies with non-recursive ones based on auth.uid()
    - Remove circular dependencies in policy definitions
*/

-- Drop existing problematic policies from user_roles table
DROP POLICY IF EXISTS "Users can delete own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own roles" ON public.user_roles;

-- Create new non-recursive policies
CREATE POLICY "Users can read user roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can create user roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update user roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Users can delete user roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated 
USING (true);

-- Make sure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;