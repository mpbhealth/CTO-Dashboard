/*
  # Create Demo User Account

  1. User Creation
    - Create admin user with email: vrt@mympb.com
    - Set password: OMNIvurse!@19
    - Add proper identity record with required provider_id
    - Update team_members table with user info

  2. Security
    - Properly encrypt password using crypt function
    - Set email as confirmed
    - Create proper identity record to avoid constraint violations
*/

-- Create the demo user account
DO $$
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'vrt@mympb.com';
  
  IF existing_user_id IS NULL THEN
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
    -- Insert the user into auth.users
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
      '{"name": "Vinnie R. Tannous", "role": "CTO", "title": "Chief Technology Officer"}',
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
    );

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
        'phone_verified', false,
        'provider', 'email'
      ),
      'email',
      'vrt@mympb.com', -- This is the required provider_id (email address for email provider)
      now(),
      now(),
      now(),
      'vrt@mympb.com'
    );

    RAISE NOTICE 'Created new user with ID: %', new_user_id;
  ELSE
    RAISE NOTICE 'User already exists with ID: %', existing_user_id;
    new_user_id := existing_user_id;
  END IF;

  -- Update or insert into team_members table
  INSERT INTO team_members (name, role, team, status, department, email, hire_date) 
  VALUES (
    'Vinnie R. Tannous', 
    'Chief Technology Officer', 
    'Executive', 
    'Available', 
    'Executive', 
    'vrt@mympb.com', 
    '2020-01-15'
  )
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    team = EXCLUDED.team,
    department = EXCLUDED.department,
    updated_at = now();

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error occurred: %', SQLERRM;
    -- Continue execution even if there's an error
END $$;

-- Verify the user was created
DO $$
DECLARE
  user_count integer;
  identity_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE email = 'vrt@mympb.com';
  SELECT COUNT(*) INTO identity_count FROM auth.identities WHERE email = 'vrt@mympb.com';
  
  RAISE NOTICE 'User count: %, Identity count: %', user_count, identity_count;
END $$;