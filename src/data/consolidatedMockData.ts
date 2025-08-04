// Consolidated Mock Data for MPB Health CTO Dashboard
// This file consolidates all mock data to reduce redundancy

// === ANALYTICS DATA ===
export const kpiMetrics = [
  { title: 'Daily Active Users', value: '4,827', change: '+8.3%', trend: 'up' },
  { title: 'Monthly Revenue', value: '$487,250', change: '+12.3%', trend: 'up' },
  { title: 'Customer Satisfaction', value: '4.7/5', change: '+0.3', trend: 'up' },
  { title: 'User Retention', value: '89.4%', change: '+2.1%', trend: 'up' },
];

// === MEMBER ENGAGEMENT DATA ===
export const memberEngagementKPIs = [
  { title: 'Total Logins (30 days)', value: '8,247', change: '+15.3%', trend: 'up' },
  { title: 'Avg. Session Duration', value: '6m 42s', change: '+8.7%', trend: 'up' },
  { title: 'ID Card Usage', value: '62%', change: '+4.2%', trend: 'up' },
  { title: 'Most Viewed Section', value: 'Benefits', change: '34% of visits', trend: 'stable' },
];

export const dailyLoginsData = [
  { date: '12/01', logins: 245, mobile: 147, desktop: 98 },
  { date: '12/02', logins: 289, mobile: 173, desktop: 116 },
  { date: '12/03', logins: 267, mobile: 160, desktop: 107 },
  { date: '12/04', logins: 312, mobile: 187, desktop: 125 },
  { date: '12/05', logins: 298, mobile: 179, desktop: 119 },
  { date: '12/06', logins: 334, mobile: 200, desktop: 134 },
  { date: '12/07', logins: 278, mobile: 167, desktop: 111 },
  { date: '12/08', logins: 256, mobile: 154, desktop: 102 },
  { date: '12/09', logins: 301, mobile: 181, desktop: 120 },
  { date: '12/10', logins: 289, mobile: 173, desktop: 116 },
  { date: '12/11', logins: 345, mobile: 207, desktop: 138 },
  { date: '12/12', logins: 367, mobile: 220, desktop: 147 },
  { date: '12/13', logins: 323, mobile: 194, desktop: 129 },
  { date: '12/14', logins: 298, mobile: 179, desktop: 119 },
  { date: '12/15', logins: 312, mobile: 187, desktop: 125 },
  { date: '12/16', logins: 289, mobile: 173, desktop: 116 },
  { date: '12/17', logins: 334, mobile: 200, desktop: 134 },
  { date: '12/18', logins: 356, mobile: 214, desktop: 142 },
  { date: '12/19', logins: 378, mobile: 227, desktop: 151 },
  { date: '12/20', logins: 345, mobile: 207, desktop: 138 },
];

