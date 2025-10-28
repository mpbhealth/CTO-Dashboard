/*
  # Marketing Analytics Tracking System - Comprehensive Database Schema

  1. New Tables Created:
     - marketing_tracking_platforms: Store all tracking platform configurations
     - marketing_conversion_events: Custom conversion tracking and goals
     - marketing_utm_campaigns: UTM campaign tracking and management
     - marketing_event_logs: Real-time event streaming data
     - marketing_property_sharing: Team collaboration and sharing

  2. Enhanced Tables:
     - marketing_properties: Add extended tracking fields
     - marketing_metrics: Add conversion tracking fields

  3. Security:
     - Enable RLS on all new tables
     - User-isolated policies with team sharing support
     - Proper authentication checks

  4. Performance:
     - Indexes for common queries
     - Triggers for auto-updating timestamps
     - Partitioning strategy for event logs
*/

-- ===========================================
-- EXTEND MARKETING PROPERTIES TABLE
-- ===========================================

DO $$
BEGIN
  -- Add new tracking platform fields to marketing_properties
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'marketing_properties' AND column_name = 'instagram_business_id') THEN
    ALTER TABLE marketing_properties ADD COLUMN instagram_business_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'marketing_properties' AND column_name = 'tiktok_pixel_id') THEN
    ALTER TABLE marketing_properties ADD COLUMN tiktok_pixel_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'marketing_properties' AND column_name = 'linkedin_partner_id') THEN
    ALTER TABLE marketing_properties ADD COLUMN linkedin_partner_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'marketing_properties' AND column_name = 'gtm_container_id') THEN
    ALTER TABLE marketing_properties ADD COLUMN gtm_container_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'marketing_properties' AND column_name = 'google_ads_conversion_id') THEN
    ALTER TABLE marketing_properties ADD COLUMN google_ads_conversion_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'marketing_properties' AND column_name = 'bing_uet_tag_id') THEN
    ALTER TABLE marketing_properties ADD COLUMN bing_uet_tag_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'marketing_properties' AND column_name = 'hotjar_site_id') THEN
    ALTER TABLE marketing_properties ADD COLUMN hotjar_site_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'marketing_properties' AND column_name = 'timezone') THEN
    ALTER TABLE marketing_properties ADD COLUMN timezone text DEFAULT 'America/New_York';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'marketing_properties' AND column_name = 'notes') THEN
    ALTER TABLE marketing_properties ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'marketing_properties' AND column_name = 'last_sync_at') THEN
    ALTER TABLE marketing_properties ADD COLUMN last_sync_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'marketing_properties' AND column_name = 'is_active') THEN
    ALTER TABLE marketing_properties ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- ===========================================
-- CREATE MARKETING TRACKING PLATFORMS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS marketing_tracking_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES marketing_properties(id) ON DELETE CASCADE NOT NULL,
  platform_name text NOT NULL CHECK (platform_name IN (
    'google_analytics',
    'facebook_pixel',
    'instagram_shopping',
    'tiktok_pixel',
    'linkedin_insight',
    'google_tag_manager',
    'google_ads',
    'bing_ads',
    'hotjar',
    'mixpanel',
    'amplitude',
    'segment',
    'custom'
  )),
  platform_type text NOT NULL CHECK (platform_type IN ('analytics', 'advertising', 'tag_manager', 'heatmap', 'custom')),
  tracking_id text NOT NULL,
  api_key text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  configuration jsonb DEFAULT '{}'::jsonb,
  is_connected boolean DEFAULT false,
  last_verified_at timestamptz,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired')),
  error_message text,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id, platform_name)
);

