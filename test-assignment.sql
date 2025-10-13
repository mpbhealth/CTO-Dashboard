-- Create a test assignment to see the Teams/Email integration buttons
-- Run this in your Supabase SQL Editor

-- First, make sure you have a user record
INSERT INTO users (auth_user_id, email, full_name)
VALUES (
  (SELECT auth.uid()), -- Your current auth user ID
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  'Test User'
)
ON CONFLICT (auth_user_id) DO NOTHING;

-- Create a test assignment
INSERT INTO assignments (
  title,
  description,
  assigned_to,
  status,
  due_date
)
VALUES (
  'Test Assignment - Microsoft Teams Integration',
  'This is a test assignment to demonstrate the Teams and Email integration features. Click the purple Teams button or blue Email button to send this assignment!',
  (SELECT id FROM users WHERE auth_user_id = auth.uid()),
  'todo',
  CURRENT_DATE + INTERVAL '7 days'
);

-- Verify the assignment was created
SELECT 
  a.id,
  a.title,
  a.status,
  a.due_date,
  u.email as assigned_to_email,
  u.full_name as assigned_to_name
FROM assignments a
LEFT JOIN users u ON u.id = a.assigned_to
WHERE a.title LIKE '%Microsoft Teams Integration%'
ORDER BY a.created_at DESC
LIMIT 1;

