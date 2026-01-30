import { supabase, isSupabaseConfigured } from './supabase';
import type {
  MemberPortfolioStats,
  MemberGrowthTrend,
  PlanDistribution,
  StatusDistribution,
  AdvisorPerformanceMetric,
  CommandCenterAnalytics,
} from '../types/commandCenter';
import { getDownlineAdvisorIds } from './advisorHierarchyService';

// ============================================
// Portfolio Statistics
// ============================================

/**
 * Get portfolio statistics for an advisor
 * @param advisorId - The advisor's agent_id
 * @param includeDownline - Whether to include downline members
 * @returns Portfolio statistics
 */
export async function getPortfolioStats(
  advisorId: string,
  includeDownline = true
): Promise<MemberPortfolioStats> {
  if (!isSupabaseConfigured) {
    return getMockPortfolioStats();
  }

  try {
    // Get advisor IDs to include
    const advisorIds = includeDownline
      ? await getDownlineAdvisorIds(advisorId)
      : [advisorId];

    // Get member counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('member_profiles')
      .select('status')
      .in('assigned_advisor_id', advisorIds);

    if (statusError) {
      console.error('[AdvisorAnalytics] Error fetching status counts:', statusError);
      return getMockPortfolioStats();
    }

    // Calculate counts
    const counts = {
      active: 0,
      pending: 0,
      inactive: 0,
      cancelled: 0,
      suspended: 0,
    };

    for (const member of statusCounts || []) {
      const status = member.status as keyof typeof counts;
      if (status in counts) {
        counts[status]++;
      }
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const active = counts.active;

    // Calculate retention rate (active / (active + cancelled))
    const retentionBase = active + counts.cancelled;
    const retentionRate = retentionBase > 0 ? (active / retentionBase) * 100 : 100;

    // Get growth rate (last 30 days vs previous 30 days)
    const growthRate = await calculateGrowthRate(advisorIds);

    // Get average tenure
    const avgTenure = await calculateAverageTenure(advisorIds);

    return {
      total_members: total,
      active_members: active,
      pending_members: counts.pending,
      inactive_members: counts.inactive,
      cancelled_members: counts.cancelled,
      retention_rate: Math.round(retentionRate * 10) / 10,
      growth_rate: growthRate,
      avg_member_tenure_days: avgTenure,
    };
  } catch (err) {
    console.error('[AdvisorAnalytics] Exception:', err);
    return getMockPortfolioStats();
  }
}

/**
 * Get member growth trends over time
 * @param advisorId - The advisor's agent_id
 * @param includeDownline - Whether to include downline members
 * @param months - Number of months of data to return
 * @returns Array of growth trend data points
 */
export async function getMemberGrowthTrends(
  advisorId: string,
  includeDownline = true,
  months = 12
): Promise<MemberGrowthTrend[]> {
  if (!isSupabaseConfigured) {
    return getMockGrowthTrends(months);
  }

  try {
    const advisorIds = includeDownline
      ? await getDownlineAdvisorIds(advisorId)
      : [advisorId];

    // Get members with enrollment dates
    const { data: members, error } = await supabase
      .from('member_profiles')
      .select('enrollment_date, status, created_at')
      .in('assigned_advisor_id', advisorIds)
      .order('enrollment_date', { ascending: true });

    if (error) {
      console.error('[AdvisorAnalytics] Error fetching growth data:', error);
      return getMockGrowthTrends(months);
    }

    // Group by month
    const monthlyData = new Map<string, { new: number; cancelled: number; total: number }>();
    const today = new Date();

    // Initialize months
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.set(key, { new: 0, cancelled: 0, total: 0 });
    }

    // Count members per month
    let _runningTotal = 0;
    for (const member of members || []) {
      const enrollDate = member.enrollment_date || member.created_at;
      if (!enrollDate) continue;

      const date = new Date(enrollDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyData.has(key)) {
        const data = monthlyData.get(key)!;
        data.new++;
        _runningTotal++;
      }

      if (member.status === 'cancelled') {
        // Simplified: count cancelled in their enrollment month
        if (monthlyData.has(key)) {
          monthlyData.get(key)!.cancelled++;
        }
      }
    }

    // Convert to array and calculate totals
    const trends: MemberGrowthTrend[] = [];
    let cumulativeTotal = 0;

    for (const [date, data] of monthlyData) {
      cumulativeTotal += data.new - data.cancelled;
      trends.push({
        date,
        total: Math.max(0, cumulativeTotal),
        new_members: data.new,
        cancelled: data.cancelled,
        net_change: data.new - data.cancelled,
      });
    }

    return trends;
  } catch (err) {
    console.error('[AdvisorAnalytics] Exception:', err);
    return getMockGrowthTrends(months);
  }
}

