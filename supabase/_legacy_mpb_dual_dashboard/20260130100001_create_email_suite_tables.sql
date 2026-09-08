/*
  # Create Email Suite Tables

  Creates tables for the email suite with Outlook and Gmail integration.

  1. New Tables
    - `user_email_accounts` - Stores user email account connections (OAuth tokens)
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References auth.users
      - `provider` (text) - 'outlook' or 'gmail'
      - `email_address` (text) - Connected email address
      - `access_token` (text) - OAuth access token
      - `refresh_token` (text) - OAuth refresh token
      - `token_expires_at` (timestamptz) - Token expiration
      - `is_default` (boolean) - Default account for user
      - `is_active` (boolean) - Whether account is active
      - `created_at`, `updated_at` (timestamptz)

    - `email_signatures` - Stores user email signatures
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References auth.users
      - `name` (text) - Signature name
      - `html_content` (text) - HTML content of signature
      - `logo_url` (text) - URL to signature logo
      - `is_default` (boolean) - Default signature for user
      - `created_at`, `updated_at` (timestamptz)

    - `email_drafts` - Stores email drafts locally
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References auth.users
      - `account_id` (uuid) - References user_email_accounts
      - `to_recipients` (jsonb) - Array of recipient objects
      - `cc_recipients` (jsonb) - Array of CC recipients
      - `bcc_recipients` (jsonb) - Array of BCC recipients
      - `subject` (text) - Email subject
      - `body_html` (text) - HTML body content
      - `attachments` (jsonb) - Array of attachment metadata
      - `in_reply_to` (text) - Message ID if reply/forward
      - `reply_type` (text) - 'reply', 'reply_all', 'forward', or null
      - `created_at`, `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

-- Create user_email_accounts table
CREATE TABLE IF NOT EXISTS user_email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('outlook', 'gmail')),
  email_address text NOT NULL,
  display_name text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[], -- Array of granted OAuth scopes
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  sync_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique email per user per provider
  UNIQUE(user_id, provider, email_address)
);

-- Create email_signatures table
CREATE TABLE IF NOT EXISTS email_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  html_content text NOT NULL DEFAULT '',
  plain_text_content text, -- Plain text fallback
  logo_url text,
  logo_width integer DEFAULT 150,
  logo_height integer,
  include_social_links boolean DEFAULT false,
  social_links jsonb DEFAULT '{}', -- { linkedin: url, twitter: url, etc }
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_drafts table
CREATE TABLE IF NOT EXISTS email_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES user_email_accounts(id) ON DELETE SET NULL,
  to_recipients jsonb DEFAULT '[]', -- [{email, name}]
  cc_recipients jsonb DEFAULT '[]',
  bcc_recipients jsonb DEFAULT '[]',
  subject text DEFAULT '',
  body_html text DEFAULT '',
  body_plain text DEFAULT '',
  signature_id uuid REFERENCES email_signatures(id) ON DELETE SET NULL,
  attachments jsonb DEFAULT '[]', -- [{name, url, size, mimeType}]
  in_reply_to text, -- Original message ID for replies
  reply_type text CHECK (reply_type IS NULL OR reply_type IN ('reply', 'reply_all', 'forward')),
  original_message_id text, -- Provider's message ID
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_sent_log for tracking sent emails
CREATE TABLE IF NOT EXISTS email_sent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES user_email_accounts(id) ON DELETE SET NULL,
  provider_message_id text, -- Message ID from provider
  to_recipients jsonb NOT NULL,
  cc_recipients jsonb DEFAULT '[]',
  bcc_recipients jsonb DEFAULT '[]',
  subject text,
  has_attachments boolean DEFAULT false,
  attachment_count integer DEFAULT 0,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'queued')),
  error_message text
);

-- Enable RLS on all tables
ALTER TABLE user_email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sent_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_email_accounts
CREATE POLICY "Users can view own email accounts"
  ON user_email_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own email accounts"
  ON user_email_accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own email accounts"
  ON user_email_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own email accounts"
  ON user_email_accounts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for email_signatures
CREATE POLICY "Users can view own signatures"
  ON email_signatures FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own signatures"
  ON email_signatures FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own signatures"
  ON email_signatures FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own signatures"
  ON email_signatures FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for email_drafts
CREATE POLICY "Users can view own drafts"
  ON email_drafts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own drafts"
  ON email_drafts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own drafts"
  ON email_drafts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own drafts"
  ON email_drafts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for email_sent_log
CREATE POLICY "Users can view own sent log"
  ON email_sent_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sent log"
  ON email_sent_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_email_accounts_user_id ON user_email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_email_accounts_active ON user_email_accounts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_email_signatures_user_id ON email_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_email_signatures_default ON email_signatures(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_email_drafts_user_id ON email_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sent_log_user_id ON email_sent_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sent_log_sent_at ON email_sent_log(sent_at DESC);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_email_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_email_accounts_updated_at ON user_email_accounts;
CREATE TRIGGER update_user_email_accounts_updated_at
  BEFORE UPDATE ON user_email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_email_tables_updated_at();

DROP TRIGGER IF EXISTS update_email_signatures_updated_at ON email_signatures;
CREATE TRIGGER update_email_signatures_updated_at
  BEFORE UPDATE ON email_signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_email_tables_updated_at();

DROP TRIGGER IF EXISTS update_email_drafts_updated_at ON email_drafts;
CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON email_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_email_tables_updated_at();

-- Function to ensure only one default account per user
CREATE OR REPLACE FUNCTION ensure_single_default_email_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE user_email_accounts
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_email_account ON user_email_accounts;
CREATE TRIGGER ensure_single_default_email_account
  AFTER INSERT OR UPDATE OF is_default ON user_email_accounts
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_email_account();

-- Function to ensure only one default signature per user
CREATE OR REPLACE FUNCTION ensure_single_default_signature()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE email_signatures
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_signature ON email_signatures;
CREATE TRIGGER ensure_single_default_signature
  AFTER INSERT OR UPDATE OF is_default ON email_signatures
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_signature();

-- Add comments for documentation
COMMENT ON TABLE user_email_accounts IS 'Stores user OAuth connections for Outlook and Gmail email accounts';
COMMENT ON TABLE email_signatures IS 'Stores user email signatures with logo and formatting';
COMMENT ON TABLE email_drafts IS 'Stores email drafts for composition';
COMMENT ON TABLE email_sent_log IS 'Tracks sent emails for audit and history';