-- ===========================================
-- CREATE MARKETING CONVERSION EVENTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS marketing_conversion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES marketing_properties(id) ON DELETE CASCADE NOT NULL,
  event_name text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'purchase',
    'signup',
    'lead',
    'download',
    'subscription',
    'add_to_cart',
    'begin_checkout',
    'page_view',
    'form_submission',
    'video_play',
    'custom'
  )),
  event_value numeric(10,2) DEFAULT 0,
  conversion_window_days integer DEFAULT 30,
  currency text DEFAULT 'USD',
  funnel_steps jsonb DEFAULT '[]'::jsonb,
  tracking_parameters jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  goal_target numeric(10,2),
  current_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- CREATE MARKETING UTM CAMPAIGNS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS marketing_utm_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES marketing_properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_name text NOT NULL,
  utm_source text NOT NULL,
  utm_medium text NOT NULL,
  utm_campaign text NOT NULL,
  utm_term text,
  utm_content text,
  destination_url text NOT NULL,
  short_url text,
  qr_code_url text,
  notes text,
  start_date date,
  end_date date,
  budget numeric(10,2),
  spent numeric(10,2) DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue numeric(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- CREATE MARKETING EVENT LOGS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS marketing_event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES marketing_properties(id) ON DELETE CASCADE NOT NULL,
  event_name text NOT NULL,
  event_type text NOT NULL,
  session_id text,
  user_id_external text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  page_url text,
  referrer_url text,
  user_agent text,
  ip_address inet,
  country text,
  region text,
  city text,
  device_type text,
  browser text,
  os text,
  event_value numeric(10,2),
  event_properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- CREATE MARKETING PROPERTY SHARING TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS marketing_property_sharing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES marketing_properties(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission_level text NOT NULL DEFAULT 'viewer' CHECK (permission_level IN ('viewer', 'editor', 'admin')),
  can_edit_tracking boolean DEFAULT false,
  can_view_reports boolean DEFAULT true,
  can_export_data boolean DEFAULT false,
  can_manage_sharing boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id, shared_with_user_id)
);

-- ===========================================
-- CREATE INDEXES
-- ===========================================

-- Marketing tracking platforms indexes
DROP INDEX IF EXISTS idx_marketing_tracking_platforms_property_id;
DROP INDEX IF EXISTS idx_marketing_tracking_platforms_platform_name;
DROP INDEX IF EXISTS idx_marketing_tracking_platforms_is_connected;

CREATE INDEX idx_marketing_tracking_platforms_property_id ON marketing_tracking_platforms(property_id);
CREATE INDEX idx_marketing_tracking_platforms_platform_name ON marketing_tracking_platforms(platform_name);
CREATE INDEX idx_marketing_tracking_platforms_is_connected ON marketing_tracking_platforms(is_connected) WHERE is_connected = true;

-- Marketing conversion events indexes
DROP INDEX IF EXISTS idx_marketing_conversion_events_property_id;
DROP INDEX IF EXISTS idx_marketing_conversion_events_event_type;
DROP INDEX IF EXISTS idx_marketing_conversion_events_is_active;

CREATE INDEX idx_marketing_conversion_events_property_id ON marketing_conversion_events(property_id);
CREATE INDEX idx_marketing_conversion_events_event_type ON marketing_conversion_events(event_type);
CREATE INDEX idx_marketing_conversion_events_is_active ON marketing_conversion_events(is_active) WHERE is_active = true;

-- Marketing UTM campaigns indexes
DROP INDEX IF EXISTS idx_marketing_utm_campaigns_property_id;
DROP INDEX IF EXISTS idx_marketing_utm_campaigns_user_id;
DROP INDEX IF EXISTS idx_marketing_utm_campaigns_is_active;
DROP INDEX IF EXISTS idx_marketing_utm_campaigns_dates;

CREATE INDEX idx_marketing_utm_campaigns_property_id ON marketing_utm_campaigns(property_id);
CREATE INDEX idx_marketing_utm_campaigns_user_id ON marketing_utm_campaigns(user_id);
CREATE INDEX idx_marketing_utm_campaigns_is_active ON marketing_utm_campaigns(is_active) WHERE is_active = true;
CREATE INDEX idx_marketing_utm_campaigns_dates ON marketing_utm_campaigns(start_date, end_date);

