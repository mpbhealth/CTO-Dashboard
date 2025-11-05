import { supabase } from './supabase';

export interface WeeklyPerformanceMetrics {
  dateRange: string;
  weekStart: string;
  weekEnd: string;
  activeAgents: number;
  totalMembers: number;
  avgPhoneHours: number;
  totalTasks: number;
  totalRxRequests: number;
  lastImported: string;
}

export interface AgentPerformanceDetail {
  agentName: string;
  weeklyStats: {
    membersAttended: number;
    phoneHours: number;
    crmTasks: number;
    rxRequests: number;
    imagingRequests: number;
    labRequests: number;
    apptRequests: number;
  };
  performanceScore: number;
  rank: number;
}

export interface DailyInteractionMetrics {
  date: string;
  totalInteractions: number;
  uniqueMembers: number;
  noCallDays: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  topIssueCategories: string[];
}

export interface AfterHoursMetrics {
  date: string;
  totalCalls: number;
  weekendCalls: number;
  lateNightCalls: number;
  avgUrgency: number;
  uniqueCallers: number;
  peakHours: number[];
}

export interface IssueCategoryBreakdown {
  category: string;
  count: number;
  avgPriority: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface ConciergeOverviewMetrics {
  weeklyMetrics: {
    currentWeek: WeeklyPerformanceMetrics | null;
    previousWeek: WeeklyPerformanceMetrics | null;
    changePercent: {
      members: number;
      phoneHours: number;
      tasks: number;
    };
  };
  dailyMetrics: {
    last7Days: number;
    avgInteractionsPerDay: number;
    topIssue: string;
  };
  afterHoursMetrics: {
    last30Days: number;
    avgUrgency: number;
    peakHour: number;
  };
}

export async function getWeeklySummary(
  limit: number = 10
): Promise<WeeklyPerformanceMetrics[]> {
  const { data, error } = await supabase
    .from('concierge_weekly_summary')
    .select('*')
    .order('week_start_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch weekly summary:', error);
    return [];
  }

  return (data || []).map((row) => ({
    dateRange: row.date_range,
    weekStart: row.week_start_date,
    weekEnd: row.week_end_date,
    activeAgents: row.active_agents,
    totalMembers: row.total_members,
    avgPhoneHours: row.avg_phone_hours,
    totalTasks: row.total_tasks,
    totalRxRequests: row.total_rx_requests,
    lastImported: row.last_imported,
  }));
}

export async function getAgentPerformance(
  dateRange?: string
): Promise<AgentPerformanceDetail[]> {
  let query = supabase
    .from('concierge_weekly_metrics')
    .select('agent_name, metric_type, metric_value, date_range')
    .order('agent_name');

  if (dateRange) {
    query = query.eq('date_range', dateRange);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch agent performance:', error);
    return [];
  }

  const agentMap = new Map<string, any>();

  (data || []).forEach((row) => {
    if (!agentMap.has(row.agent_name)) {
      agentMap.set(row.agent_name, {
        agentName: row.agent_name,
        weeklyStats: {
          membersAttended: 0,
          phoneHours: 0,
          crmTasks: 0,
          rxRequests: 0,
          imagingRequests: 0,
          labRequests: 0,
          apptRequests: 0,
        },
      });
    }

    const agent = agentMap.get(row.agent_name);
    const value = Number(row.metric_value) || 0;

    switch (row.metric_type) {
      case 'Members attended to':
        agent.weeklyStats.membersAttended = value;
        break;
      case 'Phone Time':
        agent.weeklyStats.phoneHours = value;
        break;
      case 'CRM Tasks':
        agent.weeklyStats.crmTasks = value;
        break;
      case 'RX Requests':
        agent.weeklyStats.rxRequests = value;
        break;
      case 'Imaging Requests':
        agent.weeklyStats.imagingRequests = value;
        break;
      case 'Lab Requests':
        agent.weeklyStats.labRequests = value;
        break;
      case 'Appt Requests':
        agent.weeklyStats.apptRequests = value;
        break;
    }
  });

  const agents = Array.from(agentMap.values());

  agents.forEach((agent) => {
    let score = 50;

    if (agent.weeklyStats.membersAttended >= 100) score += 20;
    else if (agent.weeklyStats.membersAttended >= 75) score += 15;
    else if (agent.weeklyStats.membersAttended >= 50) score += 10;

    if (agent.weeklyStats.phoneHours > 0 && agent.weeklyStats.membersAttended > 0) {
      const minutesPerMember =
        (agent.weeklyStats.phoneHours * 60) / agent.weeklyStats.membersAttended;
      if (minutesPerMember >= 3 && minutesPerMember <= 8) score += 15;
      else if (minutesPerMember >= 2 && minutesPerMember <= 10) score += 10;
    }

    if (agent.weeklyStats.crmTasks >= 30) score += 15;
    else if (agent.weeklyStats.crmTasks >= 20) score += 10;
    else if (agent.weeklyStats.crmTasks >= 10) score += 5;

    agent.performanceScore = Math.min(100, score);
  });

  agents.sort((a, b) => b.performanceScore - a.performanceScore);
  agents.forEach((agent, idx) => {
    agent.rank = idx + 1;
  });

  return agents;
}

export async function getDailyInteractionsSummary(
  limit: number = 30
): Promise<DailyInteractionMetrics[]> {
  const { data, error } = await supabase
    .from('concierge_daily_summary')
    .select('*')
    .order('interaction_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch daily interactions summary:', error);
    return [];
  }

  return (data || []).map((row) => ({
    date: row.interaction_date,
    totalInteractions: row.total_interactions || 0,
    uniqueMembers: row.unique_members || 0,
    noCallDays: row.no_call_days || 0,
    highPriority: row.high_priority || 0,
    mediumPriority: row.medium_priority || 0,
    lowPriority: row.low_priority || 0,
    topIssueCategories: row.issue_categories || [],
  }));
}

