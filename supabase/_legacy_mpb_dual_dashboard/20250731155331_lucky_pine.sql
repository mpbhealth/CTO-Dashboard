/*
  # Add Marketing Filters Support

  1. New Columns
    - `traffic_source` (text) - Source of traffic (google, facebook, email, etc.)
    - `conversion_type` (text) - Type of conversion (signup, purchase, form_submission, etc.)

  2. Indexes
    - Add indexes for filtering performance

  3. Security
    - No RLS changes needed as existing policies cover new columns
*/

-- Add traffic_source column if it doesn't exist
ALTER TABLE marketing_metrics ADD COLUMN IF NOT EXISTS traffic_source text;

-- Add conversion_type column if it doesn't exist  
ALTER TABLE marketing_metrics ADD COLUMN IF NOT EXISTS conversion_type text;

-- Add indexes for better filter performance
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_traffic_source ON marketing_metrics(traffic_source);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_conversion_type ON marketing_metrics(conversion_type);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_property_date ON marketing_metrics(property_id, date);