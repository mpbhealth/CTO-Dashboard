export interface CancelationReportRow {
  'Name:'?: string;
  Name?: string;
  name?: string;
  'Reason:'?: string;
  Reason?: string;
  reason?: string;
  'Membership:'?: string;
  Membership?: string;
  membership?: string;
  'Advisor:'?: string;
  Advisor?: string;
  advisor?: string;
  'Outcome:'?: string;
  Outcome?: string;
  outcome?: string;
}

export interface TransformedCancelationRow {
  member_name: string;
  cancelation_reason: string;
  membership_type: string;
  advisor_name: string;
  outcome_notes: string;
}

export function transformCancelationRow(row: CancelationReportRow): TransformedCancelationRow | null {
  const name = row['Name:'] || row.Name || row.name || '';
  const reason = row['Reason:'] || row.Reason || row.reason || '';
  const membership = row['Membership:'] || row.Membership || row.membership || '';
  const advisor = row['Advisor:'] || row.Advisor || row.advisor || '';
  const outcome = row['Outcome:'] || row.Outcome || row.outcome || '';

  if (!name || name.trim() === '') {
    return null;
  }

  return {
    member_name: name.trim(),
    cancelation_reason: reason.trim() || 'Other',
    membership_type: membership.trim() || 'N/A',
    advisor_name: advisor.trim() || 'N/A',
    outcome_notes: outcome.trim(),
  };
}

