export interface ConciergeWeeklyMetricsCSVRow {
  [key: string]: string | number;
}

export interface TransformedWeeklyMetric {
  week_start_date: string;
  week_end_date: string;
  date_range: string;
  agent_name: string;
  metric_type: string;
  metric_value: string;
  notes?: string;
}

export interface WeeklyMetricsSummary {
  totalWeeks: number;
  agents: string[];
  metrics: string[];
  totalMembers: number;
  totalPhoneHours: number;
  totalTasks: number;
}

const METRIC_TYPES = [
  'Members attended to',
  'Phone Time',
  'CRM Tasks',
  'Incomplete/Next Week Tasks',
  'RX Requests',
  'Imaging Requests',
  'Lab Requests',
  'Appt Requests',
];

export function parseDateRange(dateRange: string): { start: string; end: string } | null {
  if (!dateRange || dateRange.trim() === '') return null;

  const match = dateRange.match(/(\d{1,2})\.(\d{1,2})\.(\d{2})-(\d{1,2})\.(\d{1,2})\.(\d{2})/);
  if (match) {
    const [, startMonth, startDay, startYear, endMonth, endDay, endYear] = match;
    return {
      start: `${startMonth.padStart(2, '0')}.${startDay.padStart(2, '0')}.${startYear}`,
      end: `${endMonth.padStart(2, '0')}.${endDay.padStart(2, '0')}.${endYear}`,
    };
  }

  return null;
}

export function parsePhoneTime(timeStr: string): number {
  if (!timeStr || timeStr.trim() === '') return 0;

  const hourMinMatch = timeStr.match(/(\d+):(\d+)\s*hours?/i);
  if (hourMinMatch) {
    const hours = parseInt(hourMinMatch[1], 10);
    const minutes = parseInt(hourMinMatch[2], 10);
    return hours + minutes / 60;
  }

  const decimalMatch = timeStr.match(/(\d+\.?\d*)\s*hours?/i);
  if (decimalMatch) {
    return parseFloat(decimalMatch[1]);
  }

  const minutesMatch = timeStr.match(/(\d+)\s*minutes?/i);
  if (minutesMatch) {
    return parseInt(minutesMatch[1], 10) / 60;
  }

  return 0;
}

export function parseIncompleteTasksFormat(value: string): { incomplete: number; nextWeek: number } {
  if (!value || value.trim() === '') return { incomplete: 0, nextWeek: 0 };

  const match = value.match(/(\d+)\s*\|\s*(\d+)/);
  if (match) {
    return {
      incomplete: parseInt(match[1], 10),
      nextWeek: parseInt(match[2], 10),
    };
  }

  const singleNum = value.match(/(\d+)/);
  if (singleNum) {
    return {
      incomplete: parseInt(singleNum[1], 10),
      nextWeek: 0,
    };
  }

  return { incomplete: 0, nextWeek: 0 };
}

export function isAgentColumn(columnName: string): boolean {
  const agentNames = ['Ace', 'Adam', 'Angee', 'Tupac', 'Leo', 'Julia'];
  return agentNames.some(name => columnName.toLowerCase().includes(name.toLowerCase()));
}

export function extractAgentName(columnName: string): string | null {
  const agentNames = ['Ace', 'Adam', 'Angee', 'Tupac', 'Leo', 'Julia'];
  for (const name of agentNames) {
    if (columnName.toLowerCase().includes(name.toLowerCase())) {
      return name;
    }
  }
  return null;
}

export function isMetricRow(firstColumn: string): boolean {
  return METRIC_TYPES.some(metric => firstColumn.toLowerCase().includes(metric.toLowerCase()));
}

export function isDateRangeRow(firstColumn: string): boolean {
  return /\d{1,2}\.\d{1,2}\.\d{2}-\d{1,2}\.\d{1,2}\.\d{2}/.test(firstColumn);
}

export function transformWeeklyMetricsRow(
  row: ConciergeWeeklyMetricsCSVRow,
  currentDateRange: string | null
): TransformedWeeklyMetric[] {
  const results: TransformedWeeklyMetric[] = [];

  const columns = Object.keys(row);
  const firstColumn = columns[0];
  const firstValue = String(row[firstColumn] || '').trim();

  if (!firstValue || firstValue === '') {
    return results;
  }

  if (isDateRangeRow(firstValue)) {
    return results;
  }

  if (!isMetricRow(firstValue)) {
    return results;
  }

  const metricType = firstValue;
  const dateInfo = parseDateRange(currentDateRange || '');

  if (!dateInfo) {
    return results;
  }

  let notesColumn: string | null = null;
  columns.forEach((col, idx) => {
    if (col.toLowerCase().includes('unnamed') && idx > 3) {
      notesColumn = col;
    }
  });

  columns.forEach((column, idx) => {
    if (idx === 0) return;

    if (column === notesColumn) return;

    const agentName = extractAgentName(column);
    if (!agentName) return;

    const value = String(row[column] || '').trim();

    if (value === '' || value.toLowerCase() === 'n/a' || value === '?') {
      return;
    }

    const notes = notesColumn ? String(row[notesColumn] || '').trim() : undefined;

    results.push({
      week_start_date: dateInfo.start,
      week_end_date: dateInfo.end,
      date_range: currentDateRange || '',
      agent_name: agentName,
      metric_type: metricType,
      metric_value: value,
      notes: notes && notes !== '' ? notes : undefined,
    });
  });

  return results;
}

