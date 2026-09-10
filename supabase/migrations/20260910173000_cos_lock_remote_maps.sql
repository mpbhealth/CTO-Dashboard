-- Lock remote org maps. Authenticated users must not retarget EnrollFlow/CRM/IQ.
set lock_timeout = '5s';

drop policy if exists cos_org_link_update on public.cos_org_link;
revoke update, insert, delete on public.cos_org_link from authenticated, anon, public;
grant select on public.cos_org_link to authenticated;

revoke all on public.fact_enrollments_daily, public.fact_crm_pipeline_daily,
  public.fact_tickets_daily, public.fact_traffic_daily, public.fact_pnl_period,
  public.fact_vendor_costs_monthly, public.advisor_scorecards, public.fact_product_mix,
  public.forecast_runs, public.org_memberships, public.aryx_identity_map
  from anon, public;

grant select on public.fact_enrollments_daily, public.fact_crm_pipeline_daily,
  public.fact_tickets_daily, public.fact_traffic_daily, public.fact_pnl_period,
  public.fact_vendor_costs_monthly, public.advisor_scorecards, public.fact_product_mix
  to authenticated;
grant select, insert on public.forecast_runs to authenticated;
grant select on public.org_memberships, public.aryx_identity_map to authenticated;

revoke all on function public.set_active_org(uuid) from public, anon;
revoke all on function public.member_org_ids() from public, anon;
revoke all on function public.is_org_operator(uuid) from public, anon;
grant execute on function public.set_active_org(uuid) to authenticated;
grant execute on function public.member_org_ids() to authenticated;
grant execute on function public.is_org_operator(uuid) to authenticated;
