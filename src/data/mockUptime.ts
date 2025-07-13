export const uptimeKPIs = [
  { title: 'Current Uptime', value: '99.98%', change: '+0.02%', trend: 'up' },
  { title: 'Incidents (30d)', value: '2', change: '-50%', trend: 'down' },
  { title: 'Avg. Response Time', value: '142ms', change: '-8ms', trend: 'down' },
  { title: 'Longest Outage', value: '12 min', change: 'Dec 15', trend: 'stable' },
];

export const uptimeTimeline = [
  { date: '12/01', uptime: 99.95, incidents: 0 },
  { date: '12/02', uptime: 99.98, incidents: 0 },
  { date: '12/03', uptime: 99.97, incidents: 0 },
  { date: '12/04', uptime: 99.99, incidents: 0 },
  { date: '12/05', uptime: 99.96, incidents: 0 },
  { date: '12/06', uptime: 99.98, incidents: 0 },
  { date: '12/07', uptime: 99.97, incidents: 0 },
  { date: '12/08', uptime: 99.99, incidents: 0 },
  { date: '12/09', uptime: 99.95, incidents: 0 },
  { date: '12/10', uptime: 99.98, incidents: 0 },
  { date: '12/11', uptime: 99.97, incidents: 0 },
  { date: '12/12', uptime: 99.99, incidents: 0 },
  { date: '12/13', uptime: 99.96, incidents: 0 },
  { date: '12/14', uptime: 99.98, incidents: 0 },
  { date: '12/15', uptime: 99.80, incidents: 1 }, // Outage day
  { date: '12/16', uptime: 99.97, incidents: 0 },
  { date: '12/17', uptime: 99.98, incidents: 0 },
  { date: '12/18', uptime: 99.99, incidents: 0 },
  { date: '12/19', uptime: 99.97, incidents: 0 },
  { date: '12/20', uptime: 99.98, incidents: 0 },
];

export const systemComponents = [
  { name: 'MPB Core API', status: 'Healthy', uptime: 99.98, responseTime: 142 },
  { name: 'E123 System', status: 'Healthy', uptime: 99.97, responseTime: 89 },
  { name: 'Member Portal', status: 'Healthy', uptime: 99.99, responseTime: 156 },
  { name: 'Database Cluster', status: 'Warning', uptime: 99.95, responseTime: 234 },
  { name: 'Payment Gateway', status: 'Healthy', uptime: 99.98, responseTime: 178 },
];