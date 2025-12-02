/**
 * Consolidated Mock Data for Dashboard Visualizations
 * 
 * This file provides fallback/demo data for dashboard components when
 * real data from Supabase isn't available. Components should prefer
 * real data from hooks when available.
 */

// Member Engagement Mock Data
export const memberEngagementKPIs = [
  { title: 'Active Members', value: '12,847', change: '+5.2%', trend: 'up' as const, icon: 'Users' },
  { title: 'Daily Active Users', value: '8,234', change: '+3.1%', trend: 'up' as const, icon: 'Activity' },
  { title: 'Avg. Session Duration', value: '24m 18s', change: '+8.4%', trend: 'up' as const, icon: 'Clock' },
  { title: 'Feature Adoption', value: '78%', change: '+2.3%', trend: 'up' as const, icon: 'TrendingUp' },
];

export const dailyLoginsData = [
  { date: 'Nov 1', logins: 7234 },
  { date: 'Nov 5', logins: 7856 },
  { date: 'Nov 10', logins: 8123 },
  { date: 'Nov 15', logins: 7945 },
  { date: 'Nov 20', logins: 8567 },
  { date: 'Nov 25', logins: 8234 },
  { date: 'Nov 30', logins: 8890 },
];

export const featureUsageData = [
  { feature: 'Dashboard', usage: 94 },
  { feature: 'Reports', usage: 78 },
  { feature: 'Analytics', usage: 65 },
  { feature: 'Settings', usage: 45 },
  { feature: 'Support', usage: 32 },
];

// Member Retention Mock Data
export const retentionKPIs = [
  { title: 'Retention Rate', value: '89.2%', change: '+1.5%', trend: 'up' as const, icon: 'TrendingUp' },
  { title: 'Churn Rate', value: '10.8%', change: '-1.5%', trend: 'down' as const, icon: 'TrendingDown' },
  { title: 'Avg. Member Tenure', value: '13.2 mo', change: '+0.8 mo', trend: 'up' as const, icon: 'Calendar' },
  { title: 'At-Risk Members', value: '234', change: '-12%', trend: 'down' as const, icon: 'AlertTriangle' },
];

export const monthlyChurnData = [
  { month: 'Jul', voluntary: 45, involuntary: 12 },
  { month: 'Aug', voluntary: 52, involuntary: 15 },
  { month: 'Sep', voluntary: 48, involuntary: 11 },
  { month: 'Oct', voluntary: 41, involuntary: 14 },
  { month: 'Nov', voluntary: 38, involuntary: 10 },
  { month: 'Dec', voluntary: 35, involuntary: 9 },
];

export const retentionBySegment = [
  { segment: 'Premium', retention: 94 },
  { segment: 'Standard', retention: 87 },
  { segment: 'Basic', retention: 78 },
  { segment: 'Trial', retention: 45 },
];

export const churnReasons = [
  { reason: 'Cost/Budget', percentage: 34, count: 156 },
  { reason: 'Competitor Switch', percentage: 22, count: 101 },
  { reason: 'Service Quality', percentage: 18, count: 83 },
  { reason: 'No Longer Needed', percentage: 15, count: 69 },
  { reason: 'Other', percentage: 11, count: 51 },
];

export const retentionTimeline = [
  { month: 'Jul', retention: 87.5 },
  { month: 'Aug', retention: 88.1 },
  { month: 'Sep', retention: 88.8 },
  { month: 'Oct', retention: 89.0 },
  { month: 'Nov', retention: 89.2 },
  { month: 'Dec', retention: 89.5 },
];

export const churnTimeline = [
  { month: 'Jul', voluntary: 45, involuntary: 12 },
  { month: 'Aug', voluntary: 52, involuntary: 15 },
  { month: 'Sep', voluntary: 48, involuntary: 11 },
  { month: 'Oct', voluntary: 41, involuntary: 14 },
  { month: 'Nov', voluntary: 38, involuntary: 10 },
  { month: 'Dec', voluntary: 35, involuntary: 9 },
];

export const cohortAnalysis = [
  { cohort: 'Jan 2024', month1: 100, month2: 92, month3: 88, month4: 85, month5: 82, month6: 80 },
  { cohort: 'Feb 2024', month1: 100, month2: 94, month3: 89, month4: 86, month5: 83, month6: null },
  { cohort: 'Mar 2024', month1: 100, month2: 91, month3: 87, month4: 84, month5: null, month6: null },
  { cohort: 'Apr 2024', month1: 100, month2: 93, month3: 88, month4: null, month5: null, month6: null },
  { cohort: 'May 2024', month1: 100, month2: 95, month3: null, month4: null, month5: null, month6: null },
];

// Advisor Performance Mock Data
export const advisorKpis = [
  { title: 'Total Sales', value: '$2.4M', change: '+12.5%', trend: 'up' as const, icon: 'DollarSign' },
  { title: 'Deals Closed', value: '847', change: '+8.3%', trend: 'up' as const, icon: 'CheckCircle' },
  { title: 'Avg. Conversion', value: '32.5%', change: '+2.1%', trend: 'up' as const, icon: 'Target' },
  { title: 'Active Advisors', value: '24', change: '+3', trend: 'up' as const, icon: 'Users' },
];

export const topAdvisors = [
  { name: 'Sarah Johnson', sales: 425000, deals: 142, conversion: 38, commission: 63750, avatar: 'SJ' },
  { name: 'Michael Chen', sales: 380000, deals: 128, conversion: 35, commission: 57000, avatar: 'MC' },
  { name: 'Emily Davis', sales: 345000, deals: 115, conversion: 33, commission: 51750, avatar: 'ED' },
  { name: 'James Wilson', sales: 312000, deals: 104, conversion: 31, commission: 46800, avatar: 'JW' },
  { name: 'Lisa Martinez', sales: 298000, deals: 99, conversion: 30, commission: 44700, avatar: 'LM' },
];

