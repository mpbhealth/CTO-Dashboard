// ============================================
// Member Analytics Hooks
// Fetches real data from MPB Health App project
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { mpbMemberSupabase, isMpbMemberConfigured } from '../lib/mpbMemberSupabase';
import { logger } from '../lib/logger';

// ─── Types ──────────────────────────────────

export interface MemberOverviewData {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  primaryMembers: number;
  activePrimary: number;
  activeDependents: number;
  dependents: number;
  appUsers: number;
  appPrimary: number;
  appDependents: number;
  appAdoptionRate: number;
  retentionRate: number;
  newThisMonth: number;
  growthRate: number;
  // Dashboard-specific metrics
  inactivatingThisMonth: number;
  startingNextMonth: number;
  scheduledFuture: number;
  scheduledToExpire: number;
  activatedThisMonth: number;
  inactivatedThisMonth: number;
  netChange: number;
}

export interface MemberGrowthPoint {
  month: string;
  newMembers: number;
  primaryMembers: number;
  dependents: number;
}

export interface AppAdoptionPoint {
  month: string;
  registrations: number;
  cumulative: number;
}

export interface ProductDistItem {
  product: string;
  total: number;
  active: number;
  inactive: number;
}

export interface MonthlyActivityPoint {
  month: string;
  activations: number;
  inactivations: number;
}

export interface ChurnPoint {
  month: string;
  churned: number;
}

export interface ChurnReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface CohortRow {
  cohort: string;
  totalEnrolled: number;
  stillActive: number;
  retentionRate: number;
}

export interface RetentionData {
  retentionRate: number;
  totalChurned: number;
  churnThisMonth: number;
  monthlyChurn: ChurnPoint[];
  churnReasons: ChurnReason[];
  cohorts: CohortRow[];
}

export interface AdvisorRow {
  agentId: string;
  name: string;
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  retentionRate: number;
}

export interface AdvisorAnalyticsData {
  totalAdvisors: number;
  avgMembersPerAdvisor: number;
  topRetentionRate: number;
  avgRetentionRate: number;
  advisors: AdvisorRow[];
}

// ─── Helpers ────────────────────────────────

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr + '-01');
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// Supabase JS defaults to 1,000 rows. We fetch in pages to get ALL rows.
const PAGE_SIZE = 1000;

