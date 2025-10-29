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
  Zap,
  FileText,
  LineChart,
  Link2,
  CheckSquare,
  ClipboardCheck,
  Ticket,
  FolderUp,
  LayoutDashboard,
  Target,
  DollarSign,
  MessageSquare,
  ShoppingCart,
  Headphones,
  PieChart,
  Briefcase,
  Globe
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
  roles?: ('ceo' | 'cto' | 'admin' | 'staff')[];
  badge?: string;
}

export const categories: Record<string, string> = {
  main: 'Dashboard',
  analytics: 'Analytics & Insights',
  reporting: 'Department Reporting',
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
  { id: 'ceo-home', label: 'Executive Overview', path: '/ceod/home', icon: LayoutDashboard, category: 'executive', roles: ['ceo'] },
  {
    id: 'ceo-analytics',
    label: 'Analytics',
    path: '/ceod/analytics',
    icon: BarChart3,
    category: 'analytics',
    roles: ['ceo'],
    submenu: [
      { id: 'ceo-analytics-overview', label: 'Analytics Overview', path: '/ceod/analytics/overview', icon: BarChart3 },
      { id: 'ceo-analytics-engagement', label: 'Member Engagement', path: '/ceod/analytics/member-engagement', icon: Users },
      { id: 'ceo-analytics-retention', label: 'Member Retention', path: '/ceod/analytics/member-retention', icon: TrendingDown },
      { id: 'ceo-analytics-advisor', label: 'Advisor Performance', path: '/ceod/analytics/advisor-performance', icon: Award },
      { id: 'ceo-analytics-marketing', label: 'Marketing Analytics', path: '/ceod/analytics/marketing', icon: Target }
    ]
  },
  {
    id: 'ceo-marketing',
    label: 'Marketing',
    path: '/ceod/marketing',
    icon: Target,
    category: 'marketing',
    roles: ['ceo'],
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
    roles: ['ceo'],
    submenu: [
      { id: 'ceo-concierge-tracking', label: 'Concierge Tracking', path: '/ceod/concierge/tracking', icon: Activity },
      { id: 'ceo-concierge-notes', label: 'Concierge Notes', path: '/ceod/concierge/notes', icon: FileText }
    ]
  },
  { id: 'ceo-sales', label: 'Sales Reports', path: '/ceod/sales/reports', icon: ShoppingCart, category: 'sales', roles: ['ceo'] },
  {
    id: 'ceo-operations',
    label: 'Operations',
    path: '/ceod/operations/overview',
    icon: Activity,
    category: 'operations',
    roles: ['ceo'],
    submenu: [
      { id: 'ceo-operations-dashboard', label: 'Operations Dashboard', path: '/ceod/operations/overview', icon: LayoutDashboard },
      { id: 'ceo-operations-tracking', label: 'Operations Tracking', path: '/ceod/operations/tracking', icon: Activity }
    ]
  },
  {
    id: 'ceo-finance',
    label: 'Finance',
    path: '/ceod/finance/overview',
    icon: DollarSign,
    category: 'finance',
    roles: ['ceo'],
    submenu: [
      { id: 'ceo-finance-snapshot', label: 'Finance Snapshot', path: '/ceod/finance/overview', icon: DollarSign },
      { id: 'ceo-finance-details', label: 'Finance Details', path: '/ceod/finance', icon: PieChart }
    ]
  },
  { id: 'ceo-saudemax', label: 'SaudeMAX Reports', path: '/ceod/saudemax/reports', icon: Headphones, category: 'operations', roles: ['ceo'] },
  {
    id: 'ceo-department-data',
    label: 'Department Data',
    path: '/ceod/data',
    icon: Database,
    category: 'departments',
    roles: ['ceo'],
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
  { id: 'ceo-board', label: 'Board Packet', path: '/ceod/board', icon: Briefcase, category: 'executive', roles: ['ceo'] },
  { id: 'ceo-files', label: 'Files & Documents', path: '/ceod/files', icon: FileText, category: 'executive', roles: ['ceo'] },
];

export const ctoNavigationItems: NavItem[] = [
  { id: 'overview', label: 'Overview', path: '/ctod/home', icon: Building2, category: 'main', roles: ['cto', 'admin', 'staff'] },
  { id: 'analytics', label: 'Analytics', path: '/ceod/analytics/overview', icon: BarChart3, category: 'analytics', roles: ['cto', 'admin', 'staff'] },
  { id: 'member-engagement', label: 'Member Engagement', path: '/ceod/analytics/member-engagement', icon: Users, category: 'analytics', roles: ['cto', 'admin', 'staff'] },
  { id: 'member-retention', label: 'Member Retention', path: '/ceod/analytics/member-retention', icon: TrendingDown, category: 'analytics', roles: ['cto', 'admin', 'staff'] },
  { id: 'advisor-performance', label: 'Advisor Performance', path: '/ceod/analytics/advisor-performance', icon: Award, category: 'analytics', roles: ['cto', 'admin', 'staff'] },
  { id: 'marketing-analytics', label: 'Marketing Analytics', path: '/ceod/analytics/marketing', icon: LineChart, category: 'analytics', roles: ['cto', 'admin', 'staff'] },
  {
    id: 'department-reporting',
    label: 'Department Reporting',
    icon: FolderUp,
    category: 'reporting',
    path: '/ceod/data',
    roles: ['cto', 'admin', 'staff'],
    submenu: [
      { id: 'department-reporting/concierge', label: 'Concierge', path: '/ceod/departments/concierge' },
      { id: 'department-reporting/sales', label: 'Sales', path: '/ceod/departments/sales' },
      { id: 'department-reporting/operations', label: 'Operations', path: '/ceod/departments/operations' },
      { id: 'department-reporting/finance', label: 'Finance', path: '/ceod/departments/finance' },
      { id: 'department-reporting/saudemax', label: 'SaudeMAX', path: '/ceod/departments/saudemax' },
    ]
  },
  { id: 'tech-stack', label: 'Tech Stack', icon: Code2, category: 'development', path: '/tech-stack', roles: ['cto', 'admin', 'staff'] },
  { id: 'quick-links', label: 'QuickLinks Directory', icon: Link2, category: 'development', path: '/quick-links', roles: ['cto', 'admin', 'staff'] },
  { id: 'roadmap', label: 'Roadmap', icon: Calendar, category: 'development', path: '/roadmap', roles: ['cto', 'admin', 'staff'] },
  { id: 'road-visualizer', label: 'Roadmap Visualizer', icon: Map, category: 'development', path: '/road-visualizer', roles: ['cto', 'admin', 'staff'] },
  { id: 'roadmap-presentation', label: 'Roadmap Presentation', icon: Presentation, category: 'development', path: '/roadmap-presentation', roles: ['cto', 'admin', 'staff'] },
  { id: 'projects', label: 'Projects', icon: FolderKanban, category: 'development', path: '/projects', roles: ['cto', 'admin', 'staff'] },
  { id: 'monday-tasks', label: 'Monday Tasks', icon: Zap, category: 'development', path: '/monday-tasks', roles: ['cto', 'admin', 'staff'] },
  { id: 'assignments', label: 'Assignments', icon: CheckSquare, category: 'development', path: '/assignments', roles: ['cto', 'admin', 'staff'] },
  { id: 'notepad', label: 'Notepad', icon: StickyNote, category: 'development', path: '/notepad', roles: ['cto', 'admin', 'staff'] },
  {
    id: 'compliance',
    label: 'Compliance Command Center',
    icon: ShieldCheck,
    category: 'operations',
    path: '/ctod/compliance/dashboard',
    roles: ['cto', 'admin', 'staff'],
    submenu: [
      { id: 'compliance/command-center', label: 'Dashboard', path: '/ctod/compliance/dashboard' },
      { id: 'compliance/administration', label: 'Administration & Governance', path: '/ctod/compliance/administration' },
      { id: 'compliance/training', label: 'Training & Awareness', path: '/ctod/compliance/training' },
      { id: 'compliance/phi-minimum', label: 'PHI & Minimum Necessary', path: '/ctod/compliance/phi-minimum' },
      { id: 'compliance/technical-safeguards', label: 'Technical Safeguards', path: '/ctod/compliance/technical-safeguards' },
      { id: 'compliance/baas', label: 'Business Associates', path: '/ctod/compliance/baas' },
      { id: 'compliance/incidents', label: 'Incidents & Breaches', path: '/ctod/compliance/incidents' },
      { id: 'compliance/audits', label: 'Audits & Monitoring', path: '/ctod/compliance/audits' },
      { id: 'compliance/templates-tools', label: 'Templates & Tools', path: '/ctod/compliance/templates-tools' },
      { id: 'compliance/employee-documents', label: 'Employee Documents', path: '/ctod/compliance/employee-documents' },
    ]
  },
  { id: 'saas', label: 'SaaS Spend', icon: Database, category: 'operations', path: '/shared/saas', roles: ['cto', 'admin', 'staff'] },
  { id: 'ai-agents', label: 'AI Agents', icon: Cpu, category: 'operations', path: '/shared/ai-agents', roles: ['cto', 'admin', 'staff'] },
  { id: 'it-support', label: 'IT Support Tickets', icon: Ticket, category: 'operations', path: '/shared/it-support', roles: ['cto', 'admin', 'staff'] },
  { id: 'integrations', label: 'Integrations Hub', icon: Settings, category: 'operations', path: '/shared/integrations', roles: ['cto', 'admin', 'staff'] },
  { id: 'deployments', label: 'Deployments', icon: UploadCloud, category: 'infrastructure', path: '/shared/deployments', roles: ['cto', 'admin', 'staff'] },
  { id: 'policy-management', label: 'Policy Manager', icon: FileText, category: 'operations', path: '/shared/policy-management', roles: ['cto', 'admin', 'staff'] },
  { id: 'employee-performance', label: 'Employee Performance', icon: ClipboardCheck, category: 'operations', path: '/shared/employee-performance', roles: ['cto', 'admin', 'staff'] },
  { id: 'api-status', label: 'API Status', icon: Activity, category: 'infrastructure', path: '/shared/api-status', roles: ['cto', 'admin', 'staff'] },
  { id: 'system-uptime', label: 'System Uptime', icon: Server, category: 'infrastructure', path: '/shared/system-uptime', roles: ['cto', 'admin', 'staff'] },
  { id: 'performance-evaluation', label: 'Performance Evaluation', icon: UserSquare2, category: 'operations', path: '/shared/performance-evaluation', roles: ['cto', 'admin', 'staff'] },
  { id: 'organizational-structure', label: 'Organization', icon: GitBranch, category: 'operations', path: '/shared/organizational-structure', roles: ['cto', 'admin', 'staff'] },
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

export function getNavigationForRole(role: 'ceo' | 'cto' | 'admin' | 'staff'): NavItem[] {
  if (role === 'ceo') {
    return ceoNavigationItems;
  }
  return ctoNavigationItems;
}
