import { supabase } from "./supabase";

export interface ComplianceAuditData {
  audit_id: string;
  audit_date: string;
  audit_type: string;
  findings: string;
  status: string;
  auditor: string;
}

export interface MemberRetentionData {
  member_id: string;
  enrollment_date: string;
  status: string;
  plan_type: string;
  months_active: number;
  last_contact: string;
}

export interface PolicyDocumentData {
  policy_id: string;
  policy_name: string;
  version: string;
  effective_date: string;
  review_date: string;
  owner: string;
  status: string;
}

export interface EmployeePerformanceData {
  employee_id: string;
  employee_name: string;
  department: string;
  role: string;
  performance_score: number;
  review_date: string;
  goals_completed: number;
}

export interface MarketingMetricsData {
  date: string;
  channel: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  roi: number;
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function postExport(
  format: "csv" | "xlsx",
  data: Record<string, unknown>[],
  filename?: string,
  sheetName?: string
) {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("You must be logged in to export data");
  }

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-data`;

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ format, data, filename, sheetName }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Export failed (${res.status})`);
  }

  const blob = await res.blob();
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename || `export_${Date.now()}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportComplianceReport(
  data: ComplianceAuditData[],
  format: "csv" | "xlsx" = "xlsx"
) {
  const filename = `compliance_audit_report_${new Date().toISOString().split("T")[0]}.${format}`;
  await postExport(format, data, filename, "Compliance Audits");
}

export async function exportMemberData(
  data: MemberRetentionData[],
  format: "csv" | "xlsx" = "xlsx"
) {
  const filename = `member_retention_${new Date().toISOString().split("T")[0]}.${format}`;
  await postExport(format, data, filename, "Member Retention");
}

export async function exportPolicyAudit(
  data: PolicyDocumentData[],
  format: "csv" | "xlsx" = "xlsx"
) {
  const filename = `policy_documents_${new Date().toISOString().split("T")[0]}.${format}`;
  await postExport(format, data, filename, "Policy Documents");
}

export async function exportEmployeePerformance(
  data: EmployeePerformanceData[],
  format: "csv" | "xlsx" = "xlsx"
) {
  const filename = `employee_performance_${new Date().toISOString().split("T")[0]}.${format}`;
  await postExport(format, data, filename, "Employee Performance");
}

export async function exportMarketingAnalytics(
  data: MarketingMetricsData[],
  format: "csv" | "xlsx" = "xlsx"
) {
  const filename = `marketing_analytics_${new Date().toISOString().split("T")[0]}.${format}`;
  await postExport(format, data, filename, "Marketing Metrics");
}
