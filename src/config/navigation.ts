import {
  Code2,
  UserSquare2,
  Calendar,
  FolderKanban,
  ShieldCheck,
  Database,
  Cpu,
  UploadCloud,
  Activity,
  Building2,
  BarChart3,
  Users,
  TrendingDown,
  Award,
  Server,
  GitBranch,
  Map,
  Settings,
  Presentation,
  StickyNote,
  FileText,
  LineChart,
  Link2,
  CheckSquare,
  ClipboardCheck,
  Ticket,
  LayoutDashboard,
  LayoutGrid,
  Target,
  DollarSign,
  MessageSquare,
  ShoppingCart,
  Headphones,
  PieChart,
  Briefcase,
  Globe,
  Command,
  Upload
} from 'lucide-react';

export interface NavSubItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  submenu?: NavSubItem[];
  roles?: ('ceo' | 'cto' | 'admin' | 'staff' | 'cfo' | 'cmo' | 'manager' | 'member')[];
  badge?: string;
}

export const categories: Record<string, string> = {
  main: 'Dashboard',
  analytics: 'Analytics & Insights',
  development: 'Development & Planning',
  operations: 'Operations & Management',
  infrastructure: 'Infrastructure & Monitoring',
  executive: 'Executive',
  marketing: 'Marketing',
  concierge: 'Concierge',
  sales: 'Sales',
  finance: 'Finance',
  departments: 'Department Data'
};

