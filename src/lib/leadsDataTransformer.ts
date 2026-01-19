export interface LeadsReportRow {
  Date?: string;
  date?: string;
  Name?: string;
  name?: string;
  Source?: string;
  source?: string;
  Status?: string;
  status?: string;
  'Lead Owner'?: string;
  'lead owner'?: string;
  lead_owner?: string;
  'Group Lead?'?: string;
  'group lead?'?: string;
  group_lead?: string;
  'Recent Notes'?: string;
  'recent notes'?: string;
  recent_notes?: string;
}

export interface TransformedLeadRow {
  lead_date: string;
  lead_name: string;
  lead_source: string;
  lead_status: string;
  lead_owner: string;
  is_group_lead: boolean;
  recent_notes: string;
}

export function transformLeadsRow(row: LeadsReportRow): TransformedLeadRow | null {
  const date = row.Date || row.date || '';
  const name = row.Name || row.name || '';
  const source = row.Source || row.source || '';
  const status = row.Status || row.status || '';
  const leadOwner = row['Lead Owner'] || row['lead owner'] || row.lead_owner || '';
  const groupLead = row['Group Lead?'] || row['group lead?'] || row.group_lead || '';
  const notes = row['Recent Notes'] || row['recent notes'] || row.recent_notes || '';

  if (!name || name.trim() === '') {
    return null;
  }

  const isGroupLead = parseBoolean(groupLead);

  return {
    lead_date: date.trim(),
    lead_name: name.trim(),
    lead_source: source.trim() || 'Unknown',
    lead_status: status.trim() || 'Not Contacted',
    lead_owner: leadOwner.trim() || 'Unassigned',
    is_group_lead: isGroupLead,
    recent_notes: notes.trim(),
  };
}

export function validateLeadsRow(row: TransformedLeadRow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!row.lead_name || row.lead_name === '') {
    errors.push('Name is required');
  }

  if (!row.lead_date || row.lead_date === '') {
    errors.push('Date is required');
  }

  if (!row.lead_source || row.lead_source === 'Unknown') {
    errors.push('Source is required');
  }

  if (!row.lead_owner || row.lead_owner === 'Unassigned') {
    errors.push('Lead Owner is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseBoolean(value: string): boolean {
  if (!value) return false;
  const normalized = value.toString().toLowerCase().trim();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

export function normalizeLeadSource(source: string): string {
  const normalized = source.toLowerCase().trim();

  const sourceMap: Record<string, string> = {
    'website visit': 'Website Visit',
    'website': 'Website Visit',
    'web': 'Website Visit',
    'word of mouth': 'Word Of Mouth',
    'referral': 'Referall',
    'referall': 'Referall',
    'friend referral': 'Friend Referral',
    'former member': 'Former Member',
    'previous member': 'Previous Member',
    'articles': 'Articles',
    'article': 'Articles',
    'social media': 'Social Media',
    'social': 'Social Media',
    'facebook': 'Social Media',
    'linkedin': 'Social Media',
    'n/a': 'N/A',
    'na': 'N/A',
  };

  return sourceMap[normalized] || source;
}

export function normalizeLeadStatus(status: string): string {
  const normalized = status.toLowerCase().trim();

  const statusMap: Record<string, string> = {
    'in process': 'In process',
    'in-process': 'In process',
    'first attempt': 'First Attempt',
    'first-attempt': 'First Attempt',
    'closed': 'Closed',
    'n/a': 'N/A',
    'na': 'N/A',
    'not contacted': 'Not contacted',
  };

  return statusMap[normalized] || status;
}

export function extractLeadInsights(notes: string): {
  hasVoicemail: boolean;
  hasAppointment: boolean;
  hasQuote: boolean;
  isForwarded: boolean;
  forwardedTo?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
} {
  const hasVoicemail = /left vm|voicemail|left message/i.test(notes);
  const hasAppointment = /scheduled|appointment|call scheduled/i.test(notes);
  const hasQuote = /quote|quoted|presented/i.test(notes);
  const isForwarded = /forward|fwd/i.test(notes);

  let forwardedTo: string | undefined;
  if (isForwarded) {
    const forwardMatch = notes.match(/forward(?:ed)? (?:to|lead to) ([A-Za-z ]+)/i);
    if (forwardMatch) {
      forwardedTo = forwardMatch[1].trim();
    }
  }

  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (/great|good|interested|ready|signed/i.test(notes)) {
    sentiment = 'positive';
  } else if (/declined|not interested|cancelled|unhappy/i.test(notes)) {
    sentiment = 'negative';
  }

  return {
    hasVoicemail,
    hasAppointment,
    hasQuote,
    isForwarded,
    forwardedTo,
    sentiment,
  };
}

export function calculateLeadScore(row: TransformedLeadRow): number {
  let score = 50;

  if (row.lead_status === 'Closed') score = 100;
  else if (row.lead_status === 'In process') score += 30;
  else if (row.lead_status === 'First Attempt') score += 10;

  const sourceEffectiveness: Record<string, number> = {
    'Friend Referral': 20,
    'Word Of Mouth': 15,
    'Referall': 15,
    'Former Member': 10,
    'Previous Member': 10,
    'Website Visit': 5,
    'Social Media': 5,
    'Articles': 5,
  };
  score += sourceEffectiveness[row.lead_source] || 0;

  if (row.is_group_lead) score += 15;

  const insights = extractLeadInsights(row.recent_notes);
  if (insights.hasAppointment) score += 20;
  if (insights.hasQuote) score += 15;
  if (insights.sentiment === 'positive') score += 10;
  if (insights.sentiment === 'negative') score -= 20;

  return Math.max(0, Math.min(100, score));
}
