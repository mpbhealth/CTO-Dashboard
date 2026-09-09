# AUDIT — ARYX COS — 2026-09-08

## Mode and scope

- **Mode:** FULL SYSTEM AUDIT + authorized repair of the left nav sidebar (and its command-palette trigger)
- **App:** ARYX COS (Vite + React Router)
- **Authoritative production DB:** Supabase `kylemtjsypmrtmuhmang` (ARYX COS, us-east-1, ACTIVE_HEALTHY, created 2026-09-08) — **this is production**
- **Authoritative frontend:** Vercel `aryx-cos` / `prj_usQUsVbwgriUV3SMIZOnvFIgx20x` / team `team_CPiOVnSliEPFU56TDH6kVo35`
- **Local env:** `.env.local` → `kylemtjsypmrtmuhmang.supabase.co` (same production project)
- **Repair authorized:** sidebar + palette wiring only. Other defects registered, not mutated.
- **Discovery:** read-only (catalog, counts, statuses, timestamps — no PII)

## Repair pass (2026-09-08, authorized)

| Surface | Status | Repair | Evidence |
|---|---|---|---|
| MAIL-REN-01 | SHIPPED | `mail-renewal` v8 requires `MAIL_CRON_SECRET`; fail closed if unset | Unauth POST → 401 `Unauthorized` **CONFIRMED**. Valid `x-cron-secret` → 200 `{due:0,renewed:0,failed:0}` **CONFIRMED**. |
| MAIL-HOOK-01 | SHIPPED | Notifications require matching `clientState` + `subscriptionId`; handshake remains public | Stub POST → 401 **CONFIRMED**. Fake ids → 401 **CONFIRMED**. `validationToken=graph-hello` → `graph-hello` **CONFIRMED**. |
| OPS-01 | SHIPPED (frontend) | `/operations` mounts `CosOperations` against live COS tables | Bundle includes `CosOperations-*.js`. Authenticated page render **UNVERIFIED**. |
| AI-01 | SHIPPED (hidden) | `GlobalAIAssistant` unmounted; `agent-chat` not deployed | Source + production login has no assistant chrome **INFERRED**. |
| Frontend | SHIPPED | Vercel `dpl_DggRUED88rH6oY8ZNP2bL8hB4TPh` aliased to `https://cos.aryxtech.com` | Login Playwright 200 **CONFIRMED**. `/home` and `/operations` redirect to `/login` **CONFIRMED**. |

Rollback: redeploy `mail-renewal` v5 / `mail-webhook` v5; revert CosApp mount; `vercel rollback` to `dpl_JBUAM1ZC7XiVcH3iPbm49F2uSxju`.

Residual: no scheduler calls `mail-renewal` yet; authenticated sidebar/ops click-through UNVERIFIED; Assignments fake send still open; connectors still unconfigured.

---

## Verdict

**GO WITH CONDITIONS** after the authorized repair pass. P0 `mail-renewal` is closed. Remaining conditions: schedule renewal with `x-cron-secret`, sign in and confirm sidebar/ops, do not treat Assignments send or connectors as live. `https://cos.aryxtech.com` is the production alias.

## Environment confirmation

| Claim | Value | Class |
|---|---|---|
| Linked Supabase ref | `kylemtjsypmrtmuhmang` | CONFIRMED `supabase/.temp/project-ref` |
| Project name | ARYX COS | CONFIRMED MCP `get_project` |
| Client host | `kylemtjsypmrtmuhmang.supabase.co` | CONFIRMED `.env.local` host only |
| Git HEAD | `31eabb4` on `main` | CONFIRMED |
| Working tree | dirty (auth brand + sidebar + send-auth-email) | CONFIRMED |
| Vercel promoted | `dpl_99hsw7K7rQB2J4ctbq3q4ssg4xfw` @ `31eabb4` `gitDirty=1` | CONFIRMED |
| Vercel domains | `aryx-cos.vercel.app`, `aryx-cos-mpb-health.vercel.app` | CONFIRMED |
| Tenant bind | `profiles.org_id` + `current_org_id()` = `auth.uid()` lookup | CONFIRMED live function def |
| Single-tenant seed | `handle_new_user` inserts `org_id = a0000000-0000-0000-0000-000000000001`, `role='cos'` | CONFIRMED |

---

## Drift register