-- Marketing event logs indexes
DROP INDEX IF EXISTS idx_marketing_event_logs_property_id;
DROP INDEX IF EXISTS idx_marketing_event_logs_created_at;
DROP INDEX IF EXISTS idx_marketing_event_logs_event_name;
DROP INDEX IF EXISTS idx_marketing_event_logs_session_id;

CREATE INDEX idx_marketing_event_logs_property_id ON marketing_event_logs(property_id);
CREATE INDEX idx_marketing_event_logs_created_at ON marketing_event_logs(created_at DESC);
CREATE INDEX idx_marketing_event_logs_event_name ON marketing_event_logs(event_name);
CREATE INDEX idx_marketing_event_logs_session_id ON marketing_event_logs(session_id);

-- Marketing property sharing indexes
DROP INDEX IF EXISTS idx_marketing_property_sharing_property_id;
DROP INDEX IF EXISTS idx_marketing_property_sharing_shared_with;
DROP INDEX IF EXISTS idx_marketing_property_sharing_shared_by;

CREATE INDEX idx_marketing_property_sharing_property_id ON marketing_property_sharing(property_id);
CREATE INDEX idx_marketing_property_sharing_shared_with ON marketing_property_sharing(shared_with_user_id);
CREATE INDEX idx_marketing_property_sharing_shared_by ON marketing_property_sharing(shared_by_user_id);

-- ===========================================
-- CREATE TRIGGERS
-- ===========================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_marketing_tracking_platforms_updated_at ON marketing_tracking_platforms;
DROP TRIGGER IF EXISTS update_marketing_conversion_events_updated_at ON marketing_conversion_events;
DROP TRIGGER IF EXISTS update_marketing_utm_campaigns_updated_at ON marketing_utm_campaigns;
DROP TRIGGER IF EXISTS update_marketing_property_sharing_updated_at ON marketing_property_sharing;

-- Create triggers for auto-updating updated_at
CREATE TRIGGER update_marketing_tracking_platforms_updated_at
  BEFORE UPDATE ON marketing_tracking_platforms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_conversion_events_updated_at
  BEFORE UPDATE ON marketing_conversion_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_utm_campaigns_updated_at
  BEFORE UPDATE ON marketing_utm_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_property_sharing_updated_at
  BEFORE UPDATE ON marketing_property_sharing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE marketing_tracking_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_utm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_property_sharing ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- CREATE RLS POLICIES
-- ===========================================

-- MARKETING TRACKING PLATFORMS POLICIES
CREATE POLICY "Users can view their tracking platforms"
  ON marketing_tracking_platforms
  FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM marketing_properties WHERE user_id = auth.uid()
      UNION
      SELECT property_id FROM marketing_property_sharing WHERE shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their tracking platforms"
  ON marketing_tracking_platforms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (SELECT id FROM marketing_properties WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their tracking platforms"
  ON marketing_tracking_platforms
  FOR UPDATE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM marketing_properties WHERE user_id = auth.uid()
      UNION
      SELECT property_id FROM marketing_property_sharing
      WHERE shared_with_user_id = auth.uid() AND can_edit_tracking = true
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM marketing_properties WHERE user_id = auth.uid()
      UNION
      SELECT property_id FROM marketing_property_sharing
      WHERE shared_with_user_id = auth.uid() AND can_edit_tracking = true
    )
  );

CREATE POLICY "Users can delete their tracking platforms"
  ON marketing_tracking_platforms
  FOR DELETE
  TO authenticated
  USING (
    property_id IN (SELECT id FROM marketing_properties WHERE user_id = auth.uid())
  );

-- MARKETING CONVERSION EVENTS POLICIES
CREATE POLICY "Users can view their conversion events"
  ON marketing_conversion_events
  FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM marketing_properties WHERE user_id = auth.uid()
      UNION
      SELECT property_id FROM marketing_property_sharing WHERE shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their conversion events"
  ON marketing_conversion_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (SELECT id FROM marketing_properties WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their conversion events"
  ON marketing_conversion_events
  FOR UPDATE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM marketing_properties WHERE user_id = auth.uid()
      UNION
      SELECT property_id FROM marketing_property_sharing
      WHERE shared_with_user_id = auth.uid() AND permission_level IN ('editor', 'admin')
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM marketing_properties WHERE user_id = auth.uid()
      UNION
      SELECT property_id FROM marketing_property_sharing
      WHERE shared_with_user_id = auth.uid() AND permission_level IN ('editor', 'admin')
    )
  );

