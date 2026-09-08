/*
  # Marketing Analytics Tables

  1. New Tables
    - `marketing_properties`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `ga_property_id` (text, nullable)
      - `ga_connected` (boolean, default false)
      - `created_at` (timestamp)
    - `marketing_metrics`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to marketing_properties)
      - `date` (date)
      - `sessions` (integer)
      - `users` (integer)
      - `bounce_rate` (float)
      - `conversions` (integer)
      - `avg_session_duration` (float)
      - `traffic_source` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add user-scoped policies for marketing_properties
    - Add property-scoped policies for marketing_metrics
*/

-- Track multiple website/project analytics targets
CREATE TABLE IF NOT EXISTS marketing_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  website_url text,
  ga_property_id text,
  ga_measurement_id text,
  ga_connected boolean DEFAULT false,
  fb_pixel_id text,
  fb_connected boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Store daily metrics (populated via webhook or API sync)
CREATE TABLE IF NOT EXISTS marketing_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES marketing_properties(id) ON DELETE CASCADE,
  date date NOT NULL,
  sessions integer DEFAULT 0,
  users integer DEFAULT 0,
  pageviews integer DEFAULT 0,
  bounce_rate float DEFAULT 0,
  conversions integer DEFAULT 0,
  avg_session_duration float DEFAULT 0,
  traffic_source text,
  campaign_name text,
  revenue numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(property_id, date, traffic_source)
);

-- Enable RLS
ALTER TABLE marketing_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_properties
CREATE POLICY "Users can view their marketing properties"
  ON marketing_properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their marketing properties"
  ON marketing_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their marketing properties"
  ON marketing_properties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their marketing properties"
  ON marketing_properties FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for marketing_metrics
CREATE POLICY "Users can view their marketing metrics"
  ON marketing_metrics FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM marketing_properties WHERE marketing_properties.id = property_id
    )
  );

CREATE POLICY "Users can insert marketing metrics"
  ON marketing_metrics FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM marketing_properties WHERE marketing_properties.id = property_id
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketing_properties_user_id ON marketing_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_property_id ON marketing_metrics(property_id);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_date ON marketing_metrics(date);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_traffic_source ON marketing_metrics(traffic_source);