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
export const retentionKPIs = [
  { title: 'Retention Rate', value: '89.2%', change: '+1.5%', trend: 'up' },
  { title: 'Churned Members (30d)', value: '128', change: '-6.1%', trend: 'down' },
  { title: 'Renewal Rate', value: '74%', change: '+2.1%', trend: 'up' },
  { title: 'Avg. Tenure', value: '13.2 mo', change: '+0.8 mo', trend: 'up' },
];

export const churnReasons = [
  { reason: 'Cost Concerns', percentage: 34, count: 43 },
  { reason: 'Found Better Plan', percentage: 28, count: 36 },
  { reason: 'Service Issues', percentage: 18, count: 23 },
  { reason: 'Life Changes', percentage: 12, count: 15 },
  { reason: 'Other', percentage: 8, count: 11 },
];

// === ADVISOR PERFORMANCE DATA ===
export const advisorKpis = [
  { title: 'Total Sales', value: '$684,200', change: '+6.2%', trend: 'up' },
  { title: 'Top Advisor', value: 'Wendy A.', change: '$205K sales', trend: 'stable' },
  { title: 'Avg. Conversion Rate', value: '18.4%', change: '+1.7%', trend: 'up' },
  { title: 'Deals Closed (30d)', value: '138', change: '+9.3%', trend: 'up' },
];

export const topAdvisors = [
  { name: 'Wendy A.', sales: 205000, deals: 42, conversion: 24.1, commission: 15350 },
  { name: 'Steve M.', sales: 175000, deals: 38, conversion: 21.8, commission: 13125 },
  { name: 'Rachel C.', sales: 152000, deals: 34, conversion: 19.5, commission: 11400 },
  { name: 'Chris B.', sales: 98000, deals: 28, conversion: 16.2, commission: 7350 },
  { name: 'Taylor D.', sales: 54200, deals: 18, conversion: 14.8, commission: 4065 },
];

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
export const performanceMetrics = [
  { advisor: 'Wendy A.', calls: 174, meetings: 68, proposals: 45 },
  { advisor: 'Steve M.', calls: 156, meetings: 62, proposals: 38 },
  { advisor: 'Rachel C.', calls: 142, meetings: 58, proposals: 34 },
  { advisor: 'Chris B.', calls: 128, meetings: 44, proposals: 28 },
  { advisor: 'Taylor D.', calls: 96, meetings: 32, proposals: 18 },
];

export const salesTrends = [
  { month: 'Aug', sales: 542000, deals: 128, advisors: 12 },
  { month: 'Sep', sales: 598000, deals: 142, advisors: 12 },
  { month: 'Oct', sales: 634000, deals: 156, advisors: 13 },
  { month: 'Nov', sales: 612000, deals: 148, advisors: 13 },
  { month: 'Dec', sales: 684200, deals: 164, advisors: 14 },
];

export const planBreakdown = [
  { plan: 'Premium Individual', sales: 245000, percentage: 36, color: '#3B82F6' },
  { plan: 'Family Plan', sales: 198000, percentage: 29, color: '#10B981' },
  { plan: 'Basic Individual', sales: 156000, percentage: 23, color: '#F59E0B' },
  { plan: 'Student Plan', sales: 85200, percentage: 12, color: '#EF4444' },
];

export const advisorSkills = [
  { skill: 'Communication', score: 92 },
  { skill: 'Product Knowledge', score: 88 },
  { skill: 'Closing Techniques', score: 85 },
  { skill: 'Follow-up', score: 90 },
  { skill: 'Objection Handling', score: 82 },
  { skill: 'Needs Assessment', score: 87 },
];

// === ANALYTICS DATA (was mockAnalytics) ===
export const mrrData: any[] = [];

// === MEMBER ENGAGEMENT DATA (was mockMemberEngagement) ===
export const sessionDurationData: any[] = [];

// === RETENTION DATA EXTENDED (was mockRetention) ===
// Note: retentionKPIs and retentionTimeline already exist above
export const monthlyRetentionData = [
  { month: 'May', newSignups: 156, retained: 142, rate: 91.0 },
  { month: 'June', newSignups: 178, retained: 164, rate: 92.1 },
  { month: 'July', newSignups: 189, retained: 173, rate: 91.5 },
  { month: 'August', newSignups: 201, retained: 186, rate: 92.5 },
];

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
export const retentionTimeline = [
  { month: 'Jun', retention: 87.8 },
  { month: 'Jul', retention: 88.2 },
  { month: 'Aug', retention: 88.7 },
  { month: 'Sep', retention: 89.1 },
  { month: 'Oct', retention: 89.4 },
  { month: 'Nov', retention: 89.2 },
];

export const churnTimeline = [
  { month: 'Jun', voluntary: 89, involuntary: 23 },
  { month: 'Jul', voluntary: 78, involuntary: 19 },
  { month: 'Aug', voluntary: 82, involuntary: 21 },
  { month: 'Sep', voluntary: 75, involuntary: 18 },
  { month: 'Oct', voluntary: 71, involuntary: 16 },
  { month: 'Nov', voluntary: 68, involuntary: 14 },
];

export const cohortAnalysis = [
  { cohort: 'Oct 2024', month1: 100, month2: 92, month3: 87, month4: 82, month5: 78, month6: 74 },
  { cohort: 'Sep 2024', month1: 100, month2: 94, month3: 89, month4: 84, month5: 80, month6: 76 },
  { cohort: 'Aug 2024', month1: 100, month2: 91, month3: 85, month4: 81, month5: 77, month6: null },
  { cohort: 'Jul 2024', month1: 100, month2: 93, month3: 88, month4: 83, month5: null, month6: null },
  { cohort: 'Jun 2024', month1: 100, month2: 90, month3: 84, month4: null, month5: null, month6: null },
  { cohort: 'May 2024', month1: 100, month2: 89, month3: null, month4: null, month5: null, month6: null },
];

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