async function fetchAllPaged(
  table: string,
  selectCols: string,
  filters?: { column: string; op: string; value: string }[]
) {
  const all: Record<string, unknown>[] = [];
  let from = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let q = mpbMemberSupabase.from(table).select(selectCols);
    if (filters) {
      for (const f of filters) {
        if (f.op === 'not.is') q = q.not(f.column, 'is', null);
        else if (f.op === 'gte') q = q.gte(f.column, f.value);
      }
    }
    const { data, error } = await q.range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = (data || []) as Record<string, unknown>[];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

// ─── useMemberOverview ──────────────────────

export function useMemberOverview() {
  const [data, setData] = useState<MemberOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isMpbMemberConfigured) {
      setError('MPB Member database not configured');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch ALL members (paginated to bypass 1,000-row limit)
      const allMembers = await fetchAllPaged('members', 'is_active, is_primary, active_date, inactive_date');

      // Fetch app users count
      const { count: appUsersCount } = await mpbMemberSupabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch app user breakdown (primary vs dependent) — paginated
      const appUserRows = await fetchAllPaged('users', 'is_primary');

      const members = allMembers;
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const monthStartStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];
      const twoMonthsStart = new Date(now.getFullYear(), now.getMonth() + 2, 1).toISOString().split('T')[0];
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];

      const total = members.length;
      const active = members.filter(m => m.is_active).length;
      const inactive = total - active;
      const primary = members.filter(m => m.is_primary).length;
      const activePrimary = members.filter(m => m.is_active && m.is_primary).length;
      const activeDependents = members.filter(m => m.is_active && !m.is_primary).length;
      const users = appUsersCount ?? 0;
      const appPrimary = (appUserRows || []).filter(u => u.is_primary).length;
      const appDependents = users - appPrimary;

      // This month metrics
      const activatedThisMonth = members.filter(
        m => m.active_date && (m.active_date as string) >= monthStartStr && (m.active_date as string) <= todayStr
      ).length;

      const inactivatedThisMonth = members.filter(
        m => m.inactive_date && (m.inactive_date as string) >= monthStartStr && (m.inactive_date as string) <= todayStr
      ).length;

      // Inactivating this month (active but have inactive_date this month)
      const inactivatingThisMonth = members.filter(
        m => m.is_active && m.inactive_date &&
          (m.inactive_date as string) >= monthStartStr &&
          (m.inactive_date as string) < nextMonthStart
      ).length;

      // Starting next month
      const startingNextMonth = members.filter(
        m => m.active_date &&
          (m.active_date as string) >= nextMonthStart &&
          (m.active_date as string) < twoMonthsStart
      ).length;

      // Scheduled future (beyond next month)
      const scheduledFuture = members.filter(
        m => m.active_date && (m.active_date as string) >= twoMonthsStart
      ).length;

      // Scheduled to expire (active with future inactive_date)
      const scheduledToExpire = members.filter(
        m => m.is_active && m.inactive_date && (m.inactive_date as string) > todayStr
      ).length;

      // Previous month new members for growth rate
      const thisMonthNew = members.filter(
        m => m.active_date && (m.active_date as string) >= monthStartStr
      ).length;
      const lastMonthNew = members.filter(
        m => m.active_date &&
          (m.active_date as string) >= prevMonthStart &&
          (m.active_date as string) < monthStartStr
      ).length;

      const netChange = activatedThisMonth - inactivatedThisMonth;

      setData({
        totalMembers: total,
        activeMembers: active,
        inactiveMembers: inactive,
        primaryMembers: primary,
        activePrimary,
        activeDependents,
        dependents: total - primary,
        appUsers: users,
        appPrimary,
        appDependents,
        appAdoptionRate: primary > 0 ? Math.round((users / primary) * 1000) / 10 : 0,
        retentionRate: total > 0 ? Math.round((active / total) * 1000) / 10 : 0,
        newThisMonth: thisMonthNew,
        growthRate: lastMonthNew > 0 ? Math.round(((thisMonthNew - lastMonthNew) / lastMonthNew) * 1000) / 10 : 0,
        inactivatingThisMonth,
        startingNextMonth,
        scheduledFuture,
        scheduledToExpire,
        activatedThisMonth,
        inactivatedThisMonth,
        netChange,
      });
    } catch (err) {
      logger.error('Error fetching member overview:', err);
      setError('Failed to fetch member data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── useMemberGrowth ────────────────────────

export function useMemberGrowth(months = 12) {
  const [data, setData] = useState<MemberGrowthPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isMpbMemberConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);

      const members = await fetchAllPaged('members', 'active_date, is_primary', [
        { column: 'active_date', op: 'not.is', value: '' },
        { column: 'active_date', op: 'gte', value: cutoff.toISOString().split('T')[0] },
      ]);

      // Aggregate by month
      const byMonth: Record<string, { total: number; primary: number; dependents: number }> = {};

      for (const m of members) {
        const month = (m.active_date as string).substring(0, 7);
        if (!byMonth[month]) byMonth[month] = { total: 0, primary: 0, dependents: 0 };
        byMonth[month].total++;
        if (m.is_primary) byMonth[month].primary++;
        else byMonth[month].dependents++;
      }

      const sorted = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, vals]) => ({
          month: formatMonth(month),
          newMembers: vals.total,
          primaryMembers: vals.primary,
          dependents: vals.dependents,
        }));

      setData(sorted);
    } catch (err) {
      logger.error('Error fetching member growth:', err);
      setError('Failed to fetch growth data');
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── useAppAdoption ─────────────────────────

export function useAppAdoption(months = 12) {
  const [data, setData] = useState<AppAdoptionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isMpbMemberConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);

      const users = await fetchAllPaged('users', 'created_date', [
        { column: 'created_date', op: 'not.is', value: '' },
        { column: 'created_date', op: 'gte', value: cutoff.toISOString() },
      ]);

      // Aggregate by month
      const byMonth: Record<string, number> = {};

      for (const u of users) {
        const month = (u.created_date as string).substring(0, 7);
        byMonth[month] = (byMonth[month] || 0) + 1;
      }

      let cumulative = 0;
      const sorted = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => {
          cumulative += count;
          return {
            month: formatMonth(month),
            registrations: count,
            cumulative,
          };
        });

      setData(sorted);
    } catch (err) {
      logger.error('Error fetching app adoption:', err);
      setError('Failed to fetch adoption data');
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── useMonthlyActivity ─────────────────────

export function useMonthlyActivity(months = 6) {
  const [data, setData] = useState<MonthlyActivityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isMpbMemberConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      const cutoffStr = cutoff.toISOString().split('T')[0];

      // Fetch ALL activations/inactivations (paginated)
      const members = await fetchAllPaged('members', 'active_date, inactive_date');

      const activByMonth: Record<string, number> = {};
      const inactivByMonth: Record<string, number> = {};

      for (const m of members) {
        if (m.active_date && (m.active_date as string) >= cutoffStr) {
          const month = (m.active_date as string).substring(0, 7);
          activByMonth[month] = (activByMonth[month] || 0) + 1;
        }
        if (m.inactive_date && (m.inactive_date as string) >= cutoffStr) {
          const month = (m.inactive_date as string).substring(0, 7);
          inactivByMonth[month] = (inactivByMonth[month] || 0) + 1;
        }
      }

      // Combine all months
      const allMonths = new Set([...Object.keys(activByMonth), ...Object.keys(inactivByMonth)]);
      const sorted = Array.from(allMonths)
        .sort()
        .map(month => ({
          month: formatMonth(month),
          activations: activByMonth[month] || 0,
          inactivations: inactivByMonth[month] || 0,
        }));

      setData(sorted);
    } catch (err) {
      logger.error('Error fetching monthly activity:', err);
      setError('Failed to fetch activity data');
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── useProductDistribution ─────────────────

export function useProductDistribution() {
  const [data, setData] = useState<ProductDistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isMpbMemberConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const members = await fetchAllPaged('members', 'product_label, is_active');

      // Aggregate
      const byProduct: Record<string, { total: number; active: number; inactive: number }> = {};

      for (const m of members) {
        const label = (m.product_label as string) || 'Unknown';
        if (!byProduct[label]) byProduct[label] = { total: 0, active: 0, inactive: 0 };
        byProduct[label].total++;
        if (m.is_active) byProduct[label].active++;
        else byProduct[label].inactive++;
      }

      const sorted = Object.entries(byProduct)
        .sort(([, a], [, b]) => b.total - a.total)
        .filter(([, v]) => v.total >= 5) // Only show plans with 5+ members
        .map(([product, vals]) => ({
          product,
          total: vals.total,
          active: vals.active,
          inactive: vals.inactive,
        }));

      setData(sorted);
    } catch (err) {
      logger.error('Error fetching product distribution:', err);
      setError('Failed to fetch product data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── useMemberRetentionData ─────────────────

export function useMemberRetentionData() {
  const [data, setData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isMpbMemberConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get ALL members for retention/churn calculations (paginated)
      const allMembers = await fetchAllPaged('members', 'is_active, active_date, inactive_date, inactive_reason');
      const total = allMembers.length;
      const active = allMembers.filter(m => m.is_active).length;
      const inactive = total - active;

      // Current month churn
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const churnThisMonth = allMembers.filter(
        m => !m.is_active && m.inactive_date && (m.inactive_date as string) >= monthStart
      ).length;

      // Monthly churn timeline
      const churnByMonth: Record<string, number> = {};
      for (const m of allMembers) {
        if (!m.is_active && m.inactive_date) {
          const month = (m.inactive_date as string).substring(0, 7);
          churnByMonth[month] = (churnByMonth[month] || 0) + 1;
        }
      }

      const monthlyChurn = Object.entries(churnByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, churned]) => ({
          month: formatMonth(month),
          churned,
        }));

      // Churn reasons
      const reasonCounts: Record<string, number> = {};
      for (const m of allMembers) {
        if (!m.is_active && m.inactive_reason) {
          const reason = m.inactive_reason as string;
          reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        }
      }

      const churnReasons = Object.entries(reasonCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: inactive > 0 ? Math.round((count / inactive) * 1000) / 10 : 0,
        }));

      // Cohort analysis (by active_date month, last 12 months)
      const cohortMonths: Record<string, { enrolled: number; active: number }> = {};
      for (const m of allMembers) {
        if (m.active_date) {
          const month = (m.active_date as string).substring(0, 7);
          if (!cohortMonths[month]) cohortMonths[month] = { enrolled: 0, active: 0 };
          cohortMonths[month].enrolled++;
          if (m.is_active) cohortMonths[month].active++;
        }
      }

      const cohorts = Object.entries(cohortMonths)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 12)
        .map(([month, vals]) => ({
          cohort: formatMonth(month),
          totalEnrolled: vals.enrolled,
          stillActive: vals.active,
          retentionRate: vals.enrolled > 0 ? Math.round((vals.active / vals.enrolled) * 1000) / 10 : 0,
        }));

      setData({
        retentionRate: total > 0 ? Math.round((active / total) * 1000) / 10 : 0,
        totalChurned: inactive,
        churnThisMonth,
        monthlyChurn,
        churnReasons,
        cohorts,
      });
    } catch (err) {
      logger.error('Error fetching retention data:', err);
      setError('Failed to fetch retention data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── useAdvisorAnalytics ────────────────────

export function useAdvisorAnalytics() {
  const [data, setData] = useState<AdvisorAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isMpbMemberConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all advisors (paginated)
      const advisors = await fetchAllPaged('advisors', 'agent_id, first_name, last_name');

      // Fetch ALL members with agent_id (paginated)
      const members = await fetchAllPaged('members', 'agent_id, is_active');

      // Build advisor → member map
      const membersByAdvisor: Record<string, { total: number; active: number }> = {};
      for (const m of members) {
        if (!m.agent_id) continue;
        const id = m.agent_id as string;
        if (!membersByAdvisor[id]) membersByAdvisor[id] = { total: 0, active: 0 };
        membersByAdvisor[id].total++;
        if (m.is_active) membersByAdvisor[id].active++;
      }

      // Merge with advisor names
      const advisorRows: AdvisorRow[] = (advisors || [])
        .map(a => {
          const stats = membersByAdvisor[a.agent_id as string] || { total: 0, active: 0 };
          return {
            agentId: a.agent_id as string,
            name: `${(a.first_name as string || '').trim()} ${(a.last_name as string || '').trim()}`.trim(),
            totalMembers: stats.total,
            activeMembers: stats.active,
            inactiveMembers: stats.total - stats.active,
            retentionRate: stats.total > 0 ? Math.round((stats.active / stats.total) * 1000) / 10 : 0,
          };
        })
        .filter(a => a.totalMembers > 0)
        .sort((a, b) => b.totalMembers - a.totalMembers);

      const totalAdvisors = advisorRows.length;
      const avgMembers = totalAdvisors > 0
        ? Math.round(advisorRows.reduce((s, a) => s + a.totalMembers, 0) / totalAdvisors)
        : 0;
      const topRetention = advisorRows.length > 0
        ? Math.max(...advisorRows.filter(a => a.totalMembers >= 10).map(a => a.retentionRate))
        : 0;
      const avgRetention = advisorRows.length > 0
        ? Math.round(
            advisorRows.filter(a => a.totalMembers >= 10)
              .reduce((s, a) => s + a.retentionRate, 0) /
            advisorRows.filter(a => a.totalMembers >= 10).length * 10
          ) / 10
        : 0;

      setData({
        totalAdvisors,
        avgMembersPerAdvisor: avgMembers,
        topRetentionRate: topRetention,
        avgRetentionRate: avgRetention,
        advisors: advisorRows,
      });
    } catch (err) {
      logger.error('Error fetching advisor analytics:', err);
      setError('Failed to fetch advisor data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
