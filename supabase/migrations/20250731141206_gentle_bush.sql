@@ .. @@
 -- Enable Row Level Security on assignments table
 ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
 
+-- Drop existing policies if they exist
+DROP POLICY IF EXISTS "Users can view their assignments" ON assignments;
+DROP POLICY IF EXISTS "Users can create assignments" ON assignments;
+DROP POLICY IF EXISTS "Users can update their assignments" ON assignments;
+DROP POLICY IF EXISTS "Users can delete their assignments" ON assignments;
+
 -- Create RLS policies for assignments
 CREATE POLICY "Users can view their assignments"
   ON assignments
@@ .. @@
   FOR DELETE
   TO authenticated
   USING (auth.uid() = assigned_to);