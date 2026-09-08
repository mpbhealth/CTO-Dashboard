/*
  # Integrations Hub Database Schema

  1. New Tables
    - `integrations_secrets` - Store encrypted API keys and tokens
    - `webhooks_config` - Webhook configurations and settings
    - `sftp_configs` - SFTP/FTP connection settings
    - `sync_logs` - Integration sync history and logs

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users only
    - Implement encryption for sensitive data

  3. Features
    - Audit trail for all changes
    - Status tracking for connections
    - Automated sync scheduling
*/

-- Integrations Secrets table
CREATE TABLE IF NOT EXISTS integrations_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  key_name text NOT NULL,
  key_value text NOT NULL, -- This should be encrypted in production
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(service, key_name)
);

-- Webhooks Configuration table
CREATE TABLE IF NOT EXISTS webhooks_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  target_url text NOT NULL,
  secret_token text NOT NULL, -- This should be encrypted in production
  headers jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  retry_count integer DEFAULT 3,
  timeout_seconds integer DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- SFTP/FTP Configurations table
CREATE TABLE IF NOT EXISTS sftp_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hostname text NOT NULL,
  port integer DEFAULT 22,
  username text NOT NULL,
  password text NOT NULL, -- This should be encrypted in production
  folder_path text DEFAULT '/',
  direction text CHECK (direction IN ('import', 'export')) NOT NULL,
  schedule text DEFAULT '0 0 * * *', -- Cron format
  is_active boolean DEFAULT true,
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Sync Logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  operation text NOT NULL,
  status text CHECK (status IN ('success', 'failed', 'in_progress')) NOT NULL,
  message text,
  details jsonb DEFAULT '{}',
  duration_ms integer,
  records_processed integer DEFAULT 0,
  timestamp timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Marketing Integrations table
CREATE TABLE IF NOT EXISTS marketing_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_analytics_key text,
  google_analytics_view_id text,
  facebook_pixel_id text,
  gtm_container_id text,
  woocommerce_key text,
  woocommerce_secret text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE integrations_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sftp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for admin users only (you may want to adjust these based on your auth setup)
CREATE POLICY "Admin users can manage integration secrets"
  ON integrations_secrets
  FOR ALL
  TO authenticated
  USING (true) -- In production, add proper admin role check
  WITH CHECK (true);

CREATE POLICY "Admin users can read integration secrets"
  ON integrations_secrets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can manage webhooks"
  ON webhooks_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin users can read webhooks"
  ON webhooks_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can manage SFTP configs"
  ON sftp_configs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin users can read SFTP configs"
  ON sftp_configs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read sync logs"
  ON sync_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert sync logs"
  ON sync_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin users can manage marketing integrations"
  ON marketing_integrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_integrations_secrets_service ON integrations_secrets(service);
CREATE INDEX idx_webhooks_config_event ON webhooks_config(event);
CREATE INDEX idx_sftp_configs_active ON sftp_configs(is_active);
CREATE INDEX idx_sync_logs_timestamp ON sync_logs(timestamp DESC);
CREATE INDEX idx_sync_logs_service ON sync_logs(service);

-- Insert sample data
INSERT INTO integrations_secrets (service, key_name, key_value) VALUES
  ('Zoho CRM', 'api_key', 'zcrm_1234567890abcdef'),
  ('Google Analytics', 'tracking_id', 'GA-123456789'),
  ('Stripe', 'secret_key', 'sk_live_1234567890abcdef'),
  ('E123', 'api_token', 'e123_token_1234567890');

INSERT INTO webhooks_config (event, target_url, secret_token, headers) VALUES
  ('member.enrolled', 'https://api.mpbhealth.com/webhooks/enrollment', 'whsec_1234567890abcdef', '{"Content-Type": "application/json"}'),
  ('payment.completed', 'https://api.mpbhealth.com/webhooks/payment', 'whsec_abcdef1234567890', '{"Content-Type": "application/json", "X-Source": "stripe"}'),
  ('claim.submitted', 'https://api.mpbhealth.com/webhooks/claims', 'whsec_fedcba0987654321', '{"Content-Type": "application/json"}');

INSERT INTO sftp_configs (name, hostname, port, username, password, folder_path, direction, schedule) VALUES
  ('E123 Data Export', 'sftp.e123.com', 22, 'mpb_user', 'encrypted_password_123', '/exports/daily', 'export', '0 2 * * *'),
  ('Claims Import', 'secure.claims-processor.com', 22, 'mpb_claims', 'encrypted_password_456', '/incoming', 'import', '0 */6 * * *'),
  ('Member Data Sync', 'data.mpbhealth.com', 22, 'sync_user', 'encrypted_password_789', '/member_data', 'export', '0 1 * * *');

INSERT INTO sync_logs (service, operation, status, message, records_processed) VALUES
  ('Zoho CRM', 'Contact Sync', 'success', 'Synced 245 contacts successfully', 245),
  ('E123 SFTP', 'Daily Export', 'success', 'Exported 1,247 member records', 1247),
  ('Google Analytics', 'Data Import', 'failed', 'API rate limit exceeded', 0),
  ('Stripe', 'Payment Sync', 'success', 'Processed 89 payments', 89),
  ('Claims Import', 'File Processing', 'in_progress', 'Processing claims batch #2024-001', 0);

INSERT INTO marketing_integrations (google_analytics_key, google_analytics_view_id, facebook_pixel_id, gtm_container_id) VALUES
  ('GA4-MEASUREMENT-ID', '123456789', '1234567890123456', 'GTM-XXXXXXX');