export async function getAfterHoursSummary(
  limit: number = 30
): Promise<AfterHoursMetrics[]> {
  const { data, error } = await supabase
    .from('concierge_after_hours_summary')
    .select('*')
    .order('call_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch after hours summary:', error);
    return [];
  }

  return (data || []).map((row) => ({
    date: row.call_date,
    totalCalls: row.total_calls || 0,
    weekendCalls: row.weekend_calls || 0,
    lateNightCalls: row.late_night_calls || 0,
    avgUrgency: row.avg_urgency || 0,
    uniqueCallers: row.unique_callers || 0,
    peakHours: row.call_hours || [],
  }));
}

export async function getIssueCategoryBreakdown(
  dateFrom?: string,
  dateTo?: string
): Promise<IssueCategoryBreakdown[]> {
  let query = supabase
    .from('concierge_daily_interactions')
    .select('issue_category, priority_level, interaction_date')
    .not('is_no_calls_day', 'eq', true);

  if (dateFrom) {
    query = query.gte('interaction_date', dateFrom);
  }

  if (dateTo) {
    query = query.lte('interaction_date', dateTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch issue categories:', error);
    return [];
  }

  const categoryMap = new Map<
    string,
    { count: number; totalPriority: number; dates: string[] }
  >();

  (data || []).forEach((row) => {
    const category = row.issue_category || 'other';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { count: 0, totalPriority: 0, dates: [] });
    }
    const stats = categoryMap.get(category)!;
    stats.count++;
    stats.totalPriority += row.priority_level || 3;
    stats.dates.push(row.interaction_date);
  });

  const breakdown: IssueCategoryBreakdown[] = [];

  categoryMap.forEach((stats, category) => {
    const sortedDates = stats.dates.sort();
    const midpoint = Math.floor(sortedDates.length / 2);
    const firstHalf = sortedDates.slice(0, midpoint).length;
    const secondHalf = sortedDates.length - midpoint;

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (secondHalf > firstHalf * 1.2) trend = 'increasing';
    else if (secondHalf < firstHalf * 0.8) trend = 'decreasing';

    breakdown.push({
      category,
      count: stats.count,
      avgPriority: stats.totalPriority / stats.count,
      trend,
    });
  });

  breakdown.sort((a, b) => b.count - a.count);

  return breakdown;
}

export async function getConciergeOverview(): Promise<ConciergeOverviewMetrics> {
  const weeklySummaries = await getWeeklySummary(2);
  const dailySummaries = await getDailyInteractionsSummary(7);
  const afterHoursSummaries = await getAfterHoursSummary(30);

  const currentWeek = weeklySummaries[0] || null;
  const previousWeek = weeklySummaries[1] || null;

  const changePercent = {
    members: 0,
    phoneHours: 0,
    tasks: 0,
  };

  if (currentWeek && previousWeek) {
    changePercent.members =
      previousWeek.totalMembers > 0
        ? ((currentWeek.totalMembers - previousWeek.totalMembers) /
            previousWeek.totalMembers) *
          100
        : 0;
    changePercent.phoneHours =
      previousWeek.avgPhoneHours > 0
        ? ((currentWeek.avgPhoneHours - previousWeek.avgPhoneHours) /
            previousWeek.avgPhoneHours) *
          100
        : 0;
    changePercent.tasks =
      previousWeek.totalTasks > 0
        ? ((currentWeek.totalTasks - previousWeek.totalTasks) / previousWeek.totalTasks) * 100
        : 0;
  }

  const totalInteractionsLast7Days = dailySummaries.reduce(
    (sum, day) => sum + day.totalInteractions,
    0
  );
  const avgInteractionsPerDay =
    dailySummaries.length > 0 ? totalInteractionsLast7Days / dailySummaries.length : 0;

  const issueCategories = new Map<string, number>();
  dailySummaries.forEach((day) => {
    day.topIssueCategories.forEach((category) => {
      issueCategories.set(category, (issueCategories.get(category) || 0) + 1);
    });
  });

  let topIssue = 'None';
  let maxCount = 0;
  issueCategories.forEach((count, category) => {
    if (count > maxCount) {
      maxCount = count;
      topIssue = category;
    }
  });

  const totalAfterHoursCalls = afterHoursSummaries.reduce(
    (sum, day) => sum + day.totalCalls,
    0
  );
  const avgUrgency =
    afterHoursSummaries.length > 0
      ? afterHoursSummaries.reduce((sum, day) => sum + day.avgUrgency, 0) /
        afterHoursSummaries.length
      : 0;

  const hourCounts = new Map<number, number>();
  afterHoursSummaries.forEach((day) => {
    day.peakHours.forEach((hour) => {
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + day.totalCalls);
    });
  });

  let peakHour = 20;
  let maxHourCount = 0;
  hourCounts.forEach((count, hour) => {
    if (count > maxHourCount) {
      maxHourCount = count;
      peakHour = hour;
    }
  });

  return {
    weeklyMetrics: {
      currentWeek,
      previousWeek,
      changePercent,
    },
    dailyMetrics: {
      last7Days: totalInteractionsLast7Days,
      avgInteractionsPerDay: Math.round(avgInteractionsPerDay),
      topIssue,
    },
    afterHoursMetrics: {
      last30Days: totalAfterHoursCalls,
      avgUrgency: Math.round(avgUrgency * 10) / 10,
      peakHour,
    },
  };
}
