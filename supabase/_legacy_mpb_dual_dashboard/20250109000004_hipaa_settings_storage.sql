-- =====================================================
-- HIPAA Compliance Command Center
-- Migration 004: Settings & Storage Configuration
-- =====================================================

-- Compliance configuration settings
create table if not exists compliance_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now()
);

-- Enable RLS on settings
alter table compliance_settings enable row level security;

create policy "Officers can view settings"
  on compliance_settings for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer'])
  );

create policy "Officers can manage settings"
  on compliance_settings for all
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer'])
  );

-- Seed default settings
insert into compliance_settings (key, value, description) values
  ('n8n_webhook_baa_reminder', '{"enabled": false, "url": ""}'::jsonb, 'Webhook URL for BAA renewal reminders'),
  ('n8n_webhook_incident_alert', '{"enabled": false, "url": ""}'::jsonb, 'Webhook URL for critical incident alerts'),
  ('training_certificate_template', '{"template_id": "default", "signature_name": "HIPAA Officer"}'::jsonb, 'Training certificate template configuration'),
  ('breach_risk_thresholds', '{"low": 25, "medium": 50, "high": 100, "critical": 500}'::jsonb, 'Breach risk scoring thresholds (affected individuals)'),
  ('default_reviewers', '{"reviewer_ids": []}'::jsonb, 'Default document reviewers'),
  ('notification_email', '{"from": "compliance@mpbhealth.com", "cc": []}'::jsonb, 'Email configuration for notifications'),
  ('policy_review_frequency_months', '{"default": 12, "critical": 6}'::jsonb, 'Default policy review frequency'),
  ('incident_auto_assignment', '{"enabled": false, "officer_id": null}'::jsonb, 'Auto-assign incidents to HIPAA officer'),
  ('phi_access_retention_days', '{"value": 2555}'::jsonb, 'PHI access log retention period (7 years)'),
  ('audit_log_retention_days', '{"value": 2555}'::jsonb, 'Audit log retention period (7 years)')
on conflict (key) do nothing;

-- Storage bucket setup instructions (to be run manually in Supabase dashboard)
-- Note: Storage buckets must be created through Supabase dashboard or CLI
-- Required buckets:
--   1. hipaa-evidence (for evidence files)
--   2. hipaa-templates (for document templates)
--   3. hipaa-exports (for generated reports/exports)

-- Storage policies helper function
create or replace function check_storage_access(bucket_name text, user_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  -- Admin and officers have full access
  if has_any_role(user_id, array['admin','hipaa_officer','privacy_officer','security_officer']) then
    return true;
  end if;
  
  -- Auditors have read-only access
  if bucket_name in ('hipaa-evidence', 'hipaa-templates', 'hipaa-exports') 
     and has_role(user_id, 'auditor') then
    return true;
  end if;
  
  -- Legal has read access to evidence and templates
  if bucket_name in ('hipaa-evidence', 'hipaa-templates')
     and has_role(user_id, 'legal') then
    return true;
  end if;
  
  return false;
end;
$$;

-- Storage RLS policies (apply these in Supabase dashboard after creating buckets)
-- 
-- For hipaa-evidence bucket:
--   SELECT: check_storage_access('hipaa-evidence', auth.uid())
--   INSERT: has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer'])
--   UPDATE: has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer'])
--   DELETE: has_any_role(auth.uid(), array['admin','hipaa_officer'])
--
-- For hipaa-templates bucket:
--   SELECT: check_storage_access('hipaa-templates', auth.uid())
--   INSERT: has_any_role(auth.uid(), array['admin','hipaa_officer'])
--   UPDATE: has_any_role(auth.uid(), array['admin','hipaa_officer'])
--   DELETE: has_role(auth.uid(), 'admin')
--
-- For hipaa-exports bucket:
--   SELECT: check_storage_access('hipaa-exports', auth.uid())
--   INSERT: authenticated
--   UPDATE: (storage.foldername(name))[1] = auth.uid()::text
--   DELETE: (storage.foldername(name))[1] = auth.uid()::text

-- Trigger to log setting changes
create or replace function log_settings_change()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into hipaa_audit_log (actor, action, object_table, object_id, details)
  values (
    auth.uid(),
    'settings_updated',
    'compliance_settings',
    null,
    jsonb_build_object(
      'key', new.key,
      'old_value', old.value,
      'new_value', new.value
    )
  );
  return new;
end;
$$;

create trigger on_settings_update
  after update on compliance_settings
  for each row
  execute function log_settings_change();

-- Comments
comment on table compliance_settings is 'System configuration for HIPAA Compliance Command Center';
comment on function check_storage_access is 'Helper function to check storage bucket access permissions';

