-- Defense in depth: warehouse and remote maps are service-role written.
-- Authenticated operators read facts; they cannot invent Home numbers or retarget remotes.

set lock_timeout = '5s';

drop policy if exists analytics_snapshots_all on public.analytics_snapshots;
drop policy if exists analytics_snapshots_write on public.analytics_snapshots;
drop policy if exists integration_sources_update on public.integration_sources;

revoke all on public.cos_org_link from anon, public;
revoke insert, update, delete on public.cos_org_link from authenticated;
grant select on public.cos_org_link to authenticated;

revoke all on public.orgs from anon, public;
revoke insert, update, delete on public.orgs from authenticated;
grant select on public.orgs to authenticated;

revoke all on public.analytics_snapshots from anon, public;
revoke insert, update, delete on public.analytics_snapshots from authenticated;
grant select on public.analytics_snapshots to authenticated;

revoke insert, update, delete on
  public.fact_enrollments_daily,
  public.fact_crm_pipeline_daily,
  public.fact_tickets_daily,
  public.fact_traffic_daily,
  public.fact_pnl_period,
  public.fact_vendor_costs_monthly,
  public.advisor_scorecards,
  public.fact_product_mix
  from authenticated, anon, public;

revoke insert, update, delete on public.org_memberships, public.aryx_identity_map from authenticated, anon, public;
grant select on public.org_memberships, public.aryx_identity_map to authenticated;

revoke update, delete on public.forecast_runs from authenticated, anon, public;
grant select, insert on public.forecast_runs to authenticated;

revoke update on public.integration_sources from authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
