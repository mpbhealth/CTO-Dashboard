import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { isOperatorRole } from '@/lib/cos';

export interface CosOrgLink {
  org_id: string;
  accounts_org_id: string;
  enrollment_org_id: string | null;
  crm_org_id: string | null;
  advisoriq_org_id: string | null;
  marketflow_team_id: string | null;
  ticket_scope: 'none' | 'mpb_pilot' | 'mapped';
  is_active: boolean;
}

export interface Membership {
  org_id: string;
  role: string;
  orgs?: { id: string; name: string; slug: string } | null;
}

interface OrgContextValue {
  orgId: string | null;
  role: string | null;
  memberships: Membership[];
  link: CosOrgLink | null;
  rollup: boolean;
  setRollup: (next: boolean) => void;
  switchOrg: (orgId: string) => Promise<void>;
  isOperator: boolean;
  linked: {
    enrollment: boolean;
    crm: boolean;
    advisoriq: boolean;
    tickets: boolean;
    traffic: boolean;
  };
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { profile, user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const rollupKey = `cos-rollup:${user?.id || 'anon'}`;

  const memberships = useQuery({
    queryKey: ['org-memberships', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_memberships')
        .select('org_id, role, orgs(id, name, slug)');
      if (error) throw error;
      return (data || []) as Membership[];
    },
  });

  const links = useQuery({
    queryKey: ['cos-org-links', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cos_org_link')
        .select('org_id, accounts_org_id, enrollment_org_id, crm_org_id, advisoriq_org_id, marketflow_team_id, ticket_scope, is_active');
      if (error) throw error;
      return (data || []) as CosOrgLink[];
    },
  });

  const switchOrg = useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase.rpc('set_active_org', { p_org: orgId });
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      await queryClient.invalidateQueries();
    },
  });

  const setRollup = useCallback((next: boolean) => {
    window.sessionStorage.setItem(rollupKey, next ? '1' : '0');
    queryClient.invalidateQueries({ queryKey: ['cos-rollup'] });
  }, [queryClient, rollupKey]);

  const rollupFlag = useQuery({
    queryKey: ['cos-rollup', rollupKey],
    queryFn: async () => window.sessionStorage.getItem(rollupKey) === '1',
  });

  const role = memberships.data?.find((row) => row.org_id === profile?.org_id)?.role || profile?.role || null;
  const allLinks = links.data || [];
  const currentLink = allLinks.find((row) => row.org_id === profile?.org_id) || null;
  const rollupOn = Boolean(rollupFlag.data) && (memberships.data || []).length > 1;
  const scopedLinks = rollupOn ? allLinks : (currentLink ? [currentLink] : []);
  const ticketLinked = (row: CosOrgLink) => row.ticket_scope === 'mpb_pilot' || row.ticket_scope === 'mapped';

  const value = useMemo<OrgContextValue>(() => ({
    orgId: profile?.org_id || null,
    role,
    memberships: memberships.data || [],
    link: currentLink,
    rollup: rollupOn,
    setRollup,
    switchOrg: (id: string) => switchOrg.mutateAsync(id),
    isOperator: isOperatorRole(role),
    linked: {
      enrollment: scopedLinks.some((row) => Boolean(row.enrollment_org_id)),
      crm: scopedLinks.some((row) => Boolean(row.crm_org_id)),
      advisoriq: scopedLinks.some((row) => Boolean(row.advisoriq_org_id)),
      tickets: scopedLinks.some(ticketLinked),
      traffic: scopedLinks.some((row) => Boolean(row.marketflow_team_id)),
    },
  }), [currentLink, memberships.data, profile?.org_id, role, rollupOn, scopedLinks, setRollup, switchOrg]);

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}
