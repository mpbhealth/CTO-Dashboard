import type {
  ExecutiveKPIs,
  ConciergeMetrics,
  SalesMetrics,
  OperationsMetrics,
  FinanceMetrics,
  ComplianceMetrics,
} from './types';

export const mockExecutiveKPIs: ExecutiveKPIs = {
  mrr: {
    current: 847000,
    previous: 754000,
    change: 12.3,
  },
  newMembers: {
    current: 234,
    previous: 217,
    change: 7.8,
  },
  churn: {
    current: 2.1,
    previous: 2.4,
    change: -12.5,
  },
  claimsPaid: {
    current: 1247,
    previous: 1189,
    change: 4.9,
  },
};

export const mockConciergeMetrics: ConciergeMetrics = {
  ticketsToday: 47,
  slaMetPercent: 94.2,
  avgFirstReplyTime: 8.5,
  recentNotes: [
    {
      id: '1',
      member: 'John Smith',
      note: 'Helped with prescription transfer, member very satisfied',
      timestamp: '2025-10-27T14:30:00Z',
      agent: 'Sarah Johnson',
    },
    {
      id: '2',
      member: 'Mary Williams',
      note: 'Resolved billing inquiry, updated payment method',
      timestamp: '2025-10-27T13:15:00Z',
      agent: 'Michael Chen',
    },
    {
      id: '3',
      member: 'Robert Davis',
      note: 'Scheduled follow-up call for coverage questions',
      timestamp: '2025-10-27T12:00:00Z',
      agent: 'Emily Rodriguez',
    },
  ],
};

export const mockSalesMetrics: SalesMetrics = {
  newMembersThisMonth: 234,
  pipeline: [
    { stage: 'Leads', count: 450, value: 562500 },
    { stage: 'Prospects', count: 180, value: 225000 },
    { stage: 'Quotes', count: 85, value: 106250 },
    { stage: 'Closed', count: 52, value: 65000 },
  ],
  topAdvisors: [
    {
      name: 'Sarah Johnson',
      enrollments: 28,
      revenue: 124500,
      closeRate: 68.2,
    },
    {
      name: 'Michael Chen',
      enrollments: 26,
      revenue: 118200,
      closeRate: 65.8,
    },
    {
      name: 'Emily Rodriguez',
      enrollments: 25,
      revenue: 112800,
      closeRate: 64.1,
    },
  ],
  closeRate: 66.7,
};

export const mockOperationsMetrics: OperationsMetrics = {
  openByQueue: [
    { queue: 'General Support', count: 23, avgAge: 4.2 },
    { queue: 'Billing', count: 18, avgAge: 6.5 },
    { queue: 'Technical', count: 12, avgAge: 8.1 },
    { queue: 'Escalations', count: 5, avgAge: 24.3 },
  ],
  agingOver48h: 8,
  escalations: 5,
  avgResolutionTime: 16.7,
};

export const mockFinanceMetrics: FinanceMetrics = {
  accountsReceivable: 342000,
  accountsPayable: 178000,
  payoutsThisMonth: 487250,
  trendData: [
    { date: '2025-07-01', revenue: 385000, expenses: 245000 },
    { date: '2025-08-01', revenue: 412000, expenses: 258000 },
    { date: '2025-09-01', revenue: 434200, expenses: 267000 },
    { date: '2025-10-01', revenue: 487250, expenses: 289000 },
  ],
};

export const mockComplianceMetrics: ComplianceMetrics = {
  hipaaAuditCount: 3,
  unresolvedFindings: 2,
  lastBackupVerification: '2025-10-26T08:00:00Z',
  nextAuditDate: '2025-11-15T00:00:00Z',
  complianceScore: 96.5,
};
