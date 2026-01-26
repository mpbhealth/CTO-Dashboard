/**
 * Platform Presentation Data Configuration
 *
 * This file contains types and default data for the Platform Presentation slides.
 * Data can be customized via the presentation editor and persisted to localStorage.
 */

// Icon name type for Lucide icons
export type IconName =
  | 'Users' | 'Briefcase' | 'UserCog' | 'Building2' | 'Globe' | 'Smartphone'
  | 'LayoutDashboard' | 'Ticket' | 'FileText' | 'Stethoscope' | 'Monitor'
  | 'ClipboardList' | 'CreditCard' | 'Lock' | 'Cpu' | 'Mail' | 'CalendarCheck'
  | 'FileKey' | 'Workflow' | 'Activity' | 'Link2' | 'Database' | 'RefreshCw'
  | 'Shield' | 'Zap' | 'CheckCircle2' | 'Clock' | 'AlertTriangle' | 'Target'
  | 'Upload' | 'ArrowLeftRight' | 'ArrowRight' | 'Network' | 'Layers' | 'Boxes';

// ============================================
// Architecture Slide Types
// ============================================

export interface UserItem {
  id: string;
  icon: IconName;
  label: string;
  color: string;
}

export interface AppItem {
  id: string;
  icon: IconName;
  label: string;
  sublabel?: string;
}

export interface ServiceItem {
  id: string;
  icon: IconName;
  label: string;
  desc: string;
}

export interface TakeawayItem {
  id: string;
  icon: IconName;
  label: string;
  desc: string;
  color: string;
}

export interface ArchitectureConfig {
  users: UserItem[];
  memberApps: AppItem[];
  internalApps: AppItem[];
  services: ServiceItem[];
  partners: string[];
  takeaways: TakeawayItem[];
}

// ============================================
// Data Hub Slide Types
// ============================================

export interface PlatformNode {
  id: string;
  icon: IconName;
  label: string;
  sublabel: string;
  angle: number;
  color: string;
}

export interface VendorItem {
  id: string;
  name: string;
  type: string;
  fileType: string;
}

export interface DataFlowItem {
  id: string;
  label: string;
  direction: 'bidirectional' | 'inbound' | 'outbound';
  color: string;
}

export interface DataHubStats {
  dataConsistency: string;
  tables: string;
  records: string;
  dailyFiles: string;
  successRate: string;
  avgTime: string;
}

export interface DataHubCallout {
  id: string;
  icon: IconName;
  label: string;
  desc: string;
  color: string;
}

export interface DataHubConfig {
  platforms: PlatformNode[];
  dataFlows: DataFlowItem[];
  vendors: VendorItem[];
  stats: DataHubStats;
  callouts: DataHubCallout[];
}

// ============================================
// Evolution Slide Types
// ============================================

export interface EvolutionItem {
  id: string;
  text: string;
  status: 'success' | 'warning' | 'error';
  highlight?: boolean;
}

export interface TransitionSection {
  id: string;
  label: string;
  items: string[];
}

export interface EvolutionCallout {
  type: 'error' | 'info' | 'success';
  text: string;
}

export interface EvolutionColumn {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: IconName;
  iconColor: string;
  items?: EvolutionItem[];
  sections?: TransitionSection[];
  callout: EvolutionCallout;
}

export interface TimelineStep {
  id: string;
  label: string;
  status: 'complete' | 'current' | 'upcoming';
}

export interface EvolutionConfig {
  columns: EvolutionColumn[];
  timeline: TimelineStep[];
  migrationLabel: string;
}

// ============================================
// Master Presentation Config
// ============================================

export interface PresentationConfig {
  architecture: ArchitectureConfig;
  dataHub: DataHubConfig;
  evolution: EvolutionConfig;
}

// ============================================
// Default Data
// ============================================

