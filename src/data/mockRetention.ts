export const retentionKPIs = [
  { title: 'Retention Rate', value: '89.2%', change: '+1.5%', trend: 'up' },
  { title: 'Churned Members (30d)', value: '128', change: '-6.1%', trend: 'down' },
  { title: 'Renewal Rate', value: '74%', change: '+2.1%', trend: 'up' },
  { title: 'Avg. Tenure', value: '13.2 mo', change: '+0.8 mo', trend: 'up' },
];

export const retentionTimeline = [
  { month: 'Jan', retention: 86.3, newMembers: 245, renewals: 189 },
  { month: 'Feb', retention: 87.0, newMembers: 267, renewals: 201 },
  { month: 'Mar', retention: 87.9, newMembers: 289, renewals: 234 },
  { month: 'Apr', retention: 88.2, newMembers: 312, renewals: 256 },
  { month: 'May', retention: 89.2, newMembers: 334, renewals: 278 },
  { month: 'Jun', retention: 88.8, newMembers: 298, renewals: 267 },
];

export const churnTimeline = [
  { month: 'Jan', churned: 212, voluntary: 156, involuntary: 56 },
  { month: 'Feb', churned: 198, voluntary: 142, involuntary: 56 },
  { month: 'Mar', churned: 176, voluntary: 128, involuntary: 48 },
  { month: 'Apr', churned: 142, voluntary: 98, involuntary: 44 },
  { month: 'May', churned: 128, voluntary: 89, involuntary: 39 },
  { month: 'Jun', churned: 134, voluntary: 92, involuntary: 42 },
];

export const churnReasons = [
  { reason: 'Cost Concerns', percentage: 34, count: 43 },
  { reason: 'Found Better Plan', percentage: 28, count: 36 },
  { reason: 'Service Issues', percentage: 18, count: 23 },
  { reason: 'Life Changes', percentage: 12, count: 15 },
  { reason: 'Other', percentage: 8, count: 11 },
];

export const cohortAnalysis = [
  { cohort: 'Jan 2024', month1: 100, month2: 94, month3: 89, month4: 85, month5: 82, month6: 79 },
  { cohort: 'Feb 2024', month1: 100, month2: 96, month3: 91, month4: 87, month5: 84, month6: 81 },
  { cohort: 'Mar 2024', month1: 100, month2: 95, month3: 90, month4: 86, month5: 83 },
  { cohort: 'Apr 2024', month1: 100, month2: 97, month3: 92, month4: 88 },
  { cohort: 'May 2024', month1: 100, month2: 96, month3: 91 },
  { cohort: 'Jun 2024', month1: 100, month2: 94 },
];