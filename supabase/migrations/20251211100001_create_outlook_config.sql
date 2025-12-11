/*
  # Create Outlook Calendar Configuration Table

  Creates a table to store Microsoft Graph API credentials for Outlook calendar integration.

  1. New Tables
    - `outlook_config` - Stores Microsoft Graph API configuration
      - `id` (uuid, primary key)
      - `tenant_id` (text) - Azure AD tenant ID
      - `client_id` (text) - Azure AD app client ID
      - `client_secret` (text, encrypted) - Azure AD app client secret
      - `access_token` (text) - Current access token
      - `refresh_token` (text) - Refresh token for token renewal
      - `token_expires_at` (timestamptz) - Token expiration time
      - `is_active` (boolean) - Whether this configuration is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Only admins can view/modify configuration
*/

-- Create outlook_config table
CREATE TABLE IF NOT EXISTS outlook_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  user_email text, -- Optional: specific user email for delegated access
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE outlook_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view configuration
CREATE POLICY "Admins can view outlook config"
  ON outlook_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'cto', 'ceo')
    )
  );

-- Only admins can modify configuration
CREATE POLICY "Admins can modify outlook config"
  ON outlook_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index on is_active for quick lookups
CREATE INDEX IF NOT EXISTS idx_outlook_config_active ON outlook_config(is_active) WHERE is_active = true;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_outlook_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_outlook_config_updated_at ON outlook_config;
CREATE TRIGGER update_outlook_config_updated_at
  BEFORE UPDATE ON outlook_config
  FOR EACH ROW
  EXECUTE FUNCTION update_outlook_config_updated_at();

-- Add comment for documentation
COMMENT ON TABLE outlook_config IS 'Stores Microsoft Graph API configuration for Outlook calendar integration';