export const salesTrends = [
  { month: 'Jul', sales: 320000, deals: 98, advisors: 22 },
  { month: 'Aug', sales: 345000, deals: 112, advisors: 23 },
  { month: 'Sep', sales: 378000, deals: 125, advisors: 23 },
  { month: 'Oct', sales: 412000, deals: 138, advisors: 24 },
  { month: 'Nov', sales: 445000, deals: 152, advisors: 24 },
  { month: 'Dec', sales: 480000, deals: 165, advisors: 24 },
];

export const planBreakdown = [
  { plan: 'Premium', sales: 1080000, percentage: 45, color: '#EC4899' },
  { plan: 'Standard', sales: 840000, percentage: 35, color: '#3B82F6' },
  { plan: 'Basic', sales: 360000, percentage: 15, color: '#10B981' },
  { plan: 'Enterprise', sales: 120000, percentage: 5, color: '#8B5CF6' },
];

export const advisorSkills = [
  { skill: 'Product Knowledge', score: 92 },
  { skill: 'Communication', score: 88 },
  { skill: 'Closing', score: 85 },
  { skill: 'Follow-up', score: 78 },
  { skill: 'Objection Handling', score: 82 },
  { skill: 'Time Management', score: 75 },
];

export const performanceMetrics = [
  { advisor: 'Sarah Johnson', calls: 45, meetings: 18, proposals: 12 },
  { advisor: 'Michael Chen', calls: 42, meetings: 16, proposals: 10 },
  { advisor: 'Emily Davis', calls: 38, meetings: 14, proposals: 9 },
  { advisor: 'James Wilson', calls: 35, meetings: 12, proposals: 8 },
  { advisor: 'Lisa Martinez', calls: 32, meetings: 10, proposals: 7 },
];

// KPI Metrics for presentations
export const kpiMetrics = [
  { name: 'Revenue Growth', value: '+24%', status: 'positive' },
  { name: 'Customer Satisfaction', value: '4.8/5', status: 'positive' },
  { name: 'Operational Efficiency', value: '+15%', status: 'positive' },
  { name: 'Market Share', value: '18%', status: 'neutral' },
];

export const projectTimeline = [
  { phase: 'Discovery', start: '2024-01-01', end: '2024-02-15', status: 'completed' },
  { phase: 'Design', start: '2024-02-16', end: '2024-04-01', status: 'completed' },
  { phase: 'Development', start: '2024-04-02', end: '2024-08-31', status: 'in-progress' },
  { phase: 'Testing', start: '2024-09-01', end: '2024-10-31', status: 'pending' },
  { phase: 'Launch', start: '2024-11-01', end: '2024-12-15', status: 'pending' },
];

// System Uptime Mock Data
export const uptimeKPIs = [
  { title: 'Overall Uptime', value: '99.97%', change: '+0.02%', trend: 'up' as const, icon: 'CheckCircle' },
  { title: 'Active Incidents', value: '0', change: '-2', trend: 'down' as const, icon: 'AlertTriangle' },
  { title: 'Response Time', value: '145ms', change: '-12ms', trend: 'down' as const, icon: 'Zap' },
  { title: 'Error Rate', value: '0.03%', change: '-0.01%', trend: 'down' as const, icon: 'XCircle' },
];

export const systemHealth = [
  { component: 'API Gateway', status: 'Healthy', uptime: 99.99, latency: 45 },
  { component: 'Database', status: 'Healthy', uptime: 99.98, latency: 12 },
  { component: 'Auth Service', status: 'Healthy', uptime: 99.97, latency: 23 },
  { component: 'File Storage', status: 'Warning', uptime: 99.85, latency: 156 },
  { component: 'Email Service', status: 'Healthy', uptime: 99.95, latency: 234 },
];

export const incidentTimeline = [
  { date: 'Nov 15', severity: 'low', duration: 5, description: 'Brief API latency spike' },
  { date: 'Nov 8', severity: 'medium', duration: 15, description: 'Database connection pool exhaustion' },
  { date: 'Oct 28', severity: 'low', duration: 3, description: 'CDN cache invalidation delay' },
];

export const uptimeTimeline = [
  { day: 'Mon', uptime: 99.99 },
  { day: 'Tue', uptime: 99.98 },
  { day: 'Wed', uptime: 99.97 },
  { day: 'Thu', uptime: 99.99 },
  { day: 'Fri', uptime: 99.95 },
  { day: 'Sat', uptime: 99.99 },
  { day: 'Sun', uptime: 99.98 },
];

export const systemComponents = [
  { name: 'API Gateway', status: 'Healthy', uptime: '99.99%', responseTime: '45ms' },
  { name: 'Database Cluster', status: 'Healthy', uptime: '99.98%', responseTime: '12ms' },
  { name: 'Authentication', status: 'Healthy', uptime: '99.97%', responseTime: '23ms' },
  { name: 'File Storage', status: 'Warning', uptime: '99.85%', responseTime: '156ms' },
  { name: 'Email Service', status: 'Healthy', uptime: '99.95%', responseTime: '234ms' },
  { name: 'Search Index', status: 'Healthy', uptime: '99.96%', responseTime: '67ms' },
];

// Consolidated export for backward compatibility
export const consolidatedMockData = {
  members: [],
  engagement: memberEngagementKPIs,
  retention: retentionKPIs,
  analytics: kpiMetrics,
};

export default consolidatedMockData;