| Artifact | Repo | Deployed | Class | Risk |
|---|---|---|---|---|
| Frontend | dirty HEAD + uncommitted auth/sidebar | Vercel `31eabb4` | **repo-ahead** | users still see old CTO sidebar / old login |
| Migrations | `20260908140000`–`40003` | ledger `20260908135110`…`35227` (`cos_identity` … `notes_legacy_columns`) | **stamped under different versions** | next `db push` can diverge |
| Live tables | COS schema in repo | 32 public tables, all RLS on | objects exist | CONFIRMED |
| `send-auth-email` | untracked in repo | ACTIVE v1, `verify_jwt=false`, HMAC secret | **identical-enough** | hook is live |
| `connector-sync`, `crm-proxy`, `email-oauth`, `email-api` | present | ACTIVE, `verify_jwt=true` | present both sides | |
| `mail-renewal`, `mail-webhook` | present | ACTIVE, `verify_jwt=false` | present | P0/P1 auth |
| ~17 other `supabase/functions/*` | present (`agent-chat`, `outlook-calendar`, compliance-*, etc.) | **not deployed** | **repo-only** | UI can call ghosts |
| `pg_cron` | none in active config | `has_cron=false` | identical absence | mail-renewal has no scheduler |
| Vercel crons | none in `vercel.json` | none | identical absence | unattended work never runs |

---

## Requirements ledger

| Req ID | Source | Requirement | Status |
|---|---|---|---|
| REQ-NAV-01 | User 2026-09-08 | Left nav matches ARYX brand | PARTIAL — code repaired locally; runtime UNVERIFIED; prod not updated |
| REQ-NAV-02 | INFERRED | Sidebar is primary COS navigator | FUNCTIONAL WITH RISKS |
| REQ-NAV-03 | Sidebar hint | ⌘K / hint opens palette with live COS routes | Repaired in repo (was RED) |
| REQ-AUTH-01 | Recent work | Aryx login / reset / callback | Login shell CONFIRMED locally; reset email UNVERIFIED |
| REQ-COS-01 | `31eabb4` | Single COS app; legacy paths remap | INFERRED routes exist; remap CONFIRMED in `lib/cos.ts` |
| REQ-MAIL-01 | Product | Inbox send/sync | Wiring CONFIRMED in code; 0 mail accounts CONFIRMED; webhook stub |
| REQ-CRM-01 | Product | CRM list/detail | External `crm-proxy` CONFIRMED; silent empty on failure |
| REQ-CONN-01 | CosHome | Connector refresh → snapshots | 5 sources, all `unconfigured`, 0 snapshots CONFIRMED |
| REQ-AGENT-01 | build-agents attached | New agents default to eve | Existing non-eve `GlobalAIAssistant` — do not scaffold eve |

---

## Feature surface matrix (critical + nav)

| ID | Module | Surface | Action | Backend | Status |
|---|---|---|---|---|---|
| NAV-SIDE-01 | Nav | Left rail | Navigate COS routes | `navigation.ts` → `CosApp` routes | YELLOW (repaired locally) |
| NAV-SIDE-02 | Nav | Search hint | Open palette | `AppShell.togglePalette` | YELLOW (repaired locally) |
| NAV-SIDE-03 | Nav | ⌘K | Toggle palette | `AppShell` listener | YELLOW (repaired locally) |
| AUTH-LOGIN-01 | Auth | Login form | Sign in | Supabase Auth | YELLOW (page CONFIRMED; submit UNVERIFIED) |
| AUTH-RESET-01 | Auth | Forgot password | Send hook email | `send-auth-email` + Resend | YELLOW |
| MAIL-LIST-01 | Inbox | List messages | Graph/Gmail via `email-api` | JWT + owner_user_id | YELLOW (0 accounts) |
| MAIL-SEND-01 | Inbox | Send | `email-api` + `mail_send_intents` | JWT + idempotency | YELLOW (0 accounts) |
| MAIL-HOOK-01 | Mail | Graph webhook | Ingest notifications | `mail-webhook` | RED (stub) |
| MAIL-REN-01 | Mail | Renew Graph sub | `mail-renewal` | service role, no auth | RED |
| CRM-LIST-01 | CRM | List | `crm-proxy` → `ARYX_CRM_URL` | JWT | YELLOW |
| CRM-DET-01 | CRM | Detail | proxy + `phi_access_log` | JWT | YELLOW |
| HOME-KPI-01 | Home | Snapshots | `analytics_snapshots` | RLS org | YELLOW (empty, honest empty state) |
| HOME-REF-01 | Home | Refresh sources | `connector-sync` | JWT | YELLOW (sources unconfigured) |
| OPS-01 | Operations | Overview | `plan_cancellations` | missing table | RED |
| ASN-01 | Development | Send assignment | Teams/email helpers | console.log + `{success:true}` | RED |
| AI-01 | Assistant | Chat | `agent-chat` | not deployed | RED |
| FILE-01 | Files | List/delete | `files` / `resources` | `resources` missing | YELLOW |

