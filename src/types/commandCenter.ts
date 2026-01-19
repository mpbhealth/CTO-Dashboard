import { BaseEntity, FilterOptions, PaginatedResponse } from './common';

// ============================================
// Advisor & Hierarchy Types
// ============================================

export interface Advisor extends BaseEntity {
  agent_id: string;
  parent_id?: string | null;
  agent_label: string;
  full_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  hire_date?: string;
  territory?: string;
  level: number; // 0 = root, 1 = first level down, etc.
}

export interface AdvisorTreeNode extends Advisor {
  children: AdvisorTreeNode[];
  member_count: number;
  direct_member_count: number;
  downline_member_count: number;
  expanded?: boolean;
}

export interface HierarchyStats {
  total_advisors: number;
  active_advisors: number;
  total_members: number;
  members_per_level: Record<number, number>;
  depth: number;
}

// ============================================
// Member Types
// ============================================

export type MemberStatus = 'active' | 'pending' | 'inactive' | 'cancelled' | 'suspended';
export type PlanType = 'basic' | 'standard' | 'premium' | 'enterprise';

export interface Member extends BaseEntity {
  membership_number?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  status: MemberStatus;
  plan_id?: string;
  plan_name?: string;
  plan_type?: PlanType;
  assigned_advisor_id?: string;
  assigned_advisor_name?: string;
  enrollment_date?: string;
  renewal_date?: string;
  last_contact_date?: string;
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
}

export interface MemberWithAdvisor extends Member {
  advisor?: Advisor;
}

// ============================================
// Import Types
// ============================================

export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface MemberImportLog extends BaseEntity {
  advisor_id: string;
  file_name: string;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  error_details: ImportError[];
  status: ImportStatus;
  completed_at?: string;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: string;
}

export interface CSVColumnMapping {
  csvColumn: string;
  targetField: keyof Member | null;
  required: boolean;
  sample?: string;
}

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  preview: Record<string, string>[]; // First 5 rows for preview
}

export interface MemberValidationResult {
  valid: boolean;
  errors: ImportError[];
  warnings: ImportError[];
  validatedData: Partial<Member>[];
}

export interface ImportResult {
  success: boolean;
  importLogId?: string;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: ImportError[];
}

// ============================================
// Filter & Query Types
// ============================================

export interface MemberFilters extends FilterOptions {
  status?: MemberStatus | 'all';
  plan_type?: PlanType | 'all';
  advisor_id?: string;
  include_downline?: boolean;
  enrollment_date_from?: string;
  enrollment_date_to?: string;
  tags?: string[];
}

export interface MemberQueryOptions {
  filters: MemberFilters;
  page: number;
  pageSize: number;
  sortBy: keyof Member;
  sortOrder: 'asc' | 'desc';
}

// ============================================
// Analytics Types
// ============================================

export interface MemberPortfolioStats {
  total_members: number;
  active_members: number;
  pending_members: number;
  inactive_members: number;
  cancelled_members: number;
  retention_rate: number;
  growth_rate: number;
  avg_member_tenure_days: number;
}

export interface MemberGrowthTrend {
  date: string;
  total: number;
  new_members: number;
  cancelled: number;
  net_change: number;
}

export interface PlanDistribution {
  plan_type: PlanType;
  plan_name: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface StatusDistribution {
  status: MemberStatus;
  count: number;
  percentage: number;
  color?: string;
}

export interface AdvisorPerformanceMetric {
  advisor_id: string;
  advisor_name: string;
  total_members: number;
  active_members: number;
  retention_rate: number;
  new_this_month: number;
  cancelled_this_month: number;
}

export interface CommandCenterAnalytics {
  portfolio_stats: MemberPortfolioStats;
  growth_trends: MemberGrowthTrend[];
  plan_distribution: PlanDistribution[];
  status_distribution: StatusDistribution[];
  advisor_performance?: AdvisorPerformanceMetric[];
}

// ============================================
// UI State Types
// ============================================

export type CommandCenterTab = 'members' | 'hierarchy' | 'analytics' | 'import';

export interface CommandCenterState {
  activeTab: CommandCenterTab;
  memberFilters: MemberFilters;
  selectedMemberIds: string[];
  hierarchyExpandedNodes: string[];
  importStep: 'upload' | 'mapping' | 'preview' | 'processing' | 'complete';
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: string;
  action: (memberIds: string[]) => Promise<void>;
  confirmMessage?: string;
}

// ============================================
// API Response Types
// ============================================

export type MemberListResponse = PaginatedResponse<MemberWithAdvisor>;

export interface AdvisorHierarchyResponse {
  tree: AdvisorTreeNode;
  stats: HierarchyStats;
}

// ============================================
// Required CSV Fields
// ============================================

export const REQUIRED_CSV_FIELDS: (keyof Member)[] = [
  'first_name',
  'last_name',
  'date_of_birth',
];

export const OPTIONAL_CSV_FIELDS: (keyof Member)[] = [
  'email',
  'phone',
  'membership_number',
  'address',
  'city',
  'state',
  'zip_code',
  'plan_id',
  'status',
  'enrollment_date',
  'notes',
];

export const CSV_FIELD_LABELS: Record<string, string> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  date_of_birth: 'Date of Birth',
  email: 'Email Address',
  phone: 'Phone Number',
  membership_number: 'Membership Number',
  address: 'Street Address',
  city: 'City',
  state: 'State',
  zip_code: 'ZIP Code',
  plan_id: 'Plan ID',
  plan_name: 'Plan Name',
  status: 'Status',
  enrollment_date: 'Enrollment Date',
  notes: 'Notes',
  tags: 'Tags',
};
