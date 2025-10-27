export interface ExecutiveKPIs {
  mrr: {
    current: number;
    previous: number;
    change: number;
  };
  newMembers: {
    current: number;
    previous: number;
    change: number;
  };
  churn: {
    current: number;
    previous: number;
    change: number;
  };
  claimsPaid: {
    current: number;
    previous: number;
    change: number;
  };
}

export interface ConciergeMetrics {
  ticketsToday: number;
  slaMetPercent: number;
  avgFirstReplyTime: number;
  recentNotes: Array<{
    id: string;
    member: string;
    note: string;
    timestamp: string;
    agent: string;
  }>;
}

export interface SalesMetrics {
  newMembersThisMonth: number;
  pipeline: Array<{
    stage: string;
    count: number;
    value: number;
  }>;
  topAdvisors: Array<{
    name: string;
    enrollments: number;
    revenue: number;
    closeRate: number;
  }>;
  closeRate: number;
}

export interface OperationsMetrics {
  openByQueue: Array<{
    queue: string;
    count: number;
    avgAge: number;
  }>;
  agingOver48h: number;
  escalations: number;
  avgResolutionTime: number;
}

export interface FinanceMetrics {
  accountsReceivable: number;
  accountsPayable: number;
  payoutsThisMonth: number;
  trendData: Array<{
    date: string;
    revenue: number;
    expenses: number;
  }>;
}

export interface ComplianceMetrics {
  hipaaAuditCount: number;
  unresolvedFindings: number;
  lastBackupVerification: string;
  nextAuditDate: string;
  complianceScore: number;
}