export const ceoNavigationItems: NavItem[] = [
  { id: 'ceo-home', label: 'Executive Overview', path: '/ceod/home', icon: LayoutDashboard, category: 'executive', roles: ['ceo', 'cfo', 'cmo', 'admin'] },
  { id: 'ceo-daily-organizer', label: 'Daily Organizer', path: '/ceod/organizer', icon: LayoutGrid, category: 'executive', roles: ['ceo', 'cfo', 'cmo', 'admin'], badge: 'New' },

  {
    id: 'ceo-analytics',
    label: 'Analytics',
    path: '/ceod/analytics',
    icon: BarChart3,
    category: 'analytics',
    roles: ['ceo', 'admin'],
    submenu: [
      { id: 'ceo-analytics-overview', label: 'Analytics Overview', path: '/ceod/analytics/overview', icon: BarChart3 },
      { id: 'ceo-website-analytics', label: 'Website Analytics', path: '/ceod/analytics/website', icon: Globe },
      { id: 'ceo-analytics-engagement', label: 'Member Engagement', path: '/ceod/analytics/member-engagement', icon: Users },
      { id: 'ceo-analytics-retention', label: 'Member Retention', path: '/ceod/analytics/member-retention', icon: TrendingDown },
      { id: 'ceo-analytics-advisor', label: 'Advisor Performance', path: '/ceod/analytics/advisor-performance', icon: Award },
      { id: 'ceo-analytics-marketing', label: 'Marketing Analytics', path: '/ceod/analytics/marketing', icon: Target }
    ]
  },

  {
    id: 'ceo-development',
    label: 'Development & Planning',
    path: '/ceod/development',
    icon: Code2,
    category: 'development',
    roles: ['ceo', 'admin'],
    submenu: [
      { id: 'ceo-dev-overview', label: 'Development Overview', path: '/ceod/development', icon: Code2 },
      { id: 'ceo-tech-stack', label: 'Tech Stack', path: '/ceod/development/tech-stack', icon: Code2 },
      { id: 'ceo-quick-links', label: 'QuickLinks Directory', path: '/ceod/development/quicklinks', icon: Link2 },
      { id: 'ceo-roadmap', label: 'Roadmap', path: '/ceod/development/roadmap', icon: Calendar },
      { id: 'ceo-roadmap-visualizer', label: 'Roadmap Visualizer', path: '/ceod/development/roadmap-visualizer', icon: Map },
      { id: 'ceo-roadmap-presentation', label: 'Roadmap Presentation', path: '/ceod/development/roadmap-presentation', icon: Presentation },
      { id: 'ceo-projects', label: 'Projects', path: '/ceod/development/projects', icon: FolderKanban },
      { id: 'ceo-assignments', label: 'Assignments', path: '/ceod/development/assignments', icon: CheckSquare },
      { id: 'ceo-notepad', label: 'Notepad', path: '/ceod/development/notepad', icon: StickyNote }
    ]
  },

  {
    id: 'ceo-marketing',
    label: 'Marketing',
    path: '/ceod/marketing',
    icon: Target,
    category: 'marketing',
    roles: ['ceo', 'admin'],
    submenu: [
      { id: 'ceo-marketing-dashboard', label: 'Marketing Dashboard', path: '/ceod/marketing', icon: Target },
      { id: 'ceo-marketing-planner', label: 'Marketing Planner', path: '/ceod/marketing/planner', icon: FileText },
      { id: 'ceo-marketing-calendar', label: 'Content Calendar', path: '/ceod/marketing/calendar', icon: LayoutDashboard },
      { id: 'ceo-marketing-budget', label: 'Marketing Budget', path: '/ceod/marketing/budget', icon: DollarSign }
    ]
  },

  {
    id: 'ceo-concierge',
    label: 'Concierge',
    path: '/ceod/concierge/tracking',
    icon: MessageSquare,
    category: 'concierge',
    roles: ['ceo', 'admin'],
    submenu: [
      { id: 'ceo-concierge-tracking', label: 'Concierge Tracking', path: '/ceod/concierge/tracking', icon: Activity },
      { id: 'ceo-concierge-notes', label: 'Concierge Notes', path: '/ceod/concierge/notes', icon: FileText },
      { id: 'ceo-concierge-reports', label: 'Tracking Reports', path: '/ceod/concierge/reports', icon: BarChart3 }
    ]
  },

  { id: 'ceo-sales', label: 'Sales Reports', path: '/ceod/sales/reports', icon: ShoppingCart, category: 'sales', roles: ['ceo', 'admin'] },

  { id: 'ceo-staff-management', label: 'Staff Management', path: '/ceod/staff', icon: Users, category: 'operations', roles: ['ceo', 'admin'] },

  {
    id: 'ceo-operations',
    label: 'Operations',
    path: '/ceod/operations',
    icon: Activity,
    category: 'operations',
    roles: ['ceo', 'admin'],
    submenu: [
      { id: 'ceo-operations-dashboard', label: 'Operations Dashboard', path: '/ceod/operations/overview', icon: LayoutDashboard },
      { id: 'ceo-operations-tracking', label: 'Operations Tracking', path: '/ceod/operations/tracking', icon: Activity },
      { id: 'ceo-compliance', label: 'Compliance Command Center', path: '/ceod/operations/compliance', icon: ShieldCheck },
      { id: 'ceo-saas-spend', label: 'SaaS Spend', path: '/ceod/operations/saas-spend', icon: Database },
      { id: 'ceo-ai-agents', label: 'AI Agents', path: '/ceod/operations/ai-agents', icon: Cpu },
      { id: 'ceo-it-support', label: 'IT Support Tickets', path: '/ceod/operations/it-support', icon: Ticket },
      { id: 'ceo-integrations', label: 'Integrations Hub', path: '/ceod/operations/integrations', icon: Settings },
      { id: 'ceo-policy', label: 'Policy Manager', path: '/ceod/operations/policy-manager', icon: FileText },
      { id: 'ceo-emp-performance', label: 'Employee Performance', path: '/ceod/operations/employee-performance', icon: ClipboardCheck },
      { id: 'ceo-perf-eval', label: 'Performance Evaluation', path: '/ceod/operations/performance-evaluation', icon: UserSquare2 },
      { id: 'ceo-org-structure', label: 'Organization', path: '/ceod/operations/organization', icon: GitBranch }
    ]
  },

  {
    id: 'ceo-finance',
    label: 'Finance',
    path: '/ceod/finance/overview',
    icon: DollarSign,
    category: 'finance',
    roles: ['ceo', 'admin'],
    submenu: [
      { id: 'ceo-finance-snapshot', label: 'Finance Snapshot', path: '/ceod/finance/overview', icon: DollarSign },
      { id: 'ceo-finance-details', label: 'Finance Details', path: '/ceod/finance', icon: PieChart }
    ]
  },

  { id: 'ceo-saudemax', label: 'SaudeMAX Reports', path: '/ceod/saudemax/reports', icon: Headphones, category: 'operations', roles: ['ceo', 'admin'] },

  {
    id: 'ceo-department-data',
    label: 'Department Data',
    path: '/ceod/data',
    icon: Database,
    category: 'departments',
    roles: ['ceo', 'admin'],
    submenu: [
      { id: 'ceo-data-management', label: 'Data Management', path: '/ceod/data', icon: Database },
      { id: 'ceo-department-upload', label: 'Department Upload', path: '/ceod/upload', icon: UploadCloud },
      { id: 'ceo-upload-portal', label: 'Upload Portal', path: '/ceod/upload-portal', icon: UploadCloud },
      { id: 'ceo-dept-concierge', label: 'Concierge Dept', path: '/ceod/departments/concierge', icon: MessageSquare },
      { id: 'ceo-dept-sales', label: 'Sales Dept', path: '/ceod/departments/sales', icon: ShoppingCart },
      { id: 'ceo-dept-operations', label: 'Operations Dept', path: '/ceod/departments/operations', icon: Activity },
      { id: 'ceo-dept-finance', label: 'Finance Dept', path: '/ceod/departments/finance', icon: DollarSign },
      { id: 'ceo-dept-saudemax', label: 'SaudeMAX Dept', path: '/ceod/departments/saudemax', icon: Headphones }
    ]
  },

  { id: 'ceo-board', label: 'Board Packet', path: '/ceod/board', icon: Briefcase, category: 'executive', roles: ['ceo', 'admin'] },
  { id: 'ceo-files', label: 'Files & Documents', path: '/ceod/files', icon: FileText, category: 'executive', roles: ['ceo', 'admin'] },
];