/**
 * Get plan distribution for members
 * @param advisorId - The advisor's agent_id
 * @param includeDownline - Whether to include downline members
 * @returns Array of plan distribution data
 */
export async function getPlanDistribution(
  advisorId: string,
  includeDownline = true
): Promise<PlanDistribution[]> {
  if (!isSupabaseConfigured) {
    return getMockPlanDistribution();
  }

  try {
    const advisorIds = includeDownline
      ? await getDownlineAdvisorIds(advisorId)
      : [advisorId];

    const { data, error } = await supabase
      .from('member_profiles')
      .select('plan_type, plan_name')
      .in('assigned_advisor_id', advisorIds)
      .not('status', 'eq', 'cancelled');

    if (error) {
      console.error('[AdvisorAnalytics] Error fetching plan distribution:', error);
      return getMockPlanDistribution();
    }

    // Count by plan type
    const planCounts = new Map<string, { count: number; name: string }>();
    for (const member of data || []) {
      const type = member.plan_type || 'unknown';
      const current = planCounts.get(type) || { count: 0, name: member.plan_name || type };
      planCounts.set(type, { count: current.count + 1, name: current.name });
    }

    const total = data?.length || 0;
    const colors: Record<string, string> = {
      basic: '#60A5FA',
      standard: '#34D399',
      premium: '#A78BFA',
      enterprise: '#F472B6',
      unknown: '#9CA3AF',
    };

    return Array.from(planCounts.entries()).map(([type, { count, name }]) => ({
      plan_type: type as PlanDistribution['plan_type'],
      plan_name: name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      color: colors[type] || colors.unknown,
    }));
  } catch (err) {
    console.error('[AdvisorAnalytics] Exception:', err);
    return getMockPlanDistribution();
  }
}

/**
 * Get status distribution for members
 * @param advisorId - The advisor's agent_id
 * @param includeDownline - Whether to include downline members
 * @returns Array of status distribution data
 */
export async function getStatusDistribution(
  advisorId: string,
  includeDownline = true
): Promise<StatusDistribution[]> {
  if (!isSupabaseConfigured) {
    return getMockStatusDistribution();
  }

  try {
    const advisorIds = includeDownline
      ? await getDownlineAdvisorIds(advisorId)
      : [advisorId];

    const { data, error } = await supabase
      .from('member_profiles')
      .select('status')
      .in('assigned_advisor_id', advisorIds);

    if (error) {
      console.error('[AdvisorAnalytics] Error fetching status distribution:', error);
      return getMockStatusDistribution();
    }

    // Count by status
    const statusCounts = new Map<string, number>();
    for (const member of data || []) {
      const status = member.status || 'unknown';
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    }

    const total = data?.length || 0;
    const colors: Record<string, string> = {
      active: '#34D399',
      pending: '#FBBF24',
      inactive: '#9CA3AF',
      cancelled: '#F87171',
      suspended: '#FB923C',
    };

    return Array.from(statusCounts.entries()).map(([status, count]) => ({
      status: status as StatusDistribution['status'],
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      color: colors[status] || '#9CA3AF',
    }));
  } catch (err) {
    console.error('[AdvisorAnalytics] Exception:', err);
    return getMockStatusDistribution();
  }
}

/**
 * Get performance metrics for advisors in the hierarchy
 * @param advisorId - The root advisor's agent_id
 * @returns Array of advisor performance metrics
 */