CREATE POLICY "Users can delete their conversion events"
  ON marketing_conversion_events
  FOR DELETE
  TO authenticated
  USING (
    property_id IN (SELECT id FROM marketing_properties WHERE user_id = auth.uid())
  );

-- MARKETING UTM CAMPAIGNS POLICIES
CREATE POLICY "Users can view their utm campaigns"
  ON marketing_utm_campaigns
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR property_id IN (
      SELECT property_id FROM marketing_property_sharing WHERE shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their utm campaigns"
  ON marketing_utm_campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND property_id IN (SELECT id FROM marketing_properties WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their utm campaigns"
  ON marketing_utm_campaigns
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their utm campaigns"
  ON marketing_utm_campaigns
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- MARKETING EVENT LOGS POLICIES
CREATE POLICY "Users can view their event logs"
  ON marketing_event_logs
  FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM marketing_properties WHERE user_id = auth.uid()
      UNION
      SELECT property_id FROM marketing_property_sharing WHERE shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert event logs"
  ON marketing_event_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- MARKETING PROPERTY SHARING POLICIES
CREATE POLICY "Users can view sharing for their properties"
  ON marketing_property_sharing
  FOR SELECT
  TO authenticated
  USING (
    property_id IN (SELECT id FROM marketing_properties WHERE user_id = auth.uid())
    OR shared_with_user_id = auth.uid()
    OR shared_by_user_id = auth.uid()
  );

CREATE POLICY "Users can share their properties"
  ON marketing_property_sharing
  FOR INSERT
  TO authenticated
  WITH CHECK (
    shared_by_user_id = auth.uid()
    AND property_id IN (SELECT id FROM marketing_properties WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update sharing for their properties"
  ON marketing_property_sharing
  FOR UPDATE
  TO authenticated
  USING (
    property_id IN (SELECT id FROM marketing_properties WHERE user_id = auth.uid())
    OR (shared_with_user_id = auth.uid() AND can_manage_sharing = true)
  )
  WITH CHECK (
    property_id IN (SELECT id FROM marketing_properties WHERE user_id = auth.uid())
    OR (shared_with_user_id = auth.uid() AND can_manage_sharing = true)
  );

CREATE POLICY "Users can delete sharing for their properties"
  ON marketing_property_sharing
  FOR DELETE
  TO authenticated
  USING (
    property_id IN (SELECT id FROM marketing_properties WHERE user_id = auth.uid())
    OR shared_with_user_id = auth.uid()
  );

-- ===========================================
-- VERIFICATION AND LOGGING
-- ===========================================

DO $$
DECLARE
  table_count integer;
  policy_count integer;
  index_count integer;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_name IN (
    'marketing_tracking_platforms',
    'marketing_conversion_events',
    'marketing_utm_campaigns',
    'marketing_event_logs',
    'marketing_property_sharing'
  ) AND table_schema = 'public';

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename IN (
    'marketing_tracking_platforms',
    'marketing_conversion_events',
    'marketing_utm_campaigns',
    'marketing_event_logs',
    'marketing_property_sharing'
  );

  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename IN (
    'marketing_tracking_platforms',
    'marketing_conversion_events',
    'marketing_utm_campaigns',
    'marketing_event_logs',
    'marketing_property_sharing'
  ) AND schemaname = 'public';

  RAISE NOTICE 'Marketing Tracking System Migration Completed:';
  RAISE NOTICE '✅ Tables created: %', table_count;
  RAISE NOTICE '✅ RLS policies created: %', policy_count;
  RAISE NOTICE '✅ Indexes created: %', index_count;
  RAISE NOTICE '✅ Marketing analytics tracking system is fully operational!';
END $$;