export function transformWeeklyMetricsFile(
  data: ConciergeWeeklyMetricsCSVRow[]
): TransformedWeeklyMetric[] {
  const results: TransformedWeeklyMetric[] = [];
  let currentDateRange: string | null = null;

  for (const row of data) {
    const columns = Object.keys(row);
    if (columns.length === 0) continue;

    const firstColumn = columns[0];
    const firstValue = String(row[firstColumn] || '').trim();

    if (isDateRangeRow(firstValue)) {
      currentDateRange = firstValue;
      continue;
    }

    if (currentDateRange) {
      const transformed = transformWeeklyMetricsRow(row, currentDateRange);
      results.push(...transformed);
    }
  }

  return results;
}

export function validateWeeklyMetric(metric: TransformedWeeklyMetric): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!metric.date_range || metric.date_range === '') {
    errors.push('Date range is required');
  }

  if (!metric.agent_name || metric.agent_name === '') {
    errors.push('Agent name is required');
  }

  if (!metric.metric_type || metric.metric_type === '') {
    errors.push('Metric type is required');
  }

  if (!metric.metric_value || metric.metric_value === '') {
    errors.push('Metric value is required');
  }

  const dateInfo = parseDateRange(metric.date_range);
  if (!dateInfo) {
    errors.push(`Invalid date range format: ${metric.date_range}`);
  }

  if (metric.metric_type === 'Phone Time') {
    const hours = parsePhoneTime(metric.metric_value);
    if (hours < 0 || hours > 168) {
      errors.push(`Phone time hours out of valid range: ${metric.metric_value}`);
    }
  }

  if (metric.metric_type === 'Members attended to') {
    const count = parseInt(metric.metric_value.replace(/[^0-9]/g, ''), 10);
    if (isNaN(count) || count < 0 || count > 1000) {
      errors.push(`Invalid member count: ${metric.metric_value}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getWeeklyMetricsSummary(data: TransformedWeeklyMetric[]): WeeklyMetricsSummary {
  const uniqueWeeks = new Set<string>();
  const uniqueAgents = new Set<string>();
  const uniqueMetrics = new Set<string>();
  let totalMembers = 0;
  let totalPhoneHours = 0;
  let totalTasks = 0;

  data.forEach(metric => {
    uniqueWeeks.add(metric.date_range);
    uniqueAgents.add(metric.agent_name);
    uniqueMetrics.add(metric.metric_type);

    if (metric.metric_type === 'Members attended to') {
      const count = parseInt(metric.metric_value.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(count)) {
        totalMembers += count;
      }
    }

    if (metric.metric_type === 'Phone Time') {
      totalPhoneHours += parsePhoneTime(metric.metric_value);
    }

    if (metric.metric_type === 'CRM Tasks') {
      const count = parseInt(metric.metric_value.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(count)) {
        totalTasks += count;
      }
    }
  });

  return {
    totalWeeks: uniqueWeeks.size,
    agents: Array.from(uniqueAgents).sort(),
    metrics: Array.from(uniqueMetrics).sort(),
    totalMembers,
    totalPhoneHours: Math.round(totalPhoneHours * 10) / 10,
    totalTasks,
  };
}

export function calculateAgentPerformanceScore(metrics: TransformedWeeklyMetric[], agentName: string): number {
  const agentMetrics = metrics.filter(m => m.agent_name === agentName);

  let score = 50;

  const membersMetric = agentMetrics.find(m => m.metric_type === 'Members attended to');
  if (membersMetric) {
    const count = parseInt(membersMetric.metric_value.replace(/[^0-9]/g, ''), 10);
    if (count >= 100) score += 20;
    else if (count >= 75) score += 15;
    else if (count >= 50) score += 10;
  }

  const phoneTimeMetric = agentMetrics.find(m => m.metric_type === 'Phone Time');
  const membersCount = membersMetric ? parseInt(membersMetric.metric_value.replace(/[^0-9]/g, ''), 10) : 0;
  if (phoneTimeMetric && membersCount > 0) {
    const hours = parsePhoneTime(phoneTimeMetric.metric_value);
    const minutesPerMember = (hours * 60) / membersCount;
    if (minutesPerMember >= 3 && minutesPerMember <= 8) score += 15;
    else if (minutesPerMember >= 2 && minutesPerMember <= 10) score += 10;
    else if (minutesPerMember < 2) score += 5;
  }

  const tasksMetric = agentMetrics.find(m => m.metric_type === 'CRM Tasks');
  if (tasksMetric) {
    const count = parseInt(tasksMetric.metric_value.replace(/[^0-9]/g, ''), 10);
    if (count >= 30) score += 15;
    else if (count >= 20) score += 10;
    else if (count >= 10) score += 5;
  }

  return Math.min(100, score);
}

export function identifyTopPerformers(data: TransformedWeeklyMetric[]): Array<{ agent: string; score: number }> {
  const agents = Array.from(new Set(data.map(m => m.agent_name)));

  const scores = agents.map(agent => ({
    agent,
    score: calculateAgentPerformanceScore(data, agent),
  }));

  return scores.sort((a, b) => b.score - a.score);
}
