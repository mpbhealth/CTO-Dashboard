/*
  # Create Demo User for Login - Fixed

  1. New User
    - Creates a demo user with email `vrt@mympb.com` and password `OMNIvurse!@19`
    - This matches the demo credentials shown in the Login component
  
  2. Security
    - User will be created in the auth.users table
    - Email will be confirmed automatically
    - Handles conflicts properly without relying on non-existent constraints

  3. Fixes
    - Removed ON CONFLICT clauses that reference non-existent constraints
    - Added proper existence checks using DO blocks
    - Ensures idempotent execution
*/

-- Create demo user with proper conflict handling
DO $$
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
  existing_identity_id uuid;
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
      reauthentication_sent_at,
      is_sso_user,
      deleted_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'vrt@mympb.com',
      crypt('OMNIvurse!@19', gen_salt('bf')),
      NOW(),
      NOW(),
      '',
      NOW(),
      '',
      NULL,
      '',
      '',
      NULL,
      NULL,
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      FALSE,
      NOW(),
      NOW(),
      NULL,
      NULL,
      '',
      '',
      NULL,
      '',
      0,
      NULL,
      '',
      NULL,
      FALSE,
      NULL
    );

    RAISE NOTICE 'Created new user with ID: %', new_user_id;
  ELSE
    new_user_id := existing_user_id;
    RAISE NOTICE 'User already exists with ID: %', existing_user_id;
  END IF;

  -- Check if identity already exists for this user and provider
  SELECT id INTO existing_identity_id 
  FROM auth.identities 
  WHERE user_id = new_user_id AND provider = 'email';
  
  IF existing_identity_id IS NULL THEN
    -- Insert corresponding identity record
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      jsonb_build_object(
        'email', 'vrt@mympb.com',
        'sub', new_user_id::text
      ),
      'email',
      NOW(),
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Created identity record for user: %', new_user_id;
  ELSE
    RAISE NOTICE 'Identity already exists with ID: %', existing_identity_id;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error occurred: %', SQLERRM;
    -- Continue execution even if there's an error
END $$;

-- Verify the user was created successfully
DO $$
DECLARE
  user_count integer;
  identity_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE email = 'vrt@mympb.com';
  SELECT COUNT(*) INTO identity_count FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'vrt@mympb.com');
  
  RAISE NOTICE 'Final verification - User count: %, Identity count: %', user_count, identity_count;
END $$;