**Sampled out (unknown, not passing):** most Settings fields; HIPAA form CRUD; organizer internals; analytics chart series; IntegrationsHub fields; Policy manager; Deployments; public upload landing.

---

## Defect register

| ID | Sev | Defect | Evidence | Class | Status |
|---|---|---|---|---|---|
| DEF-MAIL-01 | P0 | `mail-renewal` public + service role, no cron token | Deployed source; `verify_jwt=false`; no auth in handler | CONFIRMED | Open — needs repair auth |
| DEF-MAIL-02 | P1 | `mail-webhook` returns `{received:true}` with no signature/`clientState` | Deployed source | CONFIRMED | Open |
| DEF-AI-01 | P1 | `GlobalAIAssistant` POSTs `agent-chat`; function not in deployed list | `CosApp` mount + MCP function list | CONFIRMED | Open |
| DEF-ASN-01 | P1 | Assignment send helpers `console.log` and return success | `communicationHelpers.ts:30-31`, `Assignments.tsx:109` | CONFIRMED | Open |
| DEF-OPS-01 | P1 | `/operations` queries `plan_cancellations` — table absent in prod | `CTOOperations.tsx:29` vs `list_tables` | CONFIRMED | Open |
| DEF-AUTH-01 | P1 | Auth emails `APP_URL=https://cos.aryxtech.com`; Vercel domains do not include it | Deployed `send-auth-email` + Vercel `get_project` | CONFIRMED mismatch; DNS UNVERIFIED | Open |
| DEF-CONN-01 | P1 | All 5 `integration_sources` `unconfigured`; 0 snapshots / 0 sync_runs | SQL | CONFIRMED | Open |
| DEF-CRM-01 | P2 | CRM list returns `[]` on upstream failure (HTTP 200) | `crm-proxy` | CONFIRMED | Open |
| DEF-NAV-01 | P2 | Sidebar was CTO/indigo theme after ARYX rebrand | `Sidebar.tsx` / theme maps | CONFIRMED | Repaired locally |
| DEF-NAV-02 | P1 | ⌘K only on hidden GalaxyDock; hint decorative | `AppShell` / `GalaxyDock` | CONFIRMED | Repaired locally |
| DEF-NAV-03 | P1 | Palette/`useApps` fallback hrefs `/ceo` `/cto` `/orbit` (no `apps` table) | `useApps.ts` + no table | CONFIRMED | Repaired locally |
| DEF-NAV-04 | P3 | Dead shells: `CEODashboardLayout`, `AdminLayout`, 4 dashboard switchers | no imports | CONFIRMED | Open |
| DEF-NAV-05 | P3 | Five nav engines; only `navigation.ts` was canonical | inventory | CONFIRMED | Partially unified |
| DEF-ROLE-01 | P2 | `AuthContext` forces `role: 'cos'` on every profile | `AuthContext.tsx:242` | CONFIRMED | Open |
| DEF-SEC-01 | P3 | Leaked-password protection disabled | advisor | CONFIRMED | Open |
| DEF-SEC-02 | P3 | `set_updated_at` mutable search_path | advisor + function def | CONFIRMED | Open |
| DEF-MOCK-01 | P3 | CEO mock loaders / `useComplianceDashboard` hardcoded stats | unmounted leftover pages | CONFIRMED leftover | GRAY unless remounted |
| DEF-SCHED-01 | P1 | No `pg_cron`, no Vercel crons; renewal/reminders never scheduled | SQL + `vercel.json` | CONFIRMED | Open |

---

## Privileged entrypoints

