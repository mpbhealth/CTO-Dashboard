import type { SupabaseClient } from 'npm:@supabase/supabase-js';

export type TicketScope = 'none' | 'mpb_pilot' | 'mapped';

export interface CosOrgLink {
  org_id: string;
  accounts_org_id: string;
  enrollment_org_id: string | null;
  crm_org_id: string | null;
  advisoriq_org_id: string | null;
  marketflow_team_id: string | null;
  ticket_scope: TicketScope;
  is_active: boolean;
}

export async function membershipsForUser(
  admin: SupabaseClient,
  userId: string,
): Promise<Array<{ org_id: string; role: string }>> {
  const { data, error } = await admin
    .from('org_memberships')
    .select('org_id, role')
    .eq('user_id', userId);
  if (error) throw new Error('membership_lookup_failed');
  return data || [];
}

export async function resolveActiveOrg(
  admin: SupabaseClient,
  userId: string,
): Promise<{ orgId: string; role: string }> {
  const { data: profile, error } = await admin
    .from('profiles')
    .select('org_id, role')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error('profile_lookup_failed');
  const memberships = await membershipsForUser(admin, userId);
  if (memberships.length === 0) throw new Error('no_org_membership');
  const preferred = profile?.org_id;
  const match = memberships.find((row) => row.org_id === preferred) || memberships[0];
  if (preferred !== match.org_id) {
    await admin.from('profiles').update({ org_id: match.org_id }).eq('user_id', userId);
  }
  return { orgId: match.org_id, role: match.role };
}

export async function loadOrgLink(admin: SupabaseClient, orgId: string): Promise<CosOrgLink | null> {
  const { data, error } = await admin
    .from('cos_org_link')
    .select('org_id, accounts_org_id, enrollment_org_id, crm_org_id, advisoriq_org_id, marketflow_team_id, ticket_scope, is_active')
    .eq('org_id', orgId)
    .maybeSingle();
  if (error) throw new Error('org_link_lookup_failed');
  return (data as CosOrgLink | null) ?? null;
}

export async function listActiveOrgIds(admin: SupabaseClient): Promise<string[]> {
  const { data, error } = await admin
    .from('cos_org_link')
    .select('org_id')
    .eq('is_active', true);
  if (error) throw new Error('org_list_failed');
  return (data || []).map((row) => String(row.org_id));
}
