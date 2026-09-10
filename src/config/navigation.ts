import {
  ShieldCheck,
  Activity,
  BarChart3,
  Users,
  Award,
  Settings,
  FileText,
  LineChart,
  LayoutDashboard,
  LayoutGrid,
  Code2,
  Mail,
  Briefcase,
  Wallet,
  Ticket,
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
  roles?: string[];
  badge?: string;
  requires?: 'tickets' | 'traffic';
}

export const categories: Record<string, string> = {
  main: 'Command',
  finance: 'Finance',
  analytics: 'Analytics',
  crm: 'Relationships',
  development: 'Development',
  operations: 'Operations',
};

export const cosNavigationItems: NavItem[] = [
  { id: 'home', label: 'Home', path: '/home', icon: LayoutDashboard, category: 'main' },
  { id: 'organizer', label: 'Organizer', path: '/organizer', icon: LayoutGrid, category: 'main' },
  { id: 'inbox', label: 'Inbox', path: '/inbox', icon: Mail, category: 'main' },
  { id: 'crm', label: 'CRM', path: '/crm', icon: Briefcase, category: 'crm' },
  {
    id: 'finance',
    label: 'Finance',
    path: '/finance',
    icon: Wallet,
    category: 'finance',
    submenu: [
      { id: 'finance-pnl', label: 'P&L', path: '/finance' },
      { id: 'finance-vendors', label: 'Vendors', path: '/finance/vendors' },
      { id: 'finance-forecast', label: 'Forecasts', path: '/finance/forecast' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/enrollments',
    icon: BarChart3,
    category: 'analytics',
    submenu: [
      { id: 'enrollments', label: 'Enrollment', path: '/enrollments', icon: Users },
      { id: 'advisors', label: 'Advisors', path: '/advisors', icon: Award },
      { id: 'pipeline', label: 'Pipeline', path: '/pipeline', icon: LineChart },
      { id: 'tickets', label: 'Support', path: '/tickets', icon: Ticket },
      { id: 'website', label: 'Website', path: '/analytics/website', icon: LineChart },
    ],
  },
  {
    id: 'development',
    label: 'Development',
    path: '/development',
    icon: Code2,
    category: 'development',
    submenu: [
      { id: 'dev-overview', label: 'Overview', path: '/development' },
      { id: 'tech-stack', label: 'Tech Stack', path: '/development/tech-stack' },
      { id: 'quicklinks', label: 'Quick Links', path: '/development/quicklinks' },
      { id: 'roadmap', label: 'Roadmap', path: '/development/roadmap' },
      { id: 'roadmap-visualizer', label: 'Visualizer', path: '/development/roadmap-visualizer' },
      { id: 'projects', label: 'Projects', path: '/development/projects' },
      { id: 'assignments', label: 'Assignments', path: '/development/assignments' },
      { id: 'notepad', label: 'Notepad', path: '/development/notepad' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    path: '/operations',
    icon: Activity,
    category: 'operations',
    submenu: [
      { id: 'ops-overview', label: 'Overview', path: '/operations' },
      { id: 'ops-compliance', label: 'Compliance', path: '/operations/compliance', icon: ShieldCheck },
      { id: 'ops-saas', label: 'SaaS Spend', path: '/operations/saas-spend' },
      { id: 'ops-integrations', label: 'Integrations', path: '/operations/integrations' },
      { id: 'ops-policy', label: 'Policy', path: '/operations/policy-manager' },
      { id: 'ops-org', label: 'Organization', path: '/operations/organization' },
      { id: 'ops-deployments', label: 'Deployments', path: '/operations/infrastructure/deployments' },
    ],
  },
  { id: 'files', label: 'Files', path: '/files', icon: FileText, category: 'main' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings, category: 'main' },
];

export const ceoNavigationItems = cosNavigationItems;
export const ctoNavigationItems = cosNavigationItems;
export const advisorNavigationItems = cosNavigationItems;

export function buildRouteToTabMap(items: NavItem[]): Record<string, string> {
  const map: Record<string, string> = {};
  items.forEach((item) => {
    map[item.path] = item.id;
    item.submenu?.forEach((sub) => {
      map[sub.path] = sub.id;
    });
  });
  return map;
}

export function buildTabToRouteMap(items: NavItem[]): Record<string, string> {
  const map: Record<string, string> = {};
  items.forEach((item) => {
    map[item.id] = item.path;
    item.submenu?.forEach((sub) => {
      map[sub.id] = sub.path;
    });
  });
  return map;
}

export function getNavigationForRole(
  _role?: string,
  flags?: { tickets?: boolean; traffic?: boolean },
): NavItem[] {
  return cosNavigationItems.map((item) => {
    if (item.id !== 'analytics') return item;
    return {
      ...item,
      submenu: item.submenu?.filter((sub) => {
        if (sub.id === 'tickets') return Boolean(flags?.tickets);
        if (sub.id === 'website') return Boolean(flags?.traffic);
        return true;
      }),
    };
  });
}
