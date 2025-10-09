import * as XLSX from 'xlsx';
import type {
  HIPAAIncident,
  HIPAABAA,
  HIPAAPHIAccess,
  HIPAARisk,
  HIPAATask,
  HIPAATraining,
  HIPAATrainingAttendance,
  HIPAADoc,
  HIFAAudit,
} from '../types/compliance';

// =====================================================
// CSV Export Utilities
// =====================================================

export const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const keys = headers || Object.keys(data[0]);
  const csvContent = [
    keys.join(','),
    ...data.map(row => 
      keys.map(key => {
        const value = row[key];
        // Handle arrays and objects
        const stringValue = Array.isArray(value) 
          ? value.join('; ')
          : typeof value === 'object' && value !== null
          ? JSON.stringify(value)
          : String(value || '');
        // Escape quotes and wrap in quotes if contains comma or newline
        return stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
};

// =====================================================
// Excel Export Utilities
// =====================================================

export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, filename);
};

export const exportMultipleToExcel = (
  sheets: Array<{ name: string; data: any[] }>,
  filename: string
) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    if (sheet.data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    }
  });

  XLSX.writeFile(workbook, filename);
};

// =====================================================
// Specific Compliance Exports
// =====================================================

export const exportIncidents = (
  incidents: HIPAAIncident[],
  format: 'csv' | 'xlsx' = 'csv'
) => {
  const exportData = incidents.map(incident => ({
    'Incident Number': incident.incident_number,
    'Title': incident.title,
    'Description': incident.description,
    'Severity': incident.severity,
    'Status': incident.status,
    'Occurred At': new Date(incident.occurred_at).toLocaleString(),
    'Discovered At': new Date(incident.discovered_at).toLocaleString(),
    'Is Breach': incident.is_breach ? 'Yes' : 'No',
    'Affected Individuals': incident.affected_individuals_count || 0,
    'PHI Types Affected': incident.phi_types_affected?.join(', ') || '',
    'Created At': new Date(incident.created_at).toLocaleString(),
  }));

  const filename = `incidents_export_${new Date().toISOString().split('T')[0]}.${format}`;

  if (format === 'csv') {
    exportToCSV(exportData, filename);
  } else {
    exportToExcel(exportData, filename, 'Incidents');
  }
};

export const exportBAAs = (
  baas: HIPAABAA[],
  format: 'csv' | 'xlsx' = 'csv'
) => {
  const exportData = baas.map(baa => ({
    'Vendor': baa.vendor,
    'Contact Name': baa.vendor_contact_name || '',
    'Contact Email': baa.contact_email || '',
    'Contact Phone': baa.contact_phone || '',
    'Services Provided': baa.services_provided || '',
    'Status': baa.status,
    'Effective Date': new Date(baa.effective_date).toLocaleDateString(),
    'Renewal Date': new Date(baa.renewal_date).toLocaleDateString(),
    'Auto Renews': baa.auto_renews ? 'Yes' : 'No',
    'Notes': baa.notes || '',
  }));

  const filename = `baas_export_${new Date().toISOString().split('T')[0]}.${format}`;

  if (format === 'csv') {
    exportToCSV(exportData, filename);
  } else {
    exportToExcel(exportData, filename, 'BAAs');
  }
};

export const exportPHIAccessLogs = (
  logs: HIPAAPHIAccess[],
  format: 'csv' | 'xlsx' = 'csv'
) => {
  const exportData = logs.map(log => ({
    'Date/Time': new Date(log.occurred_at).toLocaleString(),
    'Accessor': log.accessor_name || 'N/A',
    'Subject': log.subject,
    'Purpose Category': log.purpose_category || '',
    'Purpose': log.purpose,
    'Details': log.details || '',
    'System Source': log.system_source || '',
  }));

  const filename = `phi_access_log_${new Date().toISOString().split('T')[0]}.${format}`;

  if (format === 'csv') {
    exportToCSV(exportData, filename);
  } else {
    exportToExcel(exportData, filename, 'PHI Access Log');
  }
};

export const exportRisks = (
  risks: HIPAARisk[],
  format: 'csv' | 'xlsx' = 'csv'
) => {
  const exportData = risks.map(risk => ({
    'Title': risk.title,
    'Description': risk.description || '',
    'Category': risk.category || '',
    'Likelihood': risk.likelihood,
    'Impact': risk.impact,
    'Risk Score': risk.risk_score,
    'Status': risk.status,
    'Target Date': risk.target_date ? new Date(risk.target_date).toLocaleDateString() : '',
    'Residual Risk': risk.residual_risk || '',
    'Created At': new Date(risk.created_at).toLocaleDateString(),
  }));

  const filename = `risk_register_${new Date().toISOString().split('T')[0]}.${format}`;

  if (format === 'csv') {
    exportToCSV(exportData, filename);
  } else {
    exportToExcel(exportData, filename, 'Risk Register');
  }
};

export const exportTasks = (
  tasks: HIPAATask[],
  format: 'csv' | 'xlsx' = 'csv'
) => {
  const exportData = tasks.map(task => ({
    'Title': task.title,
    'Description': task.description || '',
    'Section': task.section,
    'Status': task.status,
    'Priority': task.priority,
    'Due Date': task.due_date ? new Date(task.due_date).toLocaleDateString() : '',
    'Completed At': task.completed_at ? new Date(task.completed_at).toLocaleDateString() : '',
    'Created At': new Date(task.created_at).toLocaleDateString(),
  }));

  const filename = `tasks_export_${new Date().toISOString().split('T')[0]}.${format}`;

  if (format === 'csv') {
    exportToCSV(exportData, filename);
  } else {
    exportToExcel(exportData, filename, 'Tasks');
  }
};

