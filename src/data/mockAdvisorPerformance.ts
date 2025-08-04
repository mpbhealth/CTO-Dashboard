// src/data/mockAdvisorPerformance.ts

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

export const performanceMetrics = [
  { advisor: 'Wendy A.', calls: 174, meetings: 68, proposals: 45 },
  { advisor: 'Steve M.', calls: 156, meetings: 62, proposals: 38 },
  { advisor: 'Rachel C.', calls: 142, meetings: 58, proposals: 34 },
  { advisor: 'Chris B.', calls: 128, meetings: 44, proposals: 28 },
  { advisor: 'Taylor D.', calls: 96, meetings: 32, proposals: 18 },
];