export async function getAdvisorPerformanceMetrics(
  advisorId: string
): Promise<AdvisorPerformanceMetric[]> {
  if (!isSupabaseConfigured) {
    return getMockAdvisorPerformance();
  }

  try {
    const advisorIds = await getDownlineAdvisorIds(advisorId);

    // Get advisors info
    const { data: advisors, error: advisorError } = await supabase
      .from('advisors')
      .select('agent_id, full_name')
      .in('agent_id', advisorIds);

    if (advisorError) {
      console.error('[AdvisorAnalytics] Error fetching advisors:', advisorError);
      return getMockAdvisorPerformance();
    }

    // Get member stats per advisor
    const { data: members, error: memberError } = await supabase
      .from('member_profiles')
      .select('assigned_advisor_id, status, enrollment_date')
      .in('assigned_advisor_id', advisorIds);

    if (memberError) {
      console.error('[AdvisorAnalytics] Error fetching member stats:', memberError);
      return getMockAdvisorPerformance();
    }

    // Calculate metrics per advisor
    const _advisorMap = new Map(advisors?.map((a) => [a.agent_id, a.full_name]) || []);
    const metrics = new Map<string, AdvisorPerformanceMetric>();

    for (const advisor of advisors || []) {
      metrics.set(advisor.agent_id, {
        advisor_id: advisor.agent_id,
        advisor_name: advisor.full_name,
        total_members: 0,
        active_members: 0,
        retention_rate: 100,
        new_this_month: 0,
        cancelled_this_month: 0,
      });
    }

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    for (const member of members || []) {
      const advisorId = member.assigned_advisor_id;
      if (!advisorId || !metrics.has(advisorId)) continue;

      const metric = metrics.get(advisorId)!;
      metric.total_members++;

      if (member.status === 'active') {
        metric.active_members++;
      } else if (member.status === 'cancelled') {
        const enrollDate = new Date(member.enrollment_date);
        if (enrollDate >= thisMonth) {
          metric.cancelled_this_month++;
        }
      }

      const enrollDate = new Date(member.enrollment_date);
      if (enrollDate >= thisMonth) {
        metric.new_this_month++;
      }
    }

    // Calculate retention rates
    for (const metric of metrics.values()) {
      const base = metric.active_members + metric.cancelled_this_month;
      metric.retention_rate = base > 0 ? Math.round((metric.active_members / base) * 1000) / 10 : 100;
    }

    return Array.from(metrics.values()).sort((a, b) => b.total_members - a.total_members);
  } catch (err) {
    console.error('[AdvisorAnalytics] Exception:', err);
    return getMockAdvisorPerformance();
  }
}

/**
 * Get comprehensive analytics for the command center
 * @param advisorId - The advisor's agent_id
 * @param includeDownline - Whether to include downline members
 * @returns Complete analytics object
 */
export async function getCommandCenterAnalytics(
  advisorId: string,
  includeDownline = true
): Promise<CommandCenterAnalytics> {
  const [portfolioStats, growthTrends, planDistribution, statusDistribution, advisorPerformance] =
    await Promise.all([
      getPortfolioStats(advisorId, includeDownline),
      getMemberGrowthTrends(advisorId, includeDownline),
      getPlanDistribution(advisorId, includeDownline),
      getStatusDistribution(advisorId, includeDownline),
      includeDownline ? getAdvisorPerformanceMetrics(advisorId) : Promise.resolve(undefined),
    ]);

  return {
    portfolio_stats: portfolioStats,
    growth_trends: growthTrends,
    plan_distribution: planDistribution,
    status_distribution: statusDistribution,
    advisor_performance: advisorPerformance,
  };
}

// ============================================
// Helper Functions
// ============================================

