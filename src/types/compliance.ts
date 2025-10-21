// =====================================================
// HIPAA Compliance Command Center - TypeScript Types
// =====================================================

export type UserRole = 
  | 'admin'
  | 'hipaa_officer'
  | 'privacy_officer'
  | 'security_officer'
  | 'legal'
  | 'auditor'
  | 'staff';

export type DocStatus = 'draft' | 'in_review' | 'approved' | 'archived';
export type DocSection = 
  | 'administration'
  | 'training'
  | 'phi-minimum'
  | 'technical'
  | 'baas'
  | 'incidents'
  | 'audits'
  | 'templates-tools';

export type RiskStatus = 'open' | 'mitigating' | 'accepted' | 'closed';
export type TrainingFrequency = 'onboarding' | 'annual' | 'quarterly' | 'ad-hoc';
export type PurposeCategory = 'Treatment' | 'Payment' | 'Operations' | 'Other';
export type BAAStatus = 'active' | 'pending' | 'expired' | 'terminated';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'new' | 'triage' | 'investigation' | 'rca' | 'resolved' | 'notified' | 'closed';
export type AuditKind = 'internal' | 'external' | 'vulnerability' | 'penetration' | 'risk-assessment';
export type AuditStatus = 'planned' | 'in-progress' | 'completed' | 'archived';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type PolicyCategory = 
  | 'Privacy Rule'
  | 'Security Rule'
  | 'Breach Notification'
  | 'Administrative'
  | 'Technical'
  | 'Physical'
  | 'Organizational';

// =====================================================
// Database Entity Types
// =====================================================

export interface Profile {
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: UserRole;
  description: string | null;
  created_at: string;
}

export interface UserRoleMapping {
  user_id: string;
  role_id: number;
  assigned_at: string;
  assigned_by: string | null;
}