| Entrypoint | Reachable by | Authn | Authz | Tenant | Idempotency | Current protections? |
|---|---|---|---|---|---|---|
| `email-api` | JWT | verify_jwt + getUser | `owner_user_id` | mailbox owner | send: `mail_send_intents` | YES |
| `email-oauth` | JWT (service-role bypass exists) | verify_jwt | account owner / optional userId if service | mailbox | none | MOSTLY |
| `crm-proxy` | JWT | getUser | org-wide remote CRM + hardcoded `ARYX_ORG_ID` audit | external DB | none | YES authn / weak tenant on CRM rows |
| `connector-sync` | JWT | getUser | writes `ARYX_ORG_ID` | single org | daily `sync_runs` key | YES |
| `send-auth-email` | public POST | Standard Webhooks HMAC | n/a | n/a | none | YES if secret set |
| `mail-webhook` | public | none | none | none | none | NO |
| `mail-renewal` | public | none | service role global | all due rows | none | NO |

---

## Database contract (sampled)

- Tenant key `org_id` **NOT NULL** on operational tables — CONFIRMED `information_schema`.
- RLS enabled on all 32 public tables — CONFIRMED.
- Catch-all `*_all` policies are **not** `true`; they use `org_id = current_org_id()` — CONFIRMED.
- Mail owner policies use `owner_user_id = auth.uid()` plus org — CONFIRMED.
- `mail_message_folders` / `mail_message_recipients` are org-scoped only (any org member) — CONFIRMED P3 for multi-user same org.
- No local CRM tables; CRM is external — CONFIRMED.
- Row counts: 1 org, 1 profile, 5 integration_sources, 0 everywhere else that matters — CONFIRMED.
- Missing tables still queried by mounted pages: `plan_cancellations`, `resources`, `apps` — CONFIRMED.

---

## Analytics

CosHome reads `analytics_snapshots` and shows an empty state when none exist. **Not fake-success.** Independent recompute: 0 rows → UI empty. CONFIRMED.

CTO analytics overview is a wrapper around legacy `Analytics` — chart correctness **UNVERIFIED**.

---

## Agents (build-agents)

Do **not** scaffold eve. This is an established Vite/COS stack with `GlobalAIAssistant` → `agent-chat`. That function is **repo-only**. Adding eve would create a second agent engine. Repair or hide the existing assistant.

---

## Architecture (improve-codebase-architecture)

### Current flow
Sidebar, CommandPalette/`useApps`, GalaxyDock, AdminSidebar, and dead dashboard switchers each carried their own route list. ⌘K lived on a dock that is never shown. Palette fallback pointed at `/ceo` `/cto`.

### Proposed / now in repo
One engine: `src/config/navigation.ts`. Triggers: sidebar, `useApps` fallback, command palette. `AppShell` owns ⌘K. Human-facing COS routes stay in one file.

### Files
- `src/config/navigation.ts` (engine)
- `src/hooks/useApps.ts` (fallback from engine)
- `src/components/Sidebar.tsx` + `sidebar/*`
- `src/components/shell/AppShell.tsx`, `CommandPalette.tsx`

### Trade-off
`apps` table still does not exist. If someone later creates it with leftover CEO/CTO rows, that table would override the navigation fallback. Backfill of deleted auto rows is n/a.

---

## Sidebar repair (authorized)

- Aryx void rail, gold category labels, orange active pills, mark + wordmark
- Theme toggle + notifications in header
- Search hint opens palette; ⌘K on AppShell
- Palette apps from `navigation.ts`
- Submenu active state uses `useLocation`
- Content padding `md:pl-80` / `md:pl-20`

## Completeness gate (sidebar)

- [x] intended behavior documented
- [x] UI implemented
- [x] handler wired (navigate + palette)
- [ ] runtime click-through CONFIRMED (UNVERIFIED — no auth session)
- [ ] deployed artifact matches reviewed source (repo-ahead)
- Status: **FUNCTIONAL WITH RISKS** locally; **NOT SHIPPED**

---

## Coverage

- **Verified:** env, Vercel deploy vs HEAD, 7 deployed functions + 3 downloaded sources, migration ledger vs objects, RLS predicates, tenant function, connector statuses, login page Playwright, nav↔route parity, mail/CRM/auth traces from source
- **Sampled:** Operations, Files, Assignments, Analytics overview wrapper, leftover CEO mocks
- **Untouched:** Settings fields, HIPAA CRUD, organizer, most analytics charts, IntegrationsHub, Policy, Deployments, public upload, remote CRM schema

## RESUME HERE

Next authorized repair candidates (do not start without go-ahead):

1. Gate `mail-renewal` with a cron secret; do not invoke it from the open internet
2. Implement or disable `mail-webhook` with Graph `clientState`
3. Hide or deploy `agent-chat`
4. Stop mounting `/operations` on `plan_cancellations` or add the table
5. Deploy local frontend after sidebar/auth verification
