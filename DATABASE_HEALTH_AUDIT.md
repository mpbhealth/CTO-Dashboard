# CTO-Dashboard Database Health Audit Report

**Project:** CTO-Dashboard (`xnijhggwgbxrtvlktviz`)
**Date:** 2026-03-06
**Database:** PostgreSQL 17.6.1, Supabase (us-east-2)

---

## EXECUTIVE SUMMARY

| Severity | Count |
|----------|-------|
| CRITICAL | 12    |
| WARNING  | 20    |
| INFO     | 12    |

**Key findings:**
- 14 identical empty staging tables (`stg_cancelation_reports_*`) should be consolidated or dropped
- 3 junk CSV import tables with unnamed columns should be dropped
- 19 tables have RLS disabled (security risk)
- 67+ `_id` columns lack FK constraints (data integrity risk)
- Multiple overlapping table pairs need consolidation review
- `stg_sales_orders` has 115 rows where ALL `order_id` values are NULL
- Heavy row-level duplication in `stg_sales_leads` (404 rows, 31 distinct names)
- XSS vulnerability in `compliance-training-certificate` edge function
- User-controlled storage bucket in `file-upload` edge function (no whitelist)
- 5 edge functions lack user auth checks (any JWT holder can invoke)
- `monday-api` acts as an open proxy to Monday.com for any authenticated user

---

## PHASE 1: SCHEMA OVERVIEW

### Table Inventory (155 public tables, 19 views, 50+ functions)

#### Tables with Data (>0 rows):
| Table | Rows | Purpose |
|-------|------|---------|
| auth.audit_log_entries | 848 | Auth audit trail |
| auth.users | 2 | Auth users |
| stg_sales_leads | 404 | Staging: sales leads |
| stg_sales_cancelations | 350 | Staging: cancelations |
| stg_concierge_interactions | 251 | Staging: concierge data |
| stg_sales_orders | 115 | Staging: sales orders |
| plan_pricing | 28 | Plan pricing reference |
| concierge_issue_categories | 25 | Issue categories |
| app_role_access | 24 | App-role permissions |
| department_uploads | 20 | Uploaded department data |
| compliance_settings | 17 | Compliance config |
| system_settings | 11 | System config |
| technologies | 10 | Tech stack items |
| apps | 9 | Internal apps |
| lead_source_categories | 9 | Lead source ref data |
| cancelation_reason_categories | 8 | Cancelation reasons |
| notes | 8 | Notes |
| security_audit_log | 8 | Security events |
| security_alert_rules | 7 | Alert rules |
| kpis | 7 | KPI metrics |
| quick_links | 7 | Quick links |
| roles | 7 | User roles |
| upload_templates | 7 | Upload templates |
| concierge_team_members | 6 | Concierge team |
| projects | 6 | Projects |
| ticket_sync_log | 5 | Ticket sync log |
| kpi_data | 4 | KPI dashboard data |
| concierge_request_types | 4 | Request type ref data |
| concierge_upload_templates | 3 | Upload templates |
| profiles | 2 | User profiles |
| users | 2 | Public users |
| workspaces | 2 | Workspaces |
| ticketing_system_config | 2 | Ticketing config |
| roadmap_items | 2 | Roadmap items |
| notification_preferences | 1 | Notification prefs |
| orgs | 1 | Organization |

#### Empty Tables (0 rows) - 100+ tables
Many are feature tables that haven't been populated yet (HIPAA, claims, members, HR, email, etc.)