export interface HIPAAEvidence {
  id: string;
  path: string;
  title: string;
  category: string;
  file_type: string | null;
  file_size: number | null;
  owner: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HIPAADoc {
  id: string;
  section: DocSection;
  title: string;
  slug: string;
  content_md: string;
  status: DocStatus;
  owner: string;
  reviewers: string[];
  approver: string | null;
  approved_at: string | null;
  effective_date: string | null;
  revision: number;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HIPAADocVersion {
  id: string;
  doc_id: string;
  revision: number;
  content_md: string;
  changed_by: string;
  change_summary: string | null;
  changed_at: string;
}

export interface HIPAAPolicy {
  id: string;
  doc_id: string | null;
  policy_number: string | null;
  category: PolicyCategory;
  next_review_date: string | null;
  review_frequency_months: number;
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface HIPAARisk {
  id: string;
  title: string;
  description: string | null;
  likelihood: number; // 1-5
  impact: number; // 1-5
  risk_score: number; // computed: likelihood * impact
  category: string | null;
  owner: string | null;
  status: RiskStatus;
  target_date: string | null;
  residual_risk: string | null;
  created_at: string;
  updated_at: string;
}

export interface HIPAAMitigation {
  id: string;
  risk_id: string;
  action: string;
  responsible: string | null;
  due_date: string | null;
  done: boolean;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HIPAATraining {
  id: string;
  name: string;
  description: string | null;
  frequency: TrainingFrequency;
  owner: string | null;
  content_url: string | null;
  duration_minutes: number | null;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface HIPAATrainingAttendance {
  id: string;
  training_id: string;
  user_id: string | null;
  user_email: string;
  user_name: string | null;
  completed_at: string | null;
  score: number | null;
  certificate_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface HIPAAPHIAccess {
  id: string;
  subject: string;
  accessor: string | null;
  accessor_name: string | null;
  purpose: string;
  purpose_category: PurposeCategory | null;
  details: string | null;
  system_source: string | null;
  occurred_at: string;
  created_at: string;
}

export interface HIPAABAA {
  id: string;
  vendor: string;
  vendor_contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  services_provided: string | null;
  effective_date: string;
  renewal_date: string;
  auto_renews: boolean;
  status: BAAStatus;
  file_url: string | null;
  notes: string | null;
  owner: string | null;
  created_at: string;
  updated_at: string;
}

export interface HIPAAIncident {
  id: string;
  incident_number: string | null;
  title: string;
  description: string | null;
  severity: IncidentSeverity | null;
  status: IncidentStatus;
  reported_by: string | null;
  assigned_to: string | null;
  occurred_at: string;
  discovered_at: string;
  closed_at: string | null;
  is_breach: boolean;
  affected_individuals_count: number | null;
  phi_types_affected: string[] | null;
  rca_md: string | null;
  remediation_md: string | null;
  created_at: string;
  updated_at: string;
}

export interface HIPAABreachNotification {
  id: string;
  incident_id: string;
  individual_notice_sent_at: string | null;
  individual_notice_method: string | null;
  hhs_reported_at: string | null;
  hhs_confirmation_number: string | null;
  media_notice_sent_at: string | null;
  media_outlets: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HIFAAudit {
  id: string;
  kind: AuditKind;
  title: string;
  description: string | null;
  auditor_name: string | null;
  auditor_org: string | null;
  period_start: string | null;
  period_end: string | null;
  status: AuditStatus;
  report_url: string | null;
  findings_summary: string | null;
  cap_md: string | null;
  owner: string | null;
  created_at: string;
  updated_at: string;
}

export interface HIPAATask {
  id: string;
  title: string;
  description: string | null;
  section: DocSection | string;
  linked_table: string | null;
  linked_id: string | null;
  assignee: string | null;
  created_by: string | null;
  due_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HIFAAuditLog {
  id: string;
  actor: string | null;
  actor_email: string | null;
  action: string;
  object_table: string | null;
  object_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface HIPAAContact {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceSetting {
  key: string;
  value: Record<string, any>;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

// =====================================================
// UI / Component Types
// =====================================================

export interface KPIData {
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
}

export interface DashboardStats {
  policies: {
    approved: number;
    inReview: number;
    overdue: number;
  };
  baas: {
    active: number;
    expiringSoon: number;
  };
  incidents: {
    open: number;
    bySeverity: Record<IncidentSeverity, number>;
  };
  training: {
    completionRate: number;
    onboardingComplete: number;
    annualComplete: number;
  };
}

export interface FilterOptions {
  section?: DocSection[];
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  owner?: string[];
  tags?: string[];
}

export interface ImportMapping {
  sourceColumn: string;
  targetField: string;
  transform?: (value: any) => any;
}

export interface ImportResult {
  success: boolean;
  recordsProcessed: number;
  recordsImported: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  includeMetadata?: boolean;
  dateRange?: { from: string; to: string };
  filters?: FilterOptions;
}

// =====================================================
// Form / Input Types
// =====================================================

export interface DocFormData {
  section: DocSection;
  title: string;
  slug: string;
  content_md: string;
  status: DocStatus;
  reviewers: string[];
  tags: string[];
  effective_date?: string;
}

export interface RiskFormData {
  title: string;
  description: string;
  likelihood: number;
  impact: number;
  category: string;
  owner: string;
  target_date?: string;
}

export interface IncidentFormData {
  title: string;
  description: string;
  severity: IncidentSeverity;
  occurred_at: string;
  is_breach: boolean;
  affected_individuals_count?: number;
  phi_types_affected?: string[];
}

export interface TaskFormData {
  title: string;
  description: string;
  section: DocSection | string;
  assignee: string;
  due_date: string;
  priority: TaskPriority;
  linked_table?: string;
  linked_id?: string;
}

export interface PHIAccessFormData {
  subject: string;
  purpose: string;
  purpose_category: PurposeCategory;
  details?: string;
  system_source?: string;
}

export interface BAAFormData {
  vendor: string;
  vendor_contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  services_provided?: string;
  effective_date: string;
  renewal_date: string;
  auto_renews: boolean;
  notes?: string;
}

export type DocumentType =
  | 'hipaa_training_certificate'
  | 'security_awareness_certificate'
  | 'privacy_policy_acknowledgment'
  | 'confidentiality_agreement'
  | 'background_check'
  | 'professional_license'
  | 'continuing_education'
  | 'other';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface EmployeeComplianceDocument {
  id: string;
  employee_id: string | null;
  employee_email: string;
  employee_name: string | null;
  document_type: DocumentType;
  title: string;
  description: string | null;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  category: string;
  upload_date: string;
  expiration_date: string | null;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  uploaded_by: string;
  department: string | null;
  tags: string[];
  metadata: Record<string, any>;
  notes: string | null;
  version: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeDocumentNotification {
  id: string;
  document_id: string;
  notification_type: string;
  notification_date: string;
  sent_at: string | null;
  recipient_email: string;
  message: string | null;
  created_at: string;
}

export interface EmployeeDocumentFormData {
  employee_email: string;
  employee_name?: string;
  document_type: DocumentType;
  title: string;
  description?: string;
  category: string;
  expiration_date?: string;
  department?: string;
  tags?: string[];
  notes?: string;
}

// =====================================================
// API Response Types
// =====================================================

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

