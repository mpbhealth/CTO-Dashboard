/*
  # Create Marketing Analytics Tables

  1. New Tables
    - `marketing_properties`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, property name)
      - `website_url` (text, optional website URL)
      - `ga_property_id` (text, optional Google Analytics property ID)
      - `ga_measurement_id` (text, optional GA measurement ID)
      - `ga_connected` (boolean, GA connection status)
      - `fb_pixel_id` (text, optional Facebook pixel ID)
      - `fb_connected` (boolean, Facebook connection status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `marketing_metrics`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to marketing_properties)
      - `date` (date, metric date)
      - `sessions` (integer, session count)
      - `users` (integer, user count)
      - `pageviews` (integer, pageview count)
      - `bounce_rate` (numeric, bounce rate percentage)
      - `conversions` (integer, conversion count)
      - `avg_session_duration` (numeric, average session duration)
      - `traffic_source` (text, optional traffic source)
      - `campaign_name` (text, optional campaign name)
      - `revenue` (numeric, revenue amount)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for user-based access control
*/

-- Create marketing_properties table
CREATE TABLE IF NOT EXISTS public.marketing_properties (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  website_url text,
  ga_property_id text,
  ga_measurement_id text,
  ga_connected boolean DEFAULT false NOT NULL,
  fb_pixel_id text,
  fb_connected boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT marketing_properties_pkey PRIMARY KEY (id),
  CONSTRAINT marketing_properties_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Enable RLS on marketing_properties
ALTER TABLE public.marketing_properties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for marketing_properties
CREATE POLICY "Users can view their marketing properties"
  ON public.marketing_properties
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their marketing properties"
  ON public.marketing_properties
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their marketing properties"
  ON public.marketing_properties
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their marketing properties"
  ON public.marketing_properties
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create marketing_metrics table
CREATE TABLE IF NOT EXISTS public.marketing_metrics (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  property_id uuid NOT NULL,
  date date NOT NULL,
  sessions integer DEFAULT 0 NOT NULL,
  users integer DEFAULT 0 NOT NULL,
  pageviews integer DEFAULT 0 NOT NULL,
  bounce_rate numeric DEFAULT 0.0 NOT NULL,
  conversions integer DEFAULT 0 NOT NULL,
  avg_session_duration numeric DEFAULT 0.0 NOT NULL,
  traffic_source text,
  campaign_name text,
  revenue numeric DEFAULT 0.0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT marketing_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT marketing_metrics_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.marketing_properties (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT marketing_metrics_property_id_date_traffic_source_key UNIQUE (property_id, date, traffic_source)
);

-- Enable RLS on marketing_metrics
ALTER TABLE public.marketing_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for marketing_metrics
CREATE POLICY "Users can view metrics for their properties"
  ON public.marketing_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketing_properties
      WHERE marketing_properties.id = marketing_metrics.property_id
      AND marketing_properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert metrics for their properties"
  ON public.marketing_metrics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.marketing_properties
      WHERE marketing_properties.id = marketing_metrics.property_id
      AND marketing_properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update metrics for their properties"
  ON public.marketing_metrics
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.marketing_properties
      WHERE marketing_properties.id = marketing_metrics.property_id
      AND marketing_properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete metrics for their properties"
  ON public.marketing_metrics
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.marketing_properties
      WHERE marketing_properties.id = marketing_metrics.property_id
      AND marketing_properties.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketing_properties_user_id ON public.marketing_properties (user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_property_id ON public.marketing_metrics (property_id);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_date ON public.marketing_metrics (date DESC);