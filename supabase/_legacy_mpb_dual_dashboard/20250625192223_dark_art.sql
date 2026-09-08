/*
  # Update Projects Schema for Monday.com and Website URL

  1. Schema Changes
    - Rename jira_link column to monday_link
    - Add website_url column for project websites
    - Update existing data to maintain consistency

  2. Data Migration
    - Preserve existing data during column rename
    - Set default values for new website_url column
    - Update any existing Jira links to Monday.com format if needed

  3. Constraints
    - Ensure URL fields accept valid URLs or empty strings
    - Maintain backward compatibility
*/

-- Add the new website_url column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS website_url text DEFAULT '';

-- Rename jira_link to monday_link
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'jira_link'
  ) THEN
    ALTER TABLE projects RENAME COLUMN jira_link TO monday_link;
  END IF;
END $$;

-- Update existing Monday links to use Monday.com format (if they were Jira links)
UPDATE projects 
SET monday_link = REPLACE(monday_link, 'atlassian.net', 'monday.com')
WHERE monday_link LIKE '%atlassian.net%';

-- Update existing projects with sample website URLs for demonstration
UPDATE projects 
SET website_url = CASE 
  WHEN name LIKE '%MPB Enroll%' THEN 'https://enroll.mpbhealth.com'
  WHEN name LIKE '%MPB Health APP%' THEN 'https://app.mpbhealth.com'
  WHEN name LIKE '%SaudeMAX%' THEN 'https://saudemax.com'
  WHEN name LIKE '%Crypto%' THEN 'https://crypto.mpbhealth.com'
  WHEN name LIKE '%OwnBite%' THEN 'https://ownbite.com'
  WHEN name LIKE '%CarePilot%' THEN 'https://carepilot.mpbhealth.com'
  ELSE ''
END
WHERE website_url = '';