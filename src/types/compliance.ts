/**
 * Compliance Types
 * Type definitions for the HIPAA compliance module
 */

/** Document status for compliance documents */
export type DocStatus = 'draft' | 'review' | 'in_review' | 'approved' | 'expired' | 'archived';

/** Incident severity levels */
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

/** Task status for compliance tasks */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

/** Task priority levels */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/** Risk status for security risks */
export type RiskStatus = 'open' | 'mitigated' | 'accepted' | 'transferred' | 'closed';

/** Business Associate Agreement status */
export type BAAStatus = 'pending' | 'active' | 'expired' | 'terminated';

/** Audit status */
export type AuditStatus = 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'passed';

/** User roles for compliance access */
export type UserRole = 'admin' | 'hipaa_officer' | 'auditor' | 'staff' | 'viewer';

/** Compliance task */
export interface ComplianceTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

/** Compliance document */
export interface ComplianceDocument {
  id: string;
  title: string;
  description?: string;
  status: DocStatus;
  file_path?: string;
  version?: string;
  created_at: string;
  updated_at: string;
  expiry_date?: string;
}

/** Security incident */
export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  reported_at: string;
  resolved_at?: string;
  assigned_to?: string;
}

/** Business Associate Agreement */
export interface BAA {
  id: string;
  vendor_name: string;
  status: BAAStatus;
  effective_date: string;
  expiry_date: string;
  contact_email?: string;
  file_path?: string;
}

/** Audit record */
export interface Audit {
  id: string;
  name: string;
  type: string;
  status: AuditStatus;
  scheduled_date: string;
  completed_date?: string;
  findings?: number;
  auditor?: string;
}

/** Form data for creating/editing compliance documents */
export interface DocFormData {
  section: string;
  title: string;
  slug: string;
  content_md: string;
  status: 'draft' | 'in_review' | 'approved';
  reviewers: string[];
  tags: string[];
}

/** Form data for creating/editing Business Associate Agreements */
export interface BAAFormData {
  vendor: string;
  services_provided: string;
  effective_date: string;
  renewal_date: string;
  auto_renews: boolean;
  contact_email: string;
  contact_phone: string;
  vendor_contact_name: string;
  notes: string;
  document_url?: string;
}/** HIPAA Evidence record */
export interface HIPAAEvidence {
  id: string;
  path: string;
  title: string;
  category: string;
  file_type: string;
  file_size: number;
  owner: string;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
