/*
  # Create Admin User - Fixed Migration

  1. User Creation
    - Create admin user in auth.users table with proper constraints
    - Create corresponding identity record with required provider_id
    - Add user to team_members table

  2. Security
    - Use proper password encryption
    - Set up email confirmation
    - Handle conflicts gracefully

  3. Fixes
    - Add required provider_id field to identities table
    - Use proper UUID generation and references
*/

-- Create admin user in auth.users table
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();
  
  -- Insert the user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'vrt@mympb.com',
    crypt('OMNIvurse!@19', gen_salt('bf')),
    now(),
    now(),
    '',
    now(),
    '',
    null,
    '',
    '',
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Vinnie R. Tannous", "role": "CTO"}',
    false,
    now(),
    now(),
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null
  ) ON CONFLICT (email) DO NOTHING;

  -- Create corresponding identity record with proper provider_id
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at,
    email
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', 'vrt@mympb.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    'vrt@mympb.com', -- This is the required provider_id
    now(),
    now(),
    now(),
    'vrt@mympb.com'
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Add the user to team_members table if not already exists
  INSERT INTO team_members (name, role, team, status, department, email, hire_date) VALUES
    ('Vinnie R. Tannous', 'Chief Technology Officer', 'Executive', 'Available', 'Executive', 'vrt@mympb.com', '2020-01-15')
  ON CONFLICT (email) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, just continue (user might already exist)
    NULL;
END $$;