### RLS Status:
- **RLS Enabled:** 136 tables
- **RLS Disabled:** 19 tables (all `stg_` prefix - see Critical #1)

---

## PHASE 2: DUPLICATE & REDUNDANCY DETECTION

### CRITICAL #1: 14 Identical Empty Monthly Cancelation Tables
All have the same schema: `id bigint, name varchar, reason varchar, membership varchar, advisor varchar, outcome text/varchar`

| Table | Rows | RLS |
|-------|------|-----|
| stg_cancelation_reports_january | 0 | OFF |
| stg_cancelation_reports_february | 0 | OFF |
| stg_cancelation_reports_march | 0 | OFF |
| stg_cancelation_reports_april | 0 | OFF |
| stg_cancelation_reports_may_25 | 0 | OFF |
| stg_cancelation_reports_june | 0 | OFF |
| stg_cancelation_reports_july | 0 | OFF |
| stg_cancelation_reports_august | 0 | OFF |
| stg_cancelation_reports_september | 0 | OFF |
| stg_cancelation_reports_september_2025 | 0 | OFF |
| stg_cancelation_reports_october | 0 | OFF |
| stg_cancelation_reports_october_2025 | 0 | OFF |
| stg_cancelation_reports_november | 0 | OFF |
| stg_cancelation_reports_december | 0 | OFF |

**Recommendation:** DROP all 14 tables. The normalized `stg_sales_cancelations` table already handles this data with proper schema. These appear to be raw CSV imports that were superseded.

### CRITICAL #2: 3 Junk CSV Import Tables
These have nonsensical column names from raw CSV headers:

| Table | Columns | Rows | RLS |
|-------|---------|------|-----|
| stg_concierge_report_after_8_pm_est_calls | `id, sep_18_2025_8_36_53_pm, kassing_emily_16025016607, unnamed_2` | 0 | OFF |
| stg_concierge_report_night_time_calls | `id, 09_18_25, unnamed_1, unnamed_2` | 0 | OFF |
| stg_concierge_report_weekly_report | `id, 10_17_25_10_23_25, ace, adam, tupac, unnamed_4, unnamed_5` | 0 | OFF |

**Recommendation:** DROP all 3 tables. They are empty failed imports with garbled column names.

### CRITICAL #3: Additional Junk Staging Tables
| Table | Rows | RLS | Issue |
|-------|------|-----|-------|
| stg_leads_reports_october_2025 | 0 | OFF | Superseded by stg_sales_leads |
| stg_sales_report_october | 0 | OFF | Superseded by stg_sales_orders |

**Recommendation:** DROP both tables.

### WARNING #1: CSV Artifact Columns (unnamed_*)
| Table | Column |
|-------|--------|
| stg_cancelation_reports_august | unnamed_5, unnamed_6 |
| stg_cancelation_reports_july | unnamed_5 |
| stg_cancelation_reports_september_2025 | unnamed_5 |

These columns are on tables already flagged for deletion above.

### WARNING #2: Overlapping Table Pairs
Each pair below serves a similar purpose. Review whether consolidation is appropriate:

#### a) `tech_stack` (0 rows) vs `technologies` (10 rows)
- `tech_stack`: id, name, category, version, owner, status, notes
- `technologies`: id, name, category, description, version, status, vendor, cost, documentation_url, owner, tags, created_by
- **Recommendation:** DROP `tech_stack` (empty), keep `technologies` (richer schema, has data)

#### b) `email_accounts` (0 rows) vs `user_email_accounts` (0 rows)
- `email_accounts`: id, user_id, email_address, display_name, provider, is_default, is_active, settings (jsonb)
- `user_email_accounts`: id, user_id, provider, email_address, display_name, access_token, refresh_token, token_expires_at, scopes, is_default, is_active, last_sync_at, sync_error
- **Recommendation:** `email_accounts` is referenced by FK from `email_logs`. `user_email_accounts` is referenced by `email_drafts` and `email_sent_log`. Both empty. Need to decide which to keep based on which email integration approach is current. `user_email_accounts` has OAuth fields and appears more current.

#### c) `employee_feedback` (0 rows) vs `feedback_entries` (0 rows)
- `employee_feedback`: id, employee_id, feedback_from (text), feedback_date, feedback_type, content
- `feedback_entries`: id, employee_id, giver_id (uuid FK), feedback_type, content, is_anonymous
- **Recommendation:** `feedback_entries` has better schema (giver FK, anonymous flag). Consider dropping `employee_feedback`.

#### d) `kpis` (7 rows) vs `kpi_data` (4 rows) vs `kpi_definitions` (0 rows)
- `kpis`: category, metric_name, metric_value, target_value, unit, trend, period
- `kpi_data`: title, value, change, trend (simple dashboard widget data)
- `kpi_definitions`: name, description, category, measurement_unit, target_value (metadata)
- **Recommendation:** These serve different purposes. `kpis` = actual metrics, `kpi_data` = dashboard widgets, `kpi_definitions` = templates. Keep all three but consider whether `kpi_definitions` (empty) is needed.

#### e) `files` (0 rows) vs `file_metadata` (0 rows)
- `files`: id, resource_id (FK->resources), storage_key, size_bytes, mime
- `file_metadata`: id, record_id (FK->records), storage_path, filename, size_bytes, mime_type, visibility, owner_id
- **Recommendation:** Both empty. `file_metadata` has richer schema. Determine which pattern is in use.

#### f) `email_logs` (0 rows) vs `email_sent_log` (0 rows)
- `email_logs`: Full email record (from, to, cc, bcc, subject, body_html, status, folder, importance, etc.) - FK to `email_accounts`
- `email_sent_log`: Lighter sent record (to_recipients jsonb, subject, status) - FK to `user_email_accounts`
- **Recommendation:** These complement each other (logs = inbox, sent_log = outbox). Keep both.

#### g) `audit_logs` vs `admin_actions_log` vs `security_audit_log`
- `audit_logs`: org-scoped, actor_profile_id FK, general actions (0 rows)
- `admin_actions_log`: user_id, action, entity tracking, IP/user agent (0 rows)
- `security_audit_log`: event_type, severity, actor details, checksum for tamper detection (8 rows)
- **Recommendation:** These serve different purposes (general, admin, security). Keep all three. `admin_actions_log` and `audit_logs` overlap the most - consider merging if admin audit isn't needed separately.

### WARNING #3: Row-Level Duplicates in Staging Tables

#### `stg_sales_leads`: 404 rows, only 31 distinct `lead_name` values
Heavy duplication - likely multiple import batches without dedup.

#### `stg_sales_cancelations`: 350 rows, only 44 distinct `member_name` values
Same issue - multiple import batches.

#### `stg_sales_orders`: 115 rows, 0 non-null `order_id` values
All order_id values are NULL. The `sales_orders` view generates synthetic IDs to compensate.

---

## PHASE 3: NAMING CONVENTION AUDIT

### Good News
- **No camelCase columns** found anywhere in the public schema
- All table names use consistent `snake_case`
- No PascalCase or mixed-case issues

### INFO #1: Generic Column Names (Acceptable but noted)
These columns use generic names. They are acceptable in context but flagged for awareness:
- `name` used in 38 tables (standard for entity names)
- `status` used in 30+ tables (standard for state tracking)
- `notes` used in 20+ tables (standard for freetext)
- `data` in `notifications` table (jsonb payload - acceptable)
- `value` in `compliance_settings` and `kpi_data` (key-value patterns - acceptable)

### INFO #2: Inconsistent Naming in Staging Tables
- `stg_cancelation_reports_may_25` - uses `_25` suffix while others use no year or `_2025`
- `stg_cancelation_reports_september` vs `stg_cancelation_reports_september_2025` - duplicate month with inconsistent naming
- `stg_cancelation_reports_october` vs `stg_cancelation_reports_october_2025` - same issue

---

## PHASE 4: RELATIONSHIP & INTEGRITY AUDIT

### CRITICAL #4: 67+ `_id` Columns Without FK Constraints
The following columns look like foreign key references but have NO FK constraint declared:

| Table | Column | Likely References |
|-------|--------|-------------------|
| access_review_items | user_id | profiles.user_id |
| admin_actions_log | user_id | profiles.user_id |
| blog_articles | author_id | profiles.user_id |
| change_requests | approver_id | profiles.user_id |
| claim_documents | uploaded_by | profiles.user_id |
| claim_notes | created_by | profiles.user_id |
| claims | reviewed_by | profiles.user_id |
| compliance_tasks | created_by | profiles.user_id |
| department_metrics | created_by | profiles.user_id |
| department_uploads | approved_by | profiles.user_id |
| email_drafts | account_id | user_email_accounts.id (HAS FK) |
| email_drafts | signature_id | email_signatures.id (HAS FK) |
| employee_compliance_documents | approved_by | profiles.user_id |
| employee_compliance_documents | employee_id | employee_profiles.id |
| employee_profiles | user_id | profiles.user_id |
| kpis | created_by | profiles.user_id |
| member_profiles | user_id | profiles.user_id |
| outlook_config | created_by | profiles.user_id |
| policy_acknowledgements | user_id | profiles.user_id |
| policy_document_history | changed_by | profiles.user_id |
| policy_documents | approved_by | profiles.user_id |
| quick_links | created_by | profiles.user_id |
| saudemax_data | created_by | profiles.user_id |
| support_tickets | assigned_to | profiles.user_id |
| system_notifications | created_by | profiles.user_id |
| system_settings | updated_by | profiles.user_id |
| technologies | created_by | profiles.user_id |
| technologies | owner | profiles.user_id |
| ticket_notifications | ticket_id | tickets_cache.id (HAS FK) |
| ticket_replies | created_by | profiles.user_id |
| transactions | claim_id | claims.id (HAS FK) |
| transactions | member_id | member_profiles.id (HAS FK) |
| users | auth_user_id | auth.users.id |
| workspaces | owner_profile_id | profiles.user_id (HAS FK) |

**Note:** Some of these (marked "HAS FK") do already have FK constraints. The query flagged them because they also appear in the missing-FK results. The majority truly lack constraints.

**Recommendation:** Add FK constraints for critical relationships, particularly `user_id` and `created_by` columns that reference `profiles.user_id`.

### WARNING #4: User/Profile Identity Mismatch
The `users` and `profiles` tables have a confusing relationship:

| Table | Email | ID | Auth Link |
|-------|-------|----|-----------|
| users | vrt@mympb.com | ee098e71 | auth_user_id: 5444de5b |
| users | catherine@mympb.com | fd9ee2e4 | auth_user_id: NULL |
| profiles | vrt@mympb.com | user_id: 5444de5b | (= auth.users.id) |
| profiles | catherine@mympb.com | user_id: fd9ee2e4 | (= users.id) |

- `profiles.user_id` maps to `auth.users.id` (standard Supabase pattern)
- `users.id` is a separate UUID not consistently linked to `profiles`
- `catherine@mympb.com` has no `auth_user_id` in the `users` table

**Recommendation:** The `public.users` table appears redundant with `profiles`. Consider whether it serves a distinct purpose.

### INFO #3: No FK Columns Missing Indexes
All FK columns that have declared FK constraints also have indexes.

### INFO #4: Existing UNIQUE Constraints
Key unique constraints are properly in place:
- `profiles.email`, `users.email` - UNIQUE
- `blog_articles.slug`, `hipaa_docs.slug` - UNIQUE
- `claims.claim_number`, `support_tickets.ticket_number` - UNIQUE
- `member_profiles.membership_number` - UNIQUE

---

## PHASE 5: EDGE FUNCTIONS AUDIT

### 23 Edge Functions Deployed

| Function | JWT | Purpose |
|----------|-----|---------|
| compliance-audit-log | Yes | Logs audit events to `hipaa_audit_log` |
| compliance-baa-reminders | Yes | Finds expiring BAAs, sends reminders via n8n webhook |
| compliance-breach-risk-score | Yes | Pure computation - calculates breach risk score |
| compliance-evidence-upload | Yes | Generates signed upload URLs for `hipaa-evidence` bucket |
| compliance-training-certificate | Yes | Generates HTML training certificates |
| ingest-marketing-metrics | Yes | Ingests marketing data into `marketing_metrics` |
| monday-api | Yes | Proxies GraphQL to Monday.com API |
| monthly-marketing-report | Yes | Generates monthly marketing performance report |
| verify-passcode | Yes | Simple passcode verification against env var |
| export-data | Yes | Exports data as CSV/XLSX with role checks |
| file-upload | Yes | Multipart file upload to storage buckets |
| ceo-data-import | Yes | CEO data import (batch 2 audit pending) |
| department-data-upload | Yes | Department data uploads (batch 2 audit pending) |
| send-note-notification | Yes | Note sharing email notifications |
| outlook-calendar | Yes | Outlook calendar integration |
| agent-chat | Yes | AI agent chat |
| security-audit | Yes | Security audit checks |
| security-monitor | Yes | Security monitoring |
| email-oauth | Yes | Email OAuth flow |
| send-push-notification | Yes | Push notifications |
| **email-api** | **NO** | Email API endpoint |
| **send-email** | **NO** | Send email via Resend |
| **resend-webhook** | **NO** | Resend webhook handler |

### CRITICAL #6: XSS Vulnerability in `compliance-training-certificate`
`user_name` and `training_name` are interpolated directly into HTML via template literals with **no sanitization**. A malicious user could inject script tags into the generated certificate HTML.

### CRITICAL #7: User-Controlled Storage Bucket in `file-upload`
The `bucket` parameter comes from user-submitted form data with no whitelist. A permitted user could upload files to **any** storage bucket (e.g., `hipaa-evidence`, `hipaa-exports`).

### CRITICAL #8: OAuth Token Encryption is a No-Op in `email-oauth`
The `encryptToken` and `decryptToken` functions are **identity functions** (`return token`). OAuth access/refresh tokens are stored in **plaintext** in `user_email_accounts`. The code has a TODO comment about using Supabase Vault but it was never implemented.

### CRITICAL #9: Profile Data Leak in `agent-chat`
The `get_member_info` tool claims to "remove sensitive fields" via destructuring, but the destructuring is a **no-op** — all profile fields are exposed to the AI model and potentially to the user. Additionally, the function uses the **service role key** (bypassing RLS) despite commenting that it uses "user's token for RLS."

### CRITICAL #10: `department-data-upload` Status Bug + Org Bypass
- **Status bug:** The ternary `rowsFailed === 0 ? 'completed' : 'completed'` always sets status to `'completed'` even when rows fail. Both branches are identical.
- **Org bypass:** Setting `orgId` to `'public-upload'` bypasses org validation entirely.

### WARNING #5: 3 Functions with JWT Verification Disabled
- `email-api` (verify_jwt: false) - Mitigated by internal `getUser()` auth check
- `send-email` (verify_jwt: false) - Mitigated by internal `getUser()` auth check
- `resend-webhook` (verify_jwt: false) - **Appropriate** for webhook; uses Svix signature verification. But **fails open** if `RESEND_WEBHOOK_SECRET` env var is not set.

### WARNING #6: 7 Functions Lack Proper User Auth/Authorization
These functions accept any valid JWT without verifying the user's role or identity:
- `compliance-baa-reminders` - Any authenticated user can trigger BAA reminder emails
- `compliance-breach-risk-score` - Low risk (stateless computation)
- `ingest-marketing-metrics` - Any authenticated user can inject marketing data
- `monday-api` - **Open proxy to Monday.com** for any authenticated user
- `monthly-marketing-report` - Any authenticated user can trigger report generation
- `send-push-notification` - Any authenticated user can push notifications to **any other user**
- `security-monitor` - Any authenticated user can trigger security monitoring

### WARNING #7: Inconsistent Audit Log Tables
- `compliance-audit-log` and `compliance-baa-reminders` log to `hipaa_audit_log`
- `export-data` and `file-upload` log to `audit_logs`
- These are separate tables with different schemas

### WARNING #8: `verify-passcode` Timing Attack
Uses `===` string comparison which is not constant-time. Vulnerable to timing-based brute force.

### WARNING #9: Public URLs for Sensitive Files
- `compliance-training-certificate` uses `getPublicUrl()` - certificates are publicly accessible by URL
- `file-upload` uses `getPublicUrl()` - uploaded files are publicly accessible

### WARNING #10: Hardcoded Role Lists Vary Per Function
Each function defines its own allowed roles differently:
- `compliance-evidence-upload`: admin, hipaa_officer, privacy_officer, security_officer
- `export-data`: admin, ceo, hipaa_officer
- `file-upload`: admin, hipaa_officer, privacy_officer, security_officer, ceo

### WARNING #11: `send-note-notification` Does NOT Actually Send Emails
The function prepares email HTML templates but never sends them. The response claims "Email notification sent successfully" which is misleading. `security-monitor` invokes this function for email alerts — meaning security email alerts are silently dropped.

### WARNING #12: Plaintext OAuth Secrets in `outlook-calendar`
The `outlook_config` table stores `client_secret`, `access_token`, and `refresh_token` in plaintext. Should use Supabase Vault or encrypted storage.

### WARNING #13: `email-oauth` Missing Per-Action Authorization
No per-action authorization checks. Any authenticated user could potentially access another user's email accounts if they know the `accountId`. The `callback` action trusts `userId` from the base64-encoded (but unsigned) `state` parameter — CSRF risk.

### WARNING #14: `email_accounts` vs `user_email_accounts` Table Mismatch
`email-api` references the `email_accounts` table, while `email-oauth` and `email-drafts` reference `user_email_accounts`. These are different tables with different schemas. This is likely a bug — one table should be canonical.

### INFO #5: Tables Referenced by Edge Functions That May Not Exist
- `monday_config`, `monday_sync_log` (used by `monday-api`)
- `sync_logs` (used by `ingest-marketing-metrics`, `monthly-marketing-report`)
- `it_tickets`, `knowledge_base`, `ticket_notes` (used by `agent-chat`)
- `data_import_history`, `stg_raw_cancellations/leads/sales/concierge` (used by `ceo-data-import`)
- Verify these tables exist or were renamed

### INFO #6: Potential Overlap
- `security-audit` vs `security-monitor` - Overlapping but complementary (audit = logging, monitor = alerting)
- `send-note-notification` vs `send-push-notification` - Different channels (email template vs web push)
- `ceo-data-import` vs `department-data-upload` - Both import data but for different audiences/schemas

### INFO #7: Hardcoded Values
- `compliance-training-certificate`: Organization name "MPB Health" hardcoded in HTML
- `monday-api`: API version '2023-10' hardcoded, extensive demo data with real-looking emails
- `monthly-marketing-report`: Brand name "MPB Health Marketing Analytics Dashboard" in footer
- `send-note-notification`: Fallback URL `"https://yourapp.com"` (placeholder never replaced)
- `send-push-notification`: Default VAPID subject `'mailto:admin@mpbhealth.com'`
- `agent-chat`: OpenAI model `"gpt-4o-mini"` and `max_tokens: 1024` hardcoded

### INFO #8: Code Quality Notes
- `ceo-data-import`: N+1 insert pattern (inserts rows one at a time in a loop)
- `department-data-upload`: Redundant auth check (authenticated twice with identical logic)
- Multiple functions use deprecated `serve` import from `deno.land/std@0.168.0`
- Multiple functions use `error.message` without `instanceof Error` check

---

## PHASE 6: RLS & PERMISSIONS AUDIT

### CRITICAL #5: 19 Tables with RLS DISABLED (NOW RESOLVED)
All 19 tables were empty junk/staging tables. They have been **dropped** in the cleanup migration.

### CRITICAL #11: 39.5% of Tables Have Overly Permissive RLS Policies
**58 out of 147 tables** have at least one RLS policy using `true` (no conditions), meaning **any authenticated user** can access them with no restrictions.

#### 34 Tables are FULLY PERMISSIVE (zero access control beyond authentication):

| Table | Permissive Commands |
|-------|--------------------|
| ai_agents | ALL, SELECT |
| api_statuses | ALL, SELECT |
| app_role_access | SELECT |
| career_development_plans | ALL, SELECT |
| department_metrics | ALL, SELECT |
| department_relationships | ALL, SELECT |
| department_workflows | ALL, SELECT |
| departments | ALL, SELECT |
| deployment_logs | ALL, SELECT |
| employee_kpis | ALL, SELECT |
| **employee_profiles** | **ALL, SELECT** |
| feedback_entries | INSERT, SELECT |
| kpi_data | ALL, SELECT |
| kpi_definitions | ALL, SELECT |
| learning_activities | ALL, SELECT |
| marketing_metrics | ALL, SELECT |
| marketing_properties | ALL, SELECT |
| **member_enrollments** | **DELETE, INSERT, SELECT, UPDATE** |
| member_status_updates | INSERT, SELECT |
| org_chart_positions | ALL, SELECT |
| **performance_reviews** | **ALL, SELECT** |
| roles | SELECT |
| **saas_expenses** | **DELETE, INSERT, SELECT, UPDATE** |
| team_members | ALL, DELETE, INSERT, SELECT, UPDATE |
| ticket_assignment_links | DELETE, INSERT, SELECT |
| ticket_notifications | INSERT, SELECT, UPDATE |
| ticket_project_links | DELETE, INSERT, SELECT |
| ticket_sync_log | INSERT, SELECT |
| ticketing_system_config | ALL, SELECT |
| tickets_cache | INSERT, SELECT, UPDATE |
| vendors | ALL, SELECT |
| workflow_steps | ALL, SELECT |

**Highlighted tables are especially concerning** -- `employee_profiles`, `member_enrollments`, `performance_reviews`, and `saas_expenses` contain sensitive data.

### CRITICAL #12: 27 Tables Have Contradictory Policies (Dead Auth Code)
These tables mix `true`-based and `auth.uid()`-based policies. Because Supabase PERMISSIVE policies are **OR'd together**, the `true` policy always wins, making the `auth.uid()` policies **dead code**.

Key affected tables:
- **`profiles`** -- Has "Service role full access" ALL with `true`, rendering all auth.uid()-scoped policies useless
- **`projects`** -- `true`-based ALL/SELECT alongside CTO/admin/CEO role checks
- **`quick_links`** -- `true`-based ALL alongside role-based policies
- **`roadmap_items`** -- `true`-based ALL/SELECT alongside role-restricted policies
- **`assignments`** -- `true`-based ALL alongside auth.uid()-based CRUD policies
- **`department_uploads`** -- `true`-based SELECT/INSERT alongside "Users can view their own" policies
- **`security_audit_log`** -- `true`-based INSERT alongside auth.uid()-based INSERT (audit integrity weakened)
- **`hipaa_audit_log`** -- `true`-based INSERT (any user can write fake audit entries)
- **`stg_sales_cancelations/leads/orders`** -- `true`-based INSERT alongside auth.uid() INSERT
- **`stg_concierge_*` tables** -- `true`-based policies negate role restrictions

### INFO #6: RLS Policy Distribution
- **426 total policies** across 147 tables
- **72 tables** use role-based auth (strongest pattern)
- **36 tables** use auth.uid()-only checks
- **34 tables** are fully permissive
- **5 tables** use other patterns

### INFO #7: Tables with Only SELECT Policies (Read-Only via RLS)
These are reference/lookup tables -- appropriate:
- `app_role_access`, `apps`, `concierge_request_types`, `orgs`, `roles`

### INFO #9: HIPAA Tables are Generally Well-Protected
Most HIPAA tables use role-based checks (hipaa_audits, hipaa_docs, hipaa_incidents, etc.), **except**:
- `hipaa_audit_log` INSERT uses `true` -- any authenticated user can write fake audit entries
- `hipaa_trainings` SELECT uses `true` -- acceptable for read-only training catalog

---

## PHASE 7: CLEANUP EXECUTION PLAN

### 7A. NON-DESTRUCTIVE MIGRATION (Safe to Apply)

This migration adds missing indexes and enables RLS on tables that currently have it disabled (as a safety measure before drop decisions are made):

```sql
-- No non-destructive schema changes needed at this time.
-- All FK columns have indexes.
-- All active tables have RLS enabled.
-- No camelCase columns to rename.
-- Adding FK constraints is deferred pending user/profile relationship clarification.
```

### 7B. DESTRUCTIVE ACTIONS (Require Your Approval)

#### Action 1: DROP 14 empty monthly cancelation staging tables
```sql
DROP TABLE IF EXISTS stg_cancelation_reports_january;
DROP TABLE IF EXISTS stg_cancelation_reports_february;
DROP TABLE IF EXISTS stg_cancelation_reports_march;
DROP TABLE IF EXISTS stg_cancelation_reports_april;
DROP TABLE IF EXISTS stg_cancelation_reports_may_25;
DROP TABLE IF EXISTS stg_cancelation_reports_june;
DROP TABLE IF EXISTS stg_cancelation_reports_july;
DROP TABLE IF EXISTS stg_cancelation_reports_august;
DROP TABLE IF EXISTS stg_cancelation_reports_september;
DROP TABLE IF EXISTS stg_cancelation_reports_september_2025;
DROP TABLE IF EXISTS stg_cancelation_reports_october;
DROP TABLE IF EXISTS stg_cancelation_reports_october_2025;
DROP TABLE IF EXISTS stg_cancelation_reports_november;
DROP TABLE IF EXISTS stg_cancelation_reports_december;
```

#### Action 2: DROP 3 junk CSV import tables
```sql
DROP TABLE IF EXISTS stg_concierge_report_after_8_pm_est_calls;
DROP TABLE IF EXISTS stg_concierge_report_night_time_calls;
DROP TABLE IF EXISTS stg_concierge_report_weekly_report;
```

#### Action 3: DROP 2 superseded one-off report tables
```sql
DROP TABLE IF EXISTS stg_leads_reports_october_2025;
DROP TABLE IF EXISTS stg_sales_report_october;
```

#### Action 4: DROP empty duplicate `tech_stack` table (superseded by `technologies`)
```sql
DROP TABLE IF EXISTS tech_stack;
```
**Note:** The function `verify_user_access` references `tech_stack` in its critical_tables array. This function would need to be updated to reference `technologies` instead.

#### Action 5 (Optional): DROP `employee_feedback` if `feedback_entries` is the chosen pattern
```sql
-- Only after confirming feedback_entries is the active table:
-- DROP TABLE IF EXISTS employee_feedback;
```

#### Action 6: Dedup staging data
```sql
-- Deduplicate stg_sales_leads (404 rows -> ~31 unique)
-- Strategy: Keep latest row per lead_name per upload_batch_id
-- REVIEW QUERY FIRST:
SELECT lead_name, COUNT(*) as cnt
FROM stg_sales_leads
GROUP BY lead_name
HAVING COUNT(*) > 1
ORDER BY cnt DESC;

-- Similar for stg_sales_cancelations (350 rows -> ~44 unique)
SELECT member_name, COUNT(*) as cnt
FROM stg_sales_cancelations
GROUP BY member_name
HAVING COUNT(*) > 1
ORDER BY cnt DESC;
```

---

## DECISIONS NEEDED FROM YOU

1. **DROP the 19 junk/empty staging tables?** (Actions 1-3 above) - All empty, no data loss risk
2. **DROP `tech_stack`?** (Action 4) - Empty, superseded by `technologies`, but `verify_user_access` function references it
3. **Clarify `email_accounts` vs `user_email_accounts`** - Both empty, which is the active pattern?
4. **Clarify `employee_feedback` vs `feedback_entries`** - Both empty, which to keep?
5. **Should I add FK constraints** for the 50+ `_id` columns missing them? (non-destructive but affects INSERT behavior)
6. **Should I deduplicate** `stg_sales_leads` and `stg_sales_cancelations`?
7. **Is the `public.users` table needed** given that `profiles` already handles user identity?