export const ctoNavigationItems: NavItem[] = [
  { id: 'cto-home', label: 'CTO Overview', path: '/ctod/home', icon: Building2, category: 'main', roles: ['cto', 'admin'] },
  { id: 'cto-daily-organizer', label: 'Daily Organizer', path: '/ctod/organizer', icon: LayoutGrid, category: 'main', roles: ['cto', 'admin', 'staff', 'manager'], badge: 'New' },
  { id: 'cto-files', label: 'Files & Documents', path: '/ctod/files', icon: FileText, category: 'main', roles: ['cto', 'admin', 'staff'] },

  {
    id: 'cto-analytics',
    label: 'Analytics',
    path: '/ctod/analytics',
    icon: BarChart3,
    category: 'analytics',
    roles: ['cto', 'admin', 'staff'],
    submenu: [
      { id: 'cto-analytics-overview', label: 'Analytics Overview', path: '/ctod/analytics/overview', icon: BarChart3 },
      { id: 'cto-website-analytics', label: 'Website Analytics', path: '/ctod/analytics/website', icon: Globe },
      { id: 'cto-member-engagement', label: 'Member Engagement', path: '/ctod/analytics/member-engagement', icon: Users },
      { id: 'cto-member-retention', label: 'Member Retention', path: '/ctod/analytics/member-retention', icon: TrendingDown },
      { id: 'cto-advisor-performance', label: 'Advisor Performance', path: '/ctod/analytics/advisor-performance', icon: Award },
      { id: 'cto-marketing-analytics', label: 'Marketing Analytics', path: '/ctod/analytics/marketing', icon: LineChart }
    ]
  },

  {
    id: 'cto-development',
    label: 'Development & Planning',
    icon: Code2,
    category: 'development',
    path: '/ctod/development',
    roles: ['cto', 'admin', 'staff'],
    submenu: [
      { id: 'cto-dev-overview', label: 'Development Overview', path: '/ctod/development' },
      { id: 'cto-tech-stack', label: 'Tech Stack', path: '/ctod/development/tech-stack' },
      { id: 'cto-quick-links', label: 'QuickLinks Directory', path: '/ctod/development/quicklinks' },
      { id: 'cto-roadmap', label: 'Roadmap', path: '/ctod/development/roadmap' },
      { id: 'cto-roadmap-visualizer', label: 'Roadmap Visualizer', path: '/ctod/development/roadmap-visualizer' },
      { id: 'cto-roadmap-presentation', label: 'Roadmap Presentation', path: '/ctod/development/roadmap-presentation' },
      { id: 'cto-projects', label: 'Projects', path: '/ctod/development/projects' },
      { id: 'cto-monday-tasks', label: 'Monday Tasks', path: '/ctod/development/monday-tasks' },
      { id: 'cto-assignments', label: 'Assignments', path: '/ctod/development/assignments' },
      { id: 'cto-notepad', label: 'Notepad', path: '/ctod/development/notepad' }
    ]
  },

  {
    id: 'cto-compliance',
    label: 'Compliance Command Center',
    icon: ShieldCheck,
    category: 'operations',
    path: '/ctod/compliance',
    roles: ['cto', 'admin', 'staff'],
    submenu: [
      { id: 'cto-compliance-dashboard', label: 'Dashboard', path: '/ctod/compliance/dashboard' },
      { id: 'cto-compliance-administration', label: 'Administration & Governance', path: '/ctod/compliance/administration' },
      { id: 'cto-compliance-training', label: 'Training & Awareness', path: '/ctod/compliance/training' },
      { id: 'cto-compliance-phi', label: 'PHI & Minimum Necessary', path: '/ctod/compliance/phi-minimum' },
      { id: 'cto-compliance-technical', label: 'Technical Safeguards', path: '/ctod/compliance/technical-safeguards' },
      { id: 'cto-compliance-baas', label: 'Business Associates', path: '/ctod/compliance/baas' },
      { id: 'cto-compliance-incidents', label: 'Incidents & Breaches', path: '/ctod/compliance/incidents' },
      { id: 'cto-compliance-audits', label: 'Audits & Monitoring', path: '/ctod/compliance/audits' },
      { id: 'cto-compliance-templates', label: 'Templates & Tools', path: '/ctod/compliance/templates-tools' },
      { id: 'cto-compliance-employee-docs', label: 'Employee Documents', path: '/ctod/compliance/employee-documents' }
    ]
  },

  { id: 'cto-staff-management', label: 'Staff Management', path: '/ctod/staff', icon: Users, category: 'operations', roles: ['cto', 'admin', 'staff'] },

  {
    id: 'cto-operations',
    label: 'Operations Management',
    icon: Activity,
    category: 'operations',
    path: '/ctod/operations',
    roles: ['cto', 'admin', 'staff'],
    submenu: [
      { id: 'cto-operations-overview', label: 'Operations Overview', path: '/ctod/operations' },
      { id: 'cto-saas-spend', label: 'SaaS Spend', path: '/ctod/operations/saas-spend' },
      { id: 'cto-ai-agents', label: 'AI Agents', path: '/ctod/operations/ai-agents' },
      { id: 'cto-it-support', label: 'IT Support Tickets', path: '/ctod/operations/it-support' },
      { id: 'cto-integrations', label: 'Integrations Hub', path: '/ctod/operations/integrations' },
      { id: 'cto-policy-management', label: 'Policy Manager', path: '/ctod/operations/policy-manager' },
      { id: 'cto-employee-performance', label: 'Employee Performance', path: '/ctod/operations/employee-performance' },
      { id: 'cto-performance-evaluation', label: 'Performance Evaluation', path: '/ctod/operations/performance-evaluation' },
      { id: 'cto-organization', label: 'Organization', path: '/ctod/operations/organization' }
    ]
  },

  {
    id: 'cto-infrastructure',
    label: 'Infrastructure',
    icon: Server,
    category: 'infrastructure',
    path: '/ctod/infrastructure',
    roles: ['cto', 'admin', 'staff'],
    submenu: [
      { id: 'cto-deployments', label: 'Deployments', path: '/ctod/infrastructure/deployments' },
      { id: 'cto-api-status', label: 'API Status', path: '/ctod/infrastructure/api-status' },
      { id: 'cto-system-uptime', label: 'System Uptime', path: '/ctod/infrastructure/system-uptime' }
    ]
  }
];

