// Consolidated Mock Data for MPB Health CTO Dashboard
// This file consolidates all mock data to reduce redundancy
// Analytics data removed - ready for file uploads

// === ANALYTICS DATA ===
export const kpiMetrics: any[] = [];

// === MEMBER ENGAGEMENT DATA ===
export const memberEngagementKPIs: any[] = [];
export const dailyLoginsData: any[] = [];
export const featureUsageData: any[] = [];

// === RETENTION DATA ===
export const retentionKPIs: any[] = [];
export const churnReasons: any[] = [];

// === ADVISOR PERFORMANCE DATA ===
export const advisorKpis: any[] = [];
export const topAdvisors: any[] = [];

// === SYSTEM UPTIME DATA ===
export const uptimeKPIs = [
  { title: 'Current Uptime', value: '99.98%', change: '+0.02%', trend: 'up' },
  { title: 'Incidents (30d)', value: '2', change: '-50%', trend: 'down' },
  { title: 'Avg. Response Time', value: '142ms', change: '-8ms', trend: 'down' },
  { title: 'Longest Outage', value: '12 min', change: 'Dec 15', trend: 'stable' },
];

export const systemComponents = [
  { name: 'MPB Core API', status: 'Healthy', uptime: 99.98, responseTime: 142 },
  { name: 'E123 System', status: 'Healthy', uptime: 99.97, responseTime: 89 },
  { name: 'Member Portal', status: 'Healthy', uptime: 99.99, responseTime: 156 },
  { name: 'Database Cluster', status: 'Warning', uptime: 99.95, responseTime: 234 },
  { name: 'Payment Gateway', status: 'Healthy', uptime: 99.98, responseTime: 178 },
];

// === ADVISOR PERFORMANCE EXTENDED DATA ===
export const performanceMetrics: any[] = [];
export const salesTrends: any[] = [];
export const planBreakdown: any[] = [];
export const advisorSkills: any[] = [];

// === ANALYTICS DATA (was mockAnalytics) ===
export const mrrData: any[] = [];

// === MEMBER ENGAGEMENT DATA (was mockMemberEngagement) ===
export const sessionDurationData: any[] = [];

// === RETENTION DATA EXTENDED (was mockRetention) ===
export const monthlyRetentionData: any[] = [];

// === UPTIME DATA EXTENDED (was mockUptime) ===
// Note: uptimeKPIs and systemComponents already exist above
export const incidentHistory = [
  { date: '2024-07-15', duration: 12, severity: 'minor', resolved: true },
  { date: '2024-07-08', duration: 3, severity: 'major', resolved: true },
  { date: '2024-06-22', duration: 8, severity: 'minor', resolved: true },
];

export const responseTimeHistory = [
  { date: '07/26', avgResponse: 145, p95Response: 298 },
  { date: '07/27', avgResponse: 132, p95Response: 276 },
  { date: '07/28', avgResponse: 158, p95Response: 312 },
  { date: '07/29', avgResponse: 141, p95Response: 287 },
  { date: '07/30', avgResponse: 142, p95Response: 289 },
];
// === RETENTION DATA EXTENDED ===
export const retentionTimeline: any[] = [];
export const churnTimeline: any[] = [];
export const cohortAnalysis: any[] = [];

// === UPTIME DATA EXTENDED ===
export const uptimeTimeline = [
  { date: '12/01', uptime: 99.97 },
  { date: '12/02', uptime: 99.98 },
  { date: '12/03', uptime: 99.99 },
  { date: '12/04', uptime: 99.96 },
  { date: '12/05', uptime: 99.98 },
  { date: '12/06', uptime: 99.97 },
  { date: '12/07', uptime: 99.99 },
  { date: '12/08', uptime: 99.98 },
  { date: '12/09', uptime: 99.97 },
  { date: '12/10', uptime: 99.98 },
  { date: '12/11', uptime: 99.99 },
  { date: '12/12', uptime: 99.98 },
  { date: '12/13', uptime: 99.97 },
  { date: '12/14', uptime: 99.98 },
  { date: '12/15', uptime: 99.98 },
];

// === DEPARTMENT SPECIFIC DATA ===
export const departmentData = {
  mpb: {
    kpiMetrics: [],
    dailyActiveUsers: [],
    revenueData: [],
    satisfactionScores: [],
    regionalPerformance: [],
    insights: [],
    recommendations: [],
    currency: '$',
    region: 'North America'
  },
  saudemax: {
    kpiMetrics: [],
    dailyActiveUsers: [],
    revenueData: [],
    satisfactionScores: [],
    regionalPerformance: [],
    insights: [],
    recommendations: [],
    currency: 'R$',
    region: 'Brazil'
  }
};

// Helper function to get department data
export const getDepartmentData = (department: 'mpb' | 'saudemax') => {
  return departmentData[department];
};