export const defaultArchitectureConfig: ArchitectureConfig = {
  users: [
    { id: 'user-1', icon: 'Users', label: 'Members', color: 'from-blue-500 to-blue-600' },
    { id: 'user-2', icon: 'Briefcase', label: 'Advisors', color: 'from-purple-500 to-purple-600' },
    { id: 'user-3', icon: 'UserCog', label: 'Employees', color: 'from-emerald-500 to-emerald-600' },
    { id: 'user-4', icon: 'Building2', label: 'Vendors', color: 'from-amber-500 to-amber-600' },
  ],
  memberApps: [
    { id: 'mapp-1', icon: 'Globe', label: 'MPB Health Website', sublabel: '+ Advisor Portal' },
    { id: 'mapp-2', icon: 'Smartphone', label: 'MPB Mobile App', sublabel: 'Member Portal' },
  ],
  internalApps: [
    { id: 'iapp-1', icon: 'LayoutDashboard', label: 'CRM' },
    { id: 'iapp-2', icon: 'Ticket', label: 'IT Support' },
    { id: 'iapp-3', icon: 'FileText', label: 'Enrollment System', sublabel: '"E123 Killer"' },
    { id: 'iapp-4', icon: 'UserCog', label: 'Member Lifecycle Admin' },
    { id: 'iapp-5', icon: 'Stethoscope', label: 'Concierge Dashboard' },
    { id: 'iapp-6', icon: 'Monitor', label: 'Internal Ops Dashboards' },
    { id: 'iapp-7', icon: 'ClipboardList', label: 'Project Management' },
    { id: 'iapp-8', icon: 'CreditCard', label: 'Billing & Finance' },
  ],
  services: [
    { id: 'svc-1', icon: 'Lock', label: 'Unified Login & Roles', desc: 'Security' },
    { id: 'svc-2', icon: 'Cpu', label: 'Unified API', desc: 'Business Rules' },
    { id: 'svc-3', icon: 'Mail', label: 'Messaging Hub', desc: 'Email/SMS/Notifications' },
    { id: 'svc-4', icon: 'CreditCard', label: 'Billing & Payments', desc: 'Transactions' },
    { id: 'svc-5', icon: 'Upload', label: 'Eligibility Transfer', desc: 'EDI/SFTP/API/CSV' },
    { id: 'svc-6', icon: 'CalendarCheck', label: 'Onboarding Orchestrator', desc: 'Member • Vendor • Employee' },
    { id: 'svc-7', icon: 'FileKey', label: 'Documents & Storage', desc: 'Secure Files' },
    { id: 'svc-8', icon: 'Workflow', label: 'Automations', desc: 'Scheduled Jobs' },
    { id: 'svc-9', icon: 'Activity', label: 'Audit & Analytics', desc: 'Monitoring' },
    { id: 'svc-10', icon: 'Link2', label: 'Integrations Layer', desc: 'Webhooks' },
  ],
  partners: ['Vendors', 'TPAs', 'Carriers', 'Agencies', 'Payment Providers'],
  takeaways: [
    { id: 'take-1', icon: 'CheckCircle2', label: 'Consistency', desc: 'One truth across all systems', color: 'from-blue-500 to-blue-600' },
    { id: 'take-2', icon: 'Zap', label: 'Speed', desc: 'Faster delivery with shared services', color: 'from-amber-500 to-orange-500' },
    { id: 'take-3', icon: 'Shield', label: 'Control', desc: 'Central security, auditing, compliance', color: 'from-emerald-500 to-teal-500' },
  ],
};

export const defaultDataHubConfig: DataHubConfig = {
  platforms: [
    { id: 'plat-1', icon: 'Globe', label: 'MPB Website', sublabel: 'Member Portal', angle: 0, color: 'from-blue-500 to-cyan-500' },
    { id: 'plat-2', icon: 'Smartphone', label: 'Mobile App', sublabel: 'iOS & Android', angle: 45, color: 'from-purple-500 to-pink-500' },
    { id: 'plat-3', icon: 'LayoutDashboard', label: 'CRM', sublabel: 'Sales & Support', angle: 90, color: 'from-emerald-500 to-teal-500' },
    { id: 'plat-4', icon: 'Stethoscope', label: 'Concierge', sublabel: 'Member Care', angle: 135, color: 'from-amber-500 to-orange-500' },
    { id: 'plat-5', icon: 'Monitor', label: 'CTO Dashboard', sublabel: 'Operations', angle: 180, color: 'from-indigo-500 to-purple-500' },
    { id: 'plat-6', icon: 'FileText', label: 'Enrollment', sublabel: 'E123 Killer', angle: 225, color: 'from-rose-500 to-pink-500' },
    { id: 'plat-7', icon: 'CreditCard', label: 'Billing', sublabel: 'Payments', angle: 270, color: 'from-green-500 to-emerald-500' },
    { id: 'plat-8', icon: 'Ticket', label: 'IT Support', sublabel: 'Ticketing', angle: 315, color: 'from-sky-500 to-blue-500' },
  ],
  dataFlows: [
    { id: 'flow-1', label: 'Member Profiles', direction: 'bidirectional', color: 'text-blue-400' },
    { id: 'flow-2', label: 'Eligibility', direction: 'outbound', color: 'text-emerald-400' },
    { id: 'flow-3', label: 'Claims', direction: 'inbound', color: 'text-purple-400' },
    { id: 'flow-4', label: 'Payments', direction: 'bidirectional', color: 'text-amber-400' },
  ],
  vendors: [
    { id: 'vendor-1', name: 'Zion Health', type: 'HealthShare', fileType: 'SFTP' },
    { id: 'vendor-2', name: 'Sharewell', type: 'HealthShare', fileType: 'API' },
    { id: 'vendor-3', name: 'Sedera', type: 'HealthShare', fileType: 'CSV' },
    { id: 'vendor-4', name: 'ARM MEC', type: 'MEC', fileType: 'EDI 834' },
    { id: 'vendor-5', name: 'Planstin', type: 'HealthShare', fileType: 'SFTP' },
    { id: 'vendor-6', name: 'GreyStone Risk', type: 'Risk', fileType: 'API' },
  ],
  stats: {
    dataConsistency: '99.9%',
    tables: '150+',
    records: '1M+',
    dailyFiles: '24',
    successRate: '100%',
    avgTime: '<5m',
  },
  callouts: [
    { id: 'callout-1', icon: 'Database', label: 'Single Source', desc: 'One database, all platforms', color: 'from-blue-500 to-cyan-500' },
    { id: 'callout-2', icon: 'RefreshCw', label: 'Real-Time Sync', desc: 'Instant data propagation', color: 'from-emerald-500 to-teal-500' },
    { id: 'callout-3', icon: 'Shield', label: 'Secure Transfers', desc: 'Encrypted, logged, validated', color: 'from-purple-500 to-pink-500' },
    { id: 'callout-4', icon: 'Zap', label: 'Automated', desc: 'Zero manual intervention', color: 'from-amber-500 to-orange-500' },
  ],
};