async function calculateGrowthRate(advisorIds: string[]): Promise<number> {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

  try {
    // Count members enrolled in last 30 days
    const { count: recentCount } = await supabase
      .from('member_profiles')
      .select('*', { count: 'exact', head: true })
      .in('assigned_advisor_id', advisorIds)
      .gte('enrollment_date', thirtyDaysAgo.toISOString());

    // Count members enrolled in previous 30 days
    const { count: previousCount } = await supabase
      .from('member_profiles')
      .select('*', { count: 'exact', head: true })
      .in('assigned_advisor_id', advisorIds)
      .gte('enrollment_date', sixtyDaysAgo.toISOString())
      .lt('enrollment_date', thirtyDaysAgo.toISOString());

    const recent = recentCount || 0;
    const previous = previousCount || 0;

    if (previous === 0) return recent > 0 ? 100 : 0;
    return Math.round(((recent - previous) / previous) * 1000) / 10;
  } catch {
    return 0;
  }
}

async function calculateAverageTenure(advisorIds: string[]): Promise<number> {
  try {
    const { data } = await supabase
      .from('member_profiles')
      .select('enrollment_date')
      .in('assigned_advisor_id', advisorIds)
      .eq('status', 'active')
      .not('enrollment_date', 'is', null);

    if (!data || data.length === 0) return 0;

    const today = new Date();
    let totalDays = 0;

    for (const member of data) {
      const enrollDate = new Date(member.enrollment_date);
      const days = Math.floor((today.getTime() - enrollDate.getTime()) / (24 * 60 * 60 * 1000));
      totalDays += days;
    }

    return Math.round(totalDays / data.length);
  } catch {
    return 0;
  }
}

// ============================================
// Mock Data Functions
// ============================================

function getMockPortfolioStats(): MemberPortfolioStats {
  return {
    total_members: 247,
    active_members: 231,
    pending_members: 12,
    inactive_members: 3,
    cancelled_members: 1,
    retention_rate: 94.3,
    growth_rate: 12.5,
    avg_member_tenure_days: 342,
  };
}

function getMockGrowthTrends(months: number): MemberGrowthTrend[] {
  const trends: MemberGrowthTrend[] = [];
  const today = new Date();
  let total = 150;

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const newMembers = Math.floor(Math.random() * 15) + 5;
    const cancelled = Math.floor(Math.random() * 3);
    total += newMembers - cancelled;

    trends.push({
      date: key,
      total,
      new_members: newMembers,
      cancelled,
      net_change: newMembers - cancelled,
    });
  }

  return trends;
}

function getMockPlanDistribution(): PlanDistribution[] {
  return [
    { plan_type: 'basic', plan_name: 'Basic Plan', count: 45, percentage: 18.2, color: '#60A5FA' },
    { plan_type: 'standard', plan_name: 'Standard Plan', count: 120, percentage: 48.6, color: '#34D399' },
    { plan_type: 'premium', plan_name: 'Premium Plan', count: 72, percentage: 29.1, color: '#A78BFA' },
    { plan_type: 'enterprise', plan_name: 'Enterprise Plan', count: 10, percentage: 4.1, color: '#F472B6' },
  ];
}

function getMockStatusDistribution(): StatusDistribution[] {
  return [
    { status: 'active', count: 231, percentage: 93.5, color: '#34D399' },
    { status: 'pending', count: 12, percentage: 4.9, color: '#FBBF24' },
    { status: 'inactive', count: 3, percentage: 1.2, color: '#9CA3AF' },
    { status: 'cancelled', count: 1, percentage: 0.4, color: '#F87171' },
  ];
}

function getMockAdvisorPerformance(): AdvisorPerformanceMetric[] {
  return [
    {
      advisor_id: 'adv-001',
      advisor_name: 'John Smith',
      total_members: 122,
      active_members: 118,
      retention_rate: 96.7,
      new_this_month: 8,
      cancelled_this_month: 0,
    },
    {
      advisor_id: 'adv-002',
      advisor_name: 'Sarah Johnson',
      total_members: 73,
      active_members: 68,
      retention_rate: 93.2,
      new_this_month: 5,
      cancelled_this_month: 1,
    },
    {
      advisor_id: 'adv-003',
      advisor_name: 'Mike Wilson',
      total_members: 52,
      active_members: 45,
      retention_rate: 86.5,
      new_this_month: 3,
      cancelled_this_month: 0,
    },
  ];
}