export const exportTrainingAttendance = (
  attendance: HIPAATrainingAttendance[],
  trainings: HIPAATraining[],
  format: 'csv' | 'xlsx' = 'csv'
) => {
  const trainingMap = new Map(trainings.map(t => [t.id, t.name]));

  const exportData = attendance.map(record => ({
    'Training': trainingMap.get(record.training_id) || 'Unknown',
    'User Email': record.user_email,
    'User Name': record.user_name || '',
    'Completed At': record.completed_at ? new Date(record.completed_at).toLocaleString() : 'Not Completed',
    'Score': record.score || 'N/A',
    'Certificate URL': record.certificate_url || '',
    'Notes': record.notes || '',
  }));

  const filename = `training_attendance_${new Date().toISOString().split('T')[0]}.${format}`;

  if (format === 'csv') {
    exportToCSV(exportData, filename);
  } else {
    exportToExcel(exportData, filename, 'Training Attendance');
  }
};

export const exportDocuments = (
  docs: HIPAADoc[],
  format: 'csv' | 'xlsx' = 'csv'
) => {
  const exportData = docs.map(doc => ({
    'Title': doc.title,
    'Section': doc.section,
    'Status': doc.status,
    'Revision': doc.revision,
    'Effective Date': doc.effective_date ? new Date(doc.effective_date).toLocaleDateString() : '',
    'Approved At': doc.approved_at ? new Date(doc.approved_at).toLocaleDateString() : '',
    'Tags': doc.tags.join(', '),
    'Created At': new Date(doc.created_at).toLocaleDateString(),
    'Updated At': new Date(doc.updated_at).toLocaleDateString(),
  }));

  const filename = `documents_export_${new Date().toISOString().split('T')[0]}.${format}`;

  if (format === 'csv') {
    exportToCSV(exportData, filename);
  } else {
    exportToExcel(exportData, filename, 'Documents');
  }
};

export const exportAudits = (
  audits: HIFAAudit[],
  format: 'csv' | 'xlsx' = 'csv'
) => {
  const exportData = audits.map(audit => ({
    'Title': audit.title,
    'Kind': audit.kind,
    'Status': audit.status,
    'Auditor Name': audit.auditor_name || '',
    'Auditor Organization': audit.auditor_org || '',
    'Period Start': audit.period_start ? new Date(audit.period_start).toLocaleDateString() : '',
    'Period End': audit.period_end ? new Date(audit.period_end).toLocaleDateString() : '',
    'Findings Summary': audit.findings_summary || '',
    'Created At': new Date(audit.created_at).toLocaleDateString(),
  }));

  const filename = `audits_export_${new Date().toISOString().split('T')[0]}.${format}`;

  if (format === 'csv') {
    exportToCSV(exportData, filename);
  } else {
    exportToExcel(exportData, filename, 'Audits');
  }
};

// =====================================================
// Comprehensive Compliance Report
// =====================================================

export const exportComplianceReport = (data: {
  incidents: HIPAAIncident[];
  baas: HIPAABAA[];
  phiAccess: HIPAAPHIAccess[];
  risks: HIPAARisk[];
  tasks: HIPAATask[];
  docs: HIPAADoc[];
  audits: HIFAAudit[];
}) => {
  const sheets = [
    {
      name: 'Summary',
      data: [{
        'Report Generated': new Date().toLocaleString(),
        'Total Incidents': data.incidents.length,
        'Open Incidents': data.incidents.filter(i => !['resolved', 'closed'].includes(i.status)).length,
        'Total BAAs': data.baas.length,
        'Active BAAs': data.baas.filter(b => b.status === 'active').length,
        'PHI Access Logs': data.phiAccess.length,
        'Open Risks': data.risks.filter(r => r.status === 'open').length,
        'Pending Tasks': data.tasks.filter(t => t.status !== 'done').length,
        'Documents': data.docs.length,
        'Approved Documents': data.docs.filter(d => d.status === 'approved').length,
        'Audits': data.audits.length,
      }]
    },
    {
      name: 'Incidents',
      data: data.incidents.map(i => ({
        'Number': i.incident_number,
        'Title': i.title,
        'Severity': i.severity,
        'Status': i.status,
        'Is Breach': i.is_breach ? 'Yes' : 'No',
        'Occurred': new Date(i.occurred_at).toLocaleDateString(),
      }))
    },
    {
      name: 'BAAs',
      data: data.baas.map(b => ({
        'Vendor': b.vendor,
        'Status': b.status,
        'Renewal Date': new Date(b.renewal_date).toLocaleDateString(),
      }))
    },
    {
      name: 'Risks',
      data: data.risks.map(r => ({
        'Title': r.title,
        'Likelihood': r.likelihood,
        'Impact': r.impact,
        'Risk Score': r.risk_score,
        'Status': r.status,
      }))
    },
    {
      name: 'Tasks',
      data: data.tasks.map(t => ({
        'Title': t.title,
        'Section': t.section,
        'Status': t.status,
        'Priority': t.priority,
        'Due Date': t.due_date ? new Date(t.due_date).toLocaleDateString() : '',
      }))
    },
  ];

  const filename = `compliance_report_${new Date().toISOString().split('T')[0]}.xlsx`;
  exportMultipleToExcel(sheets, filename);
};

// =====================================================
// Helper Functions
// =====================================================

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

