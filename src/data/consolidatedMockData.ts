// Consolidated Mock Data for Analytics Pages

// Member Engagement KPIs
export const memberEngagementKPIs = [
  {
    title: 'Active Users',
    value: '12,847',
    change: '+8.2%',
    trend: 'up' as const,
    description: 'Monthly active users',
  },
  {
    title: 'Avg. Session Duration',
    value: '18m 34s',
    change: '+12.5%',
    trend: 'up' as const,
    description: 'Average time per session',
  },
  {
    title: 'Feature Adoption',
    value: '76.3%',
    change: '+5.1%',
    trend: 'up' as const,
    description: 'Users using new features',
  },
  {
    title: 'Daily Active Users',
    value: '4,523',
    change: '+3.4%',
    trend: 'up' as const,
    description: 'Users active today',
  },
];

// Daily Logins Data (Last 30 Days)
export const dailyLoginsData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0],
  logins: Math.floor(4000 + Math.random() * 1500),
}));

// Feature Usage Data
export const featureUsageData = [
  { feature: 'Dashboard', users: 11234, sessions: 34521 },
  { feature: 'Reports', users: 8945, sessions: 22103 },
  { feature: 'Analytics', users: 6723, sessions: 15234 },
  { feature: 'Settings', users: 5621, sessions: 8934 },
  { feature: 'Integrations', users: 3456, sessions: 7821 },
];

// Member Retention KPIs
export const memberRetentionKPIs = [
  {
    title: 'Retention Rate',
    value: '94.2%',
    change: '+2.1%',
    trend: 'up' as const,
    description: '90-day retention',
  },
  {
    title: 'Churn Rate',
    value: '5.8%',
    change: '-1.2%',
    trend: 'down' as const,
    description: 'Monthly churn',
  },
  {
    title: 'Avg. Tenure',
    value: '18.4mo',
    change: '+3.2mo',
    trend: 'up' as const,
    description: 'Average member tenure',
  },
  {
    title: 'At-Risk Members',
    value: '423',
    change: '-8.7%',
    trend: 'down' as const,
    description: 'Members at risk of churning',
  },
];

// Cohort Retention Data
export const cohortRetentionData = [
  { month: 'Month 0', retention: 100, cohort: 'Jan 2024' },
  { month: 'Month 1', retention: 96.5, cohort: 'Jan 2024' },
  { month: 'Month 2', retention: 94.2, cohort: 'Jan 2024' },
  { month: 'Month 3', retention: 91.8, cohort: 'Jan 2024' },
  { month: 'Month 4', retention: 89.5, cohort: 'Jan 2024' },
  { month: 'Month 5', retention: 87.3, cohort: 'Jan 2024' },
  { month: 'Month 6', retention: 85.2, cohort: 'Jan 2024' },
];

// Churn Reasons
export const churnReasons = [
  { reason: 'Price', count: 145 },
  { reason: 'Competitor', count: 89 },
  { reason: 'Service Quality', count: 67 },
  { reason: 'Not Using', count: 54 },
  { reason: 'Other', count: 68 },
];

// Advisor Performance KPIs
export const advisorPerformanceKPIs = [
  {
    title: 'Total Advisors',
    value: '47',
    change: '+3',
    trend: 'up' as const,
    description: 'Active advisors',
  },
  {
    title: 'Avg. Enrollments',
    value: '23.4',
    change: '+5.2%',
    trend: 'up' as const,
    description: 'Per advisor per month',
  },
  {
    title: 'Avg. Close Rate',
    value: '66.7%',
    change: '+2.1%',
    trend: 'up' as const,
    description: 'Overall close rate',
  },
  {
    title: 'Total Revenue',
    value: '$524K',
    change: '+12.3%',
    trend: 'up' as const,
    description: 'This month',
  },
];

// Top Advisors Data
export const topAdvisorsData = [
  {
    name: 'Sarah Johnson',
    enrollments: 34,
    revenue: 128400,
    closeRate: 72.5,
    rank: 1,
  },
  {
    name: 'Michael Chen',
    enrollments: 31,
    revenue: 118200,
    closeRate: 69.8,
    rank: 2,
  },
  {
    name: 'Emily Rodriguez',
    enrollments: 28,
    revenue: 112800,
    closeRate: 67.3,
    rank: 3,
  },
  {
    name: 'David Kim',
    enrollments: 26,
    revenue: 104600,
    closeRate: 65.2,
    rank: 4,
  },
  {
    name: 'Lisa Wong',
    enrollments: 24,
    revenue: 98400,
    closeRate: 63.8,
    rank: 5,
  },
];

// System Uptime Data
export const systemUptimeData = [
  { service: 'API Gateway', uptime: 99.98, status: 'operational' },
  { service: 'Database', uptime: 99.95, status: 'operational' },
  { service: 'Authentication', uptime: 99.99, status: 'operational' },
  { service: 'File Storage', uptime: 99.92, status: 'operational' },
  { service: 'Email Service', uptime: 99.87, status: 'operational' },
];

// Marketing Analytics KPIs
export const marketingKPIs = [
  {
    title: 'Total Impressions',
    value: '2.4M',
    change: '+18.2%',
    trend: 'up' as const,
    description: 'Last 30 days',
  },
  {
    title: 'Click-Through Rate',
    value: '3.4%',
    change: '+0.8%',
    trend: 'up' as const,
    description: 'Average CTR',
  },
  {
    title: 'Cost Per Acquisition',
    value: '$124',
    change: '-12.5%',
    trend: 'down' as const,
    description: 'Per new member',
  },
  {
    title: 'ROAS',
    value: '4.2x',
    change: '+15.3%',
    trend: 'up' as const,
    description: 'Return on ad spend',
  },
];

// Channel Performance Data
export const channelPerformanceData = [
  {
    channel: 'Google Ads',
    impressions: 845000,
    clicks: 34200,
    conversions: 423,
    spend: 28400,
    roas: 4.8,
  },
  {
    channel: 'Facebook Ads',
    impressions: 723000,
    clicks: 28900,
    conversions: 367,
    spend: 24100,
    roas: 4.2,
  },
  {
    channel: 'LinkedIn Ads',
    impressions: 456000,
    clicks: 15200,
    conversions: 234,
    spend: 18900,
    roas: 3.6,
  },
  {
    channel: 'Organic Search',
    impressions: 234000,
    clicks: 12300,
    conversions: 189,
    spend: 0,
    roas: 0,
  },
  {
    channel: 'Email Marketing',
    impressions: 187000,
    clicks: 8900,
    conversions: 145,
    spend: 4200,
    roas: 5.2,
  },
];

// Campaign Performance Over Time
export const campaignPerformanceData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0],
  impressions: Math.floor(75000 + Math.random() * 25000),
  clicks: Math.floor(2500 + Math.random() * 1000),
  conversions: Math.floor(30 + Math.random() * 20),
  spend: Math.floor(2000 + Math.random() * 800),
}));

export default {
  memberEngagementKPIs,
  dailyLoginsData,
  featureUsageData,
  memberRetentionKPIs,
  cohortRetentionData,
  churnReasons,
  advisorPerformanceKPIs,
  topAdvisorsData,
  systemUptimeData,
  marketingKPIs,
  channelPerformanceData,
  campaignPerformanceData,
};