export const featureUsageData = [
  { feature: 'ID Card', usage: 62, color: '#3B82F6', sessions: 5124 },
  { feature: 'Chat Support', usage: 45, color: '#10B981', sessions: 3712 },
  { feature: 'Appointments', usage: 38, color: '#F59E0B', sessions: 3134 },
  { feature: 'Lab Results', usage: 29, color: '#EF4444', sessions: 2391 },
  { feature: 'Claims', usage: 24, color: '#8B5CF6', sessions: 1978 },
  { feature: 'Provider Directory', usage: 19, color: '#EC4899', sessions: 1567 },
];

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
    kpiMetrics,
    dailyActiveUsers: [
      { date: '2024-07-01', users: 4210, mobile: 3150, desktop: 1060 },
      { date: '2024-07-02', users: 4350, mobile: 3262, desktop: 1088 },
      { date: '2024-07-03', users: 4280, mobile: 3210, desktop: 1070 },
      { date: '2024-07-04', users: 4150, mobile: 3112, desktop: 1038 },
      { date: '2024-07-05', users: 4390, mobile: 3292, desktop: 1098 },
      { date: '2024-07-06', users: 3920, mobile: 2940, desktop: 980 },
      { date: '2024-07-07', users: 3850, mobile: 2887, desktop: 963 },
      { date: '2024-07-08', users: 4450, mobile: 3337, desktop: 1113 },
      { date: '2024-07-09', users: 4580, mobile: 3435, desktop: 1145 },
      { date: '2024-07-10', users: 4620, mobile: 3465, desktop: 1155 },
      { date: '2024-07-11', users: 4690, mobile: 3517, desktop: 1173 },
      { date: '2024-07-12', users: 4750, mobile: 3562, desktop: 1188 },
      { date: '2024-07-13', users: 4270, mobile: 3202, desktop: 1068 },
      { date: '2024-07-14', users: 4120, mobile: 3090, desktop: 1030 },
      { date: '2024-07-15', users: 4827, mobile: 3620, desktop: 1207 },
    ],
    revenueData: [
      { month: 'Aug', revenue: 425000, newMembers: 142, growth: 8.2 },
      { month: 'Sep', revenue: 448000, newMembers: 156, growth: 5.4 },
      { month: 'Oct', revenue: 462000, newMembers: 149, growth: 3.1 },
      { month: 'Nov', revenue: 479000, newMembers: 167, growth: 3.7 },
      { month: 'Dec', revenue: 487250, newMembers: 158, growth: 1.7 },
    ],
    satisfactionScores: [
      { month: 'Aug', score: 4.4, responses: 234 },
      { month: 'Sep', score: 4.5, responses: 267 },
      { month: 'Oct', score: 4.6, responses: 289 },
      { month: 'Nov', score: 4.7, responses: 312 },
      { month: 'Dec', score: 4.7, responses: 298 },
    ],
    regionalPerformance: [
      { region: 'Northeast', users: 1420, revenue: 142000, growth: 12.3 },
      { region: 'Southeast', users: 1280, revenue: 128000, growth: 8.7 },
      { region: 'Midwest', users: 980, revenue: 98000, growth: 15.2 },
      { region: 'West', users: 1147, revenue: 119250, growth: 6.8 },
    ],
    insights: [
      'User engagement increased 8.3% month-over-month with mobile usage driving growth',
      'Customer satisfaction reached all-time high of 4.7/5 stars',
      'Northeast region showing strongest growth at 12.3% quarter-over-quarter',
      'ID Card feature adoption reached 62% of active users'
    ],
    recommendations: [
      'Focus marketing efforts on high-performing Northeast region',
      'Expand mobile app features to capitalize on 75% mobile usage',
      'Launch referral program to leverage high satisfaction scores',
      'Investigate and replicate Midwest growth strategies in other regions'
    ],
    currency: '$',
    region: 'North America'
  },
  saudemax: {
    kpiMetrics: [
      { title: 'Daily Active Users', value: '3,216', change: '+15.7%', trend: 'up' },
      { title: 'Monthly Revenue', value: 'R$1.2M', change: '+18.5%', trend: 'up' },
      { title: 'Customer Satisfaction', value: '4.4/5', change: '+0.5', trend: 'up' },
      { title: 'User Retention', value: '85.2%', change: '+3.8%', trend: 'up' },
    ],
    dailyActiveUsers: [
      { date: '2024-07-01', users: 2650, mobile: 2120, desktop: 530 },
      { date: '2024-07-02', users: 2720, mobile: 2176, desktop: 544 },
      { date: '2024-07-03', users: 2680, mobile: 2144, desktop: 536 },
      { date: '2024-07-04', users: 2710, mobile: 2168, desktop: 542 },
      { date: '2024-07-05', users: 2790, mobile: 2232, desktop: 558 },
      { date: '2024-07-06', users: 2550, mobile: 2040, desktop: 510 },
      { date: '2024-07-07', users: 2480, mobile: 1984, desktop: 496 },
      { date: '2024-07-08', users: 2820, mobile: 2256, desktop: 564 },
      { date: '2024-07-09', users: 2950, mobile: 2360, desktop: 590 },
      { date: '2024-07-10', users: 3010, mobile: 2408, desktop: 602 },
      { date: '2024-07-11', users: 3080, mobile: 2464, desktop: 616 },
      { date: '2024-07-12', users: 3130, mobile: 2504, desktop: 626 },
      { date: '2024-07-13', users: 2890, mobile: 2312, desktop: 578 },
      { date: '2024-07-14', users: 2750, mobile: 2200, desktop: 550 },
      { date: '2024-07-15', users: 3216, mobile: 2573, desktop: 643 },
    ],
    revenueData: [
      { month: 'Aug', revenue: 980000, newMembers: 189, growth: 18.5 },
      { month: 'Sep', revenue: 1050000, newMembers: 210, growth: 7.1 },
      { month: 'Oct', revenue: 1120000, newMembers: 198, growth: 6.7 },
      { month: 'Nov', revenue: 1180000, newMembers: 234, growth: 5.4 },
      { month: 'Dec', revenue: 1200000, newMembers: 216, growth: 1.7 },
    ],
    satisfactionScores: [
      { month: 'Aug', score: 3.9, responses: 156 },
      { month: 'Sep', score: 4.1, responses: 178 },
      { month: 'Oct', score: 4.2, responses: 194 },
      { month: 'Nov', score: 4.3, responses: 201 },
      { month: 'Dec', score: 4.4, responses: 187 },
    ],
    regionalPerformance: [
      { region: 'São Paulo', users: 1289, revenue: 480000, growth: 22.1 },
      { region: 'Rio de Janeiro', users: 854, revenue: 320000, growth: 18.3 },
      { region: 'Brasília', users: 567, revenue: 210000, growth: 15.7 },
      { region: 'Outros Estados', users: 506, revenue: 190000, growth: 12.4 },
    ],
    insights: [
      'Brazilian market showing exceptional 15.7% growth with strong regional expansion',
      'São Paulo leading with 1,289 active users and 22.1% growth rate',
      'Customer satisfaction improved 0.5 points to 4.4/5 stars', 
      'Mobile-first strategy successful with 80% mobile app usage'
    ],
    recommendations: [
      'Accelerate expansion in high-growth São Paulo and Rio markets',
      'Localize more features for Portuguese-speaking audience',
      'Partner with local healthcare providers for market penetration',
      'Invest in customer success to maintain satisfaction trajectory'
    ],
    currency: 'R$',
    region: 'Brazil'
  }
};

// Helper function to get department data
export const getDepartmentData = (department: 'mpb' | 'saudemax') => {
  return departmentData[department];
};