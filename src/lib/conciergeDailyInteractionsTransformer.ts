export interface ConciergeDailyInteractionsCSVRow {
  [key: string]: string | number;
}

export interface TransformedDailyInteraction {
  interaction_date: string;
  member_name: string;
  issue_description: string;
  notes?: string;
}

export interface DailyInteractionsSummary {
  totalInteractions: number;
  totalDays: number;
  noCallsDays: number;
  issueCategories: Record<string, number>;
  topIssues: Array<{ issue: string; count: number }>;
}

const ISSUE_KEYWORDS: Record<string, string[]> = {
  'telemedicine': ['telemedicine', 'telemedecine', 'telehealth'],
  'medication': ['medication', 'medicine', 'drug'],
  'rx assistance': ['rx assistance', 'rx assisance', 'prescription help'],
  'rx update': ['rx update', 'prescription update'],
  'price increase question': ['price increase', 'cost increase'],
  'plan questions': ['plan question', 'plan info'],
  'renewal question': ['renewal', 'renew'],
  'cancelling': ['cancel', 'cancelling', 'cancellation'],
  'app login issues': ['app login', 'login issue', 'cant login', 'cannot login'],
  'health wallet': ['health wallet', 'healthwallet', 'hw'],
  'card': ['card', 'id card', 'member card'],
  'provider look ups': ['provider lookup', 'provider look up', 'find provider'],
  'sharing request': ['sharing request', 'share request'],
  'preventive': ['preventive', 'prevention'],
  'lab bill': ['lab bill', 'lab billing'],
  'billing': ['billing', 'bill', 'invoice'],
  'er visit': ['er visit', 'emergency room', 'er vist'],
  'genetic testing': ['genetic test', 'dna test'],
  'fullscripts': ['fullscripts', 'full scripts'],
  'bill submission': ['bill submission', 'submit bill', 'bill sumbition'],
  'mental health': ['mental health', 'therapy', 'counseling'],
  'zion issues': ['zion issue', 'zion'],
  'phcs': ['phcs'],
};

export function parseInteractionDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;

  const mmddyyMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/);
  if (mmddyyMatch) {
    const [, month, day, year] = mmddyyMatch;
    return `${month.padStart(2, '0')}.${day.padStart(2, '0')}.${year}`;
  }

  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    const shortYear = year.substring(2);
    return `${month.padStart(2, '0')}.${day.padStart(2, '0')}.${shortYear}`;
  }

  return null;
}

export function isDateRow(firstColumn: string): boolean {
  return /\d{1,2}\.\d{1,2}\.\d{2}/.test(firstColumn);
}

export function isNoCallsRow(memberName: string): boolean {
  if (!memberName) return false;
  const normalized = memberName.toLowerCase().trim();
  return normalized === 'no calls' || normalized === 'no call';
}

export function categorizeIssue(issueDescription: string): string {
  if (!issueDescription || issueDescription.trim() === '') return 'other';

  const normalized = issueDescription.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(ISSUE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return category;
      }
    }
  }

  return 'other';
}

export function extractMemberName(memberName: string): string {
  if (!memberName) return '';

  let cleaned = memberName.trim();

  cleaned = cleaned.replace(/\s*x\s*\d+\s*$/i, '');

  cleaned = cleaned.replace(/\s*\([^)]*\)\s*$/g, '');

  cleaned = cleaned.replace(/\s*-\s*Zoho\s*CRM\s*$/i, '');

  cleaned = cleaned.trim();

  return cleaned;
}

export function detectIssueUrgency(issueDescription: string): 'low' | 'medium' | 'high' {
  if (!issueDescription) return 'medium';

  const normalized = issueDescription.toLowerCase();

  const highUrgencyKeywords = ['cancel', 'er', 'emergency', 'urgent', 'critical', 'down', 'not working'];
  if (highUrgencyKeywords.some(kw => normalized.includes(kw))) {
    return 'high';
  }

  const lowUrgencyKeywords = ['card', 'id card', 'lookup', 'look up', 'question'];
  if (lowUrgencyKeywords.some(kw => normalized.includes(kw))) {
    return 'low';
  }

  return 'medium';
}

export function transformDailyInteractionsRow(
  row: ConciergeDailyInteractionsCSVRow,
  currentDate: string | null
): TransformedDailyInteraction | null {
  const columns = Object.keys(row);
  if (columns.length === 0) return null;

  const firstColumn = columns[0];
  const firstValue = String(row[firstColumn] || '').trim();

  if (!firstValue || firstValue === '') return null;

  if (isDateRow(firstValue)) return null;

  if (!currentDate) return null;

  const memberName = extractMemberName(firstValue);
  const issueDescription = columns[1] ? String(row[columns[1]] || '').trim() : '';
  const notes = columns[2] ? String(row[columns[2]] || '').trim() : undefined;

  if (isNoCallsRow(memberName)) {
    return {
      interaction_date: currentDate,
      member_name: 'NO CALLS',
      issue_description: '',
      notes: undefined,
    };
  }

  if (memberName === '' || memberName.toLowerCase() === 'advisor') {
    return null;
  }

  return {
    interaction_date: currentDate,
    member_name: memberName,
    issue_description: issueDescription,
    notes: notes && notes !== '' ? notes : undefined,
  };
}

export function transformDailyInteractionsFile(
  data: ConciergeDailyInteractionsCSVRow[]
): TransformedDailyInteraction[] {
  const results: TransformedDailyInteraction[] = [];
  let currentDate: string | null = null;

  for (const row of data) {
    const columns = Object.keys(row);
    if (columns.length === 0) continue;

    const firstColumn = columns[0];
    const firstValue = String(row[firstColumn] || '').trim();

    if (isDateRow(firstValue)) {
      const parsed = parseInteractionDate(firstValue);
      if (parsed) {
        currentDate = parsed;
      }
      continue;
    }

    if (currentDate) {
      const transformed = transformDailyInteractionsRow(row, currentDate);
      if (transformed) {
        results.push(transformed);
      }
    }
  }

  return results;
}