export function buildRouteToTabMap(items: NavItem[]): Record<string, string> {
  const map: Record<string, string> = {};

  items.forEach(item => {
    map[item.path] = item.id;

    if (item.submenu) {
      item.submenu.forEach(sub => {
        map[sub.path] = sub.id;
      });
    }
  });

  return map;
}

export function buildTabToRouteMap(items: NavItem[]): Record<string, string> {
  const map: Record<string, string> = {};

  items.forEach(item => {
    map[item.id] = item.path;

    if (item.submenu) {
      item.submenu.forEach(sub => {
        map[sub.id] = sub.path;
      });
    }
  });

  return map;
}

// Advisor Navigation Items
export const advisorNavigationItems: NavItem[] = [
  {
    id: 'advisor-command-center',
    label: 'Command Center',
    path: '/advisor/command-center',
    icon: Command,
    category: 'main',
    roles: ['admin', 'staff'],
    submenu: [
      { id: 'advisor-members', label: 'Members', path: '/advisor/command-center?tab=members', icon: Users },
      { id: 'advisor-hierarchy', label: 'Hierarchy', path: '/advisor/command-center?tab=hierarchy', icon: GitBranch },
      { id: 'advisor-analytics', label: 'Analytics', path: '/advisor/command-center?tab=analytics', icon: BarChart3 },
      { id: 'advisor-import', label: 'Import Data', path: '/advisor/command-center?tab=import', icon: Upload }
    ]
  }
];

export function getNavigationForRole(role: string): NavItem[] {
  if (role === 'advisor') {
    return advisorNavigationItems;
  }
  if (['ceo', 'cfo', 'cmo', 'admin'].includes(role)) {
    return ceoNavigationItems;
  }
  return ctoNavigationItems;
}