export function validateCancelationRow(row: TransformedCancelationRow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!row.member_name || row.member_name === '') {
    errors.push('Member name is required');
  }

  if (!row.cancelation_reason || row.cancelation_reason === 'Other') {
    errors.push('Cancelation reason is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function normalizeCancelationReason(reason: string): string {
  const normalized = reason.toLowerCase().trim();

  const reasonMap: Record<string, string> = {
    'aging into medicare': 'Aging into Medicare',
    'switching to employer-sponsored': 'Switching to employer-sponsored',
    'switching to employer-sponsored plan': 'Switching to employer-sponsored plan',
    'found more comprehensive coverage': 'Found more comprehensive coverage',
    'found more compehensive coverage': 'Found more compehensive coverage',
    'financial reasons': 'Financial Reasons',
    'dissatisfied with service': 'Dissatisfied with service',
    'other': 'Other',
  };

  return reasonMap[normalized] || reason;
}

export function normalizeMembershipType(membership: string): string {
  const normalized = membership.toLowerCase().trim();

  const membershipMap: Record<string, string> = {
    'secure hsa': 'Secure HSA',
    'premium hsa': 'Premium HSA',
    'premium care': 'Premium Care',
    'care plus': 'Care Plus',
    'mec+essentials': 'MEC+Essentials',
    'mec + eseentials': 'MEC+Essentials',
    'essentials': 'MEC+Essentials',
    'direct': 'Direct',
    'n/a': 'N/A',
  };

  return membershipMap[normalized] || membership;
}

export function analyzeOutcome(notes: string): {
  type: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  wasRetained: boolean;
  contactAttempted: boolean;
  reviewRequested: boolean;
} {
  const notesLower = notes.toLowerCase();

  let type = 'Other';
  if (/left vm|voicemail|left message/i.test(notes)) type = 'VM Left';
  else if (/retained|keeping|staying/i.test(notes)) type = 'Retained';
  else if (/great feedback|good experience|happy|satisfied|recommend/i.test(notes)) type = 'Positive Exit';
  else if (/unhappy|disappointed|frustrated|confused|trouble/i.test(notes)) type = 'Negative Exit';
  else if (/google review|review|testimonial/i.test(notes)) type = 'Review Requested';
  else if (/could not locate|not found|not in system/i.test(notes)) type = 'Data Error';
  else if (/denied|refused|will not/i.test(notes)) type = 'Request Denied';
  else if (/fwd|forward|forwarded/i.test(notes)) type = 'Forwarded';
  else if (!notes || notes.trim() === '') type = 'No Contact';

  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (/great|good|happy|satisfied|recommend|liked|comeback/i.test(notes)) {
    sentiment = 'positive';
  } else if (/unhappy|disappointed|frustrated|confused|trouble|denied/i.test(notes)) {
    sentiment = 'negative';
  }

  const wasRetained = /retained|keeping|staying/i.test(notes);
  const contactAttempted = notes && notes.trim() !== '';
  const reviewRequested = /google review|review|testimonial/i.test(notes);

  return {
    type,
    sentiment,
    wasRetained,
    contactAttempted,
    reviewRequested,
  };
}

export function categorizeCancelationReason(reason: string): {
  category: string;
  isPreventable: boolean;
  priorityLevel: number;
  retentionStrategy: string;
} {
  const normalized = reason.toLowerCase().trim();

  const categoryMap: Record<string, {
    category: string;
    isPreventable: boolean;
    priorityLevel: number;
    retentionStrategy: string;
  }> = {
    'aging into medicare': {
      category: 'Life Event',
      isPreventable: false,
      priorityLevel: 5,
      retentionStrategy: 'Offer Medicare supplement products',
    },
    'switching to employer-sponsored': {
      category: 'Competitive Loss',
      isPreventable: false,
      priorityLevel: 4,
      retentionStrategy: 'Exit interview for future reactivation',
    },
    'switching to employer-sponsored plan': {
      category: 'Competitive Loss',
      isPreventable: false,
      priorityLevel: 4,
      retentionStrategy: 'Exit interview for future reactivation',
    },
    'found more comprehensive coverage': {
      category: 'Competitive Loss',
      isPreventable: true,
      priorityLevel: 1,
      retentionStrategy: 'Review coverage gaps and pricing',
    },
    'found more compehensive coverage': {
      category: 'Competitive Loss',
      isPreventable: true,
      priorityLevel: 1,
      retentionStrategy: 'Review coverage gaps and pricing',
    },
    'financial reasons': {
      category: 'Price Sensitivity',
      isPreventable: true,
      priorityLevel: 2,
      retentionStrategy: 'Offer lower-tier plans or payment options',
    },
    'dissatisfied with service': {
      category: 'Service Issue',
      isPreventable: true,
      priorityLevel: 1,
      retentionStrategy: 'Immediate escalation and resolution',
    },
  };

  return categoryMap[normalized] || {
    category: 'Unknown',
    isPreventable: true,
    priorityLevel: 3,
    retentionStrategy: 'Conduct exit survey',
  };
}

export function calculateRetentionOpportunityScore(row: TransformedCancelationRow): number {
  const outcome = analyzeOutcome(row.outcome_notes);
  const reasonInfo = categorizeCancelationReason(row.cancelation_reason);

  let score = 50;

  if (outcome.wasRetained) return 100;

  if (reasonInfo.isPreventable) score += 20;
  else score -= 20;

  if (outcome.sentiment === 'positive') score += 20;
  else if (outcome.sentiment === 'negative') score -= 30;

  if (outcome.contactAttempted) score += 10;

  if (reasonInfo.priorityLevel === 1) score += 15;
  else if (reasonInfo.priorityLevel === 2) score += 10;
  else if (reasonInfo.priorityLevel === 5) score -= 20;

  if (outcome.reviewRequested) score += 5;

  return Math.max(0, Math.min(100, score));
}

export function identifyChurnRiskFactors(cancelations: TransformedCancelationRow[]): {
  highRiskMemberships: string[];
  topReasons: Array<{ reason: string; count: number }>;
  advisorPerformance: Array<{ advisor: string; retentionRate: number }>;
} {
  const membershipCounts: Record<string, number> = {};
  const reasonCounts: Record<string, number> = {};
  const advisorStats: Record<string, { total: number; retained: number }> = {};

  cancelations.forEach((row) => {
    if (row.membership_type && row.membership_type !== 'N/A') {
      membershipCounts[row.membership_type] = (membershipCounts[row.membership_type] || 0) + 1;
    }

    if (row.cancelation_reason) {
      reasonCounts[row.cancelation_reason] = (reasonCounts[row.cancelation_reason] || 0) + 1;
    }

    if (row.advisor_name && row.advisor_name !== 'N/A') {
      if (!advisorStats[row.advisor_name]) {
        advisorStats[row.advisor_name] = { total: 0, retained: 0 };
      }
      advisorStats[row.advisor_name].total += 1;

      const outcome = analyzeOutcome(row.outcome_notes);
      if (outcome.wasRetained) {
        advisorStats[row.advisor_name].retained += 1;
      }
    }
  });

  const highRiskMemberships = Object.entries(membershipCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([membership]) => membership);

  const topReasons = Object.entries(reasonCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  const advisorPerformance = Object.entries(advisorStats)
    .map(([advisor, stats]) => ({
      advisor,
      retentionRate: stats.total > 0 ? (stats.retained / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.retentionRate - a.retentionRate);

  return {
    highRiskMemberships,
    topReasons,
    advisorPerformance,
  };
}