export function validateDailyInteraction(
  interaction: TransformedDailyInteraction
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!interaction.interaction_date || interaction.interaction_date === '') {
    errors.push('Interaction date is required');
  }

  if (!interaction.member_name || interaction.member_name === '') {
    errors.push('Member name is required');
  }

  const dateValid = parseInteractionDate(interaction.interaction_date);
  if (!dateValid) {
    errors.push(`Invalid date format: ${interaction.interaction_date}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getDailyInteractionsSummary(data: TransformedDailyInteraction[]): DailyInteractionsSummary {
  const uniqueDates = new Set<string>();
  const issueCategories: Record<string, number> = {};
  let noCallsDays = 0;

  data.forEach(interaction => {
    uniqueDates.add(interaction.interaction_date);

    if (interaction.member_name === 'NO CALLS') {
      noCallsDays++;
      return;
    }

    const category = categorizeIssue(interaction.issue_description);
    issueCategories[category] = (issueCategories[category] || 0) + 1;
  });

  const topIssues = Object.entries(issueCategories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([issue, count]) => ({ issue, count }));

  return {
    totalInteractions: data.length - noCallsDays,
    totalDays: uniqueDates.size,
    noCallsDays,
    issueCategories,
    topIssues,
  };
}

export function calculateDailyVolume(data: TransformedDailyInteraction[]): Array<{ date: string; count: number }> {
  const volumeByDate: Record<string, number> = {};

  data.forEach(interaction => {
    if (interaction.member_name !== 'NO CALLS') {
      volumeByDate[interaction.interaction_date] = (volumeByDate[interaction.interaction_date] || 0) + 1;
    }
  });

  return Object.entries(volumeByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function identifyCommonIssues(
  data: TransformedDailyInteraction[],
  minOccurrences: number = 3
): Array<{ issue: string; category: string; count: number; urgency: string }> {
  const issueTracker: Record<string, { category: string; count: number; urgencies: string[] }> = {};

  data.forEach(interaction => {
    if (interaction.member_name === 'NO CALLS' || !interaction.issue_description) return;

    const category = categorizeIssue(interaction.issue_description);
    const urgency = detectIssueUrgency(interaction.issue_description);

    if (!issueTracker[category]) {
      issueTracker[category] = { category, count: 0, urgencies: [] };
    }

    issueTracker[category].count++;
    issueTracker[category].urgencies.push(urgency);
  });

  const results = Object.entries(issueTracker)
    .filter(([, data]) => data.count >= minOccurrences)
    .map(([issue, data]) => {
      const avgUrgency =
        data.urgencies.filter(u => u === 'high').length > data.urgencies.length / 2
          ? 'high'
          : data.urgencies.filter(u => u === 'low').length > data.urgencies.length / 2
          ? 'low'
          : 'medium';

      return {
        issue,
        category: data.category,
        count: data.count,
        urgency: avgUrgency,
      };
    })
    .sort((a, b) => b.count - a.count);

  return results;
}

export function analyzeTrendsByCategory(
  data: TransformedDailyInteraction[]
): Record<string, { total: number; avgPerDay: number; trend: 'increasing' | 'stable' | 'decreasing' }> {
  const uniqueDates = Array.from(new Set(data.map(d => d.interaction_date))).sort();

  if (uniqueDates.length < 2) {
    const categoryTotals: Record<string, number> = {};
    data.forEach(interaction => {
      if (interaction.member_name !== 'NO CALLS') {
        const category = categorizeIssue(interaction.issue_description);
        categoryTotals[category] = (categoryTotals[category] || 0) + 1;
      }
    });

    return Object.fromEntries(
      Object.entries(categoryTotals).map(([cat, total]) => [
        cat,
        { total, avgPerDay: total / (uniqueDates.length || 1), trend: 'stable' as const },
      ])
    );
  }

  const midpoint = Math.floor(uniqueDates.length / 2);
  const firstHalf = uniqueDates.slice(0, midpoint);
  const secondHalf = uniqueDates.slice(midpoint);

  const firstHalfCounts: Record<string, number> = {};
  const secondHalfCounts: Record<string, number> = {};

  data.forEach(interaction => {
    if (interaction.member_name === 'NO CALLS') return;

    const category = categorizeIssue(interaction.issue_description);

    if (firstHalf.includes(interaction.interaction_date)) {
      firstHalfCounts[category] = (firstHalfCounts[category] || 0) + 1;
    } else if (secondHalf.includes(interaction.interaction_date)) {
      secondHalfCounts[category] = (secondHalfCounts[category] || 0) + 1;
    }
  });

  const allCategories = new Set([...Object.keys(firstHalfCounts), ...Object.keys(secondHalfCounts)]);

  const results: Record<
    string,
    { total: number; avgPerDay: number; trend: 'increasing' | 'stable' | 'decreasing' }
  > = {};

  allCategories.forEach(category => {
    const firstAvg = (firstHalfCounts[category] || 0) / firstHalf.length;
    const secondAvg = (secondHalfCounts[category] || 0) / secondHalf.length;
    const total = (firstHalfCounts[category] || 0) + (secondHalfCounts[category] || 0);

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    const change = secondAvg - firstAvg;

    if (change > 0.5) trend = 'increasing';
    else if (change < -0.5) trend = 'decreasing';

    results[category] = {
      total,
      avgPerDay: total / uniqueDates.length,
      trend,
    };
  });

  return results;
}