export const defaultEvolutionConfig: EvolutionConfig = {
  columns: [
    {
      id: 'col-today',
      title: 'TODAY',
      subtitle: 'Legacy + Disconnected',
      color: 'from-slate-500 to-slate-600',
      bgColor: 'from-slate-50 to-slate-100',
      borderColor: 'border-slate-300',
      icon: 'AlertTriangle',
      iconColor: 'text-amber-500',
      items: [
        { id: 'today-1', text: 'Multiple systems with duplicated data', status: 'warning' },
        { id: 'today-2', text: 'E123 handling enrollment externally', status: 'warning' },
        { id: 'today-3', text: 'Fragile / manual eligibility transfers', status: 'error' },
        { id: 'today-4', text: 'Website, portal, CRM in silos', status: 'warning' },
        { id: 'today-5', text: 'Limited unified reporting', status: 'warning' },
        { id: 'today-6', text: 'Separate onboarding workflows', status: 'warning' },
      ],
      callout: { type: 'error', text: 'Risk: Data inconsistencies + operational friction' },
    },
    {
      id: 'col-transition',
      title: 'TRANSITION',
      subtitle: 'Parallel Run + Controlled Migration',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-300',
      icon: 'RefreshCw',
      iconColor: 'text-blue-500',
      sections: [
        { id: 'trans-a', label: 'A) Foundation', items: ['Unified login + roles (RBAC)', 'Unified API + business rules', 'Audit logs baseline'] },
        { id: 'trans-b', label: 'B) Data Consolidation', items: ['MPB Database = system of record', 'Sync jobs to validate legacy data', 'Master member profile'] },
        { id: 'trans-c', label: 'C) Eligibility Upgrade', items: ['New transfer service (EDI/SFTP/API)', 'Validation, logging, retries'] },
        { id: 'trans-d', label: 'D) E123 Coexistence', items: ['E123 continues short-term', 'MPB mirrors enrollment states', 'Side-by-side reconciliation'] },
      ],
      callout: { type: 'info', text: 'Outcome: No downtime, controlled cutover' },
    },
    {
      id: 'col-target',
      title: 'TARGET STATE',
      subtitle: 'Unified Platform + E123 Replaced',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-300',
      icon: 'Target',
      iconColor: 'text-emerald-500',
      items: [
        { id: 'target-1', text: 'E123 replaced by MPB Enrollment System', status: 'success', highlight: true },
        { id: 'target-2', text: 'Member Management fully inside MPB', status: 'success' },
        { id: 'target-3', text: 'All apps share same data/services', status: 'success' },
        { id: 'target-4', text: 'CRM, Ticketing, Concierge unified', status: 'success' },
        { id: 'target-5', text: 'Billing integrated end-to-end', status: 'success' },
        { id: 'target-6', text: 'Onboarding unified (all types)', status: 'success' },
        { id: 'target-7', text: 'Eligibility transfers automated', status: 'success' },
        { id: 'target-8', text: 'Real-time reporting for all', status: 'success' },
      ],
      callout: { type: 'success', text: 'Result: One source of truth, faster execution, stronger governance' },
    },
  ],
  timeline: [
    { id: 'tl-1', label: 'Foundation', status: 'complete' },
    { id: 'tl-2', label: 'Data Sync', status: 'current' },
    { id: 'tl-3', label: 'Parallel Run', status: 'upcoming' },
    { id: 'tl-4', label: 'Cutover & Decommission', status: 'upcoming' },
  ],
  migrationLabel: 'Migration Path: Parallel Run → Reconciliation → Cutover → Decommission Legacy',
};

export const defaultPresentationConfig: PresentationConfig = {
  architecture: defaultArchitectureConfig,
  dataHub: defaultDataHubConfig,
  evolution: defaultEvolutionConfig,
};

// LocalStorage key for persistence
export const PRESENTATION_CONFIG_KEY = 'mpb-presentation-config';

// Helper to generate unique IDs
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
