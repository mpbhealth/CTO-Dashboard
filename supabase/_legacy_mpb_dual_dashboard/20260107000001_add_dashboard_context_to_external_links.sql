-- Add dashboard_context and thumbnail_url columns to external_project_links
-- This enables dashboard-specific link collections for CEO/CTO Command Center

-- Add dashboard_context column to specify which dashboard the link belongs to
ALTER TABLE external_project_links 
ADD COLUMN IF NOT EXISTS dashboard_context TEXT DEFAULT 'global';

-- Add thumbnail_url column for custom/cached website thumbnails
ALTER TABLE external_project_links 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add index for faster filtering by dashboard context
CREATE INDEX IF NOT EXISTS idx_external_project_links_dashboard_context 
ON external_project_links(user_id, dashboard_context);

-- Comment on columns
COMMENT ON COLUMN external_project_links.dashboard_context IS 'Dashboard context: ceo, cto, or global (visible in both)';
COMMENT ON COLUMN external_project_links.thumbnail_url IS 'Optional custom thumbnail URL for the website preview';

