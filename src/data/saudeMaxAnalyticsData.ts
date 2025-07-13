// SaudeMAX Department Analytics Data (Brazil)

export const kpiMetrics = [
  { title: 'Daily Active Users', value: '3,216', change: '+15.7%', trend: 'up' },
  { title: 'Monthly Revenue', value: 'R$1.2M', change: '+18.5%', trend: 'up' },
  { title: 'Customer Satisfaction', value: '4.4/5', change: '+0.5', trend: 'up' },
  { title: 'User Retention', value: '85.2%', change: '+3.8%', trend: 'up' },
];

export const dailyActiveUsers = [
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
];

export const revenueData = [
  { month: 'Jan', revenue: 820000, newMembers: 620, growth: 10.2 },
  { month: 'Feb', revenue: 875000, newMembers: 685, growth: 6.7 },
  { month: 'Mar', revenue: 940000, newMembers: 742, growth: 7.4 },
  { month: 'Apr', revenue: 1020000, newMembers: 815, growth: 8.5 },
  { month: 'May', revenue: 1120000, newMembers: 894, growth: 9.8 },
  { month: 'Jun', revenue: 1200000, newMembers: 960, growth: 7.1 },
];

export const satisfactionScores = [
  { month: 'Jan', score: 3.6, responses: 245 },
  { month: 'Feb', score: 3.8, responses: 278 },
  { month: 'Mar', score: 4.0, responses: 312 },
  { month: 'Apr', score: 4.1, responses: 356 },
  { month: 'May', score: 4.3, responses: 410 },
  { month: 'Jun', score: 4.4, responses: 462 },
];

export const productUsage = [
  { feature: 'Dashboard', usageRate: 89, averageTimeMin: 7.8 },
  { feature: 'ID Card', usageRate: 92, averageTimeMin: 2.4 },
  { feature: 'Benefits', usageRate: 81, averageTimeMin: 5.2 },
  { feature: 'Claims', usageRate: 72, averageTimeMin: 7.1 },
  { feature: 'Providers', usageRate: 68, averageTimeMin: 6.3 },
  { feature: 'Chat Support', usageRate: 57, averageTimeMin: 8.5 },
  { feature: 'Wellness', usageRate: 45, averageTimeMin: 4.2 },
];

export const marketTrends = [
  { quarter: 'Q1 2024', marketShare: 8.2, industryGrowth: 7.8, competitorShare: 65.4 },
  { quarter: 'Q2 2024', marketShare: 9.6, industryGrowth: 7.2, competitorShare: 62.8 },
  { quarter: 'Q3 2024', marketShare: 10.8, industryGrowth: 6.9, competitorShare: 60.5 },
  { quarter: 'Q4 2024', marketShare: 12.5, industryGrowth: 7.4, competitorShare: 58.2 },
];

export const growthMetrics = [
  { month: 'Jan', newUsers: 620, conversion: 4.8, retention: 82.1 },
  { month: 'Feb', newUsers: 685, conversion: 5.1, retention: 82.8 },
  { month: 'Mar', newUsers: 742, conversion: 5.4, retention: 83.5 },
  { month: 'Apr', newUsers: 815, conversion: 5.7, retention: 84.3 },
  { month: 'May', newUsers: 894, conversion: 6.1, retention: 84.8 },
  { month: 'Jun', newUsers: 960, conversion: 6.4, retention: 85.2 },
];

export const regionalPerformance = [
  { region: 'São Paulo', users: 1450, revenue: 520000, growth: 16.8 },
  { region: 'Rio de Janeiro', users: 780, revenue: 280000, growth: 12.4 },
  { region: 'Minas Gerais', users: 420, revenue: 150000, growth: 14.7 },
  { region: 'Bahia', users: 280, revenue: 100000, growth: 18.2 },
  { region: 'Other Regions', users: 286, revenue: 150000, growth: 15.3 },
];

export const campaignEffectiveness = [
  { campaign: 'Saúde para Todos', reach: 125000, conversions: 3750, cpa: 14.6, roi: 4.2 },
  { campaign: 'Bem-estar Familiar', reach: 95000, conversions: 2850, cpa: 15.2, roi: 4.0 },
  { campaign: 'Promoção Anual', reach: 75000, conversions: 2250, cpa: 16.8, roi: 3.7 },
  { campaign: 'Indicação Premiada', reach: 60000, conversions: 2100, cpa: 12.1, roi: 5.2 },
  { campaign: 'Plano Empresarial', reach: 40000, conversions: 1200, cpa: 18.5, roi: 3.4 },
];

export const insights = [
  'Mobile adoption is significantly higher in Brazil (80%) compared to other markets',
  'Customer satisfaction has shown notable improvement, rising 0.5 points after Portuguese language optimization',
  'The "Indicação Premiada" referral program shows exceptional ROI at 5.2, outperforming all other campaigns',
  'São Paulo region drives 43% of total revenue with continued strong growth',
  'ID Card feature has highest usage, indicating strong adoption of digital membership credentials',
];

export const recommendations = [
  'Increase investment in the "Indicação Premiada" referral program by 30% to capitalize on high ROI',
  'Develop location-specific features for São Paulo market to strengthen leadership position',
  'Implement targeted Portuguese language tutorials for wellness features to boost adoption',
  'Launch a dedicated retention campaign in regions with lower retention rates',
  'Introduce Brazil-specific health content to drive deeper platform engagement',
];