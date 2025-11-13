import {
  transformWeeklyMetricsFile,
  validateWeeklyMetric,
  getWeeklyMetricsSummary,
  type TransformedWeeklyMetric,
  type ConciergeWeeklyMetricsCSVRow,
} from './conciergeWeeklyMetricsTransformer';

import {
  transformDailyInteractionsFile,
  validateDailyInteraction,
  getDailyInteractionsSummary,
  type TransformedDailyInteraction,
  type ConciergeDailyInteractionsCSVRow,
} from './conciergeDailyInteractionsTransformer';

import {
  transformAfterHoursFile,
  validateAfterHoursCall,
  getAfterHoursSummary,
  type TransformedAfterHoursCall,
  type ConciergeAfterHoursCSVRow,
} from './conciergeAfterHoursTransformer';

export type ConciergeReportType = 'weekly' | 'daily' | 'after_hours';

export interface ConciergeUploadResult {
  reportType: ConciergeReportType;
  success: boolean;
  totalRows: number;
  validRows: number;
  errors: Array<{ row: number; errors: string[] }>;
  summary: any;
  data: any[];
}

export function detectConciergeReportType(data: any[]): ConciergeReportType | null {
  if (!data || data.length === 0) return null;

  const firstRow = data[0];
  const columns = Object.keys(firstRow);

  const hasDateRange = columns.some(
    col => typeof firstRow[col] === 'string' && /\d{1,2}\.\d{1,2}\.\d{2}-\d{1,2}\.\d{1,2}\.\d{2}/.test(firstRow[col])
  );

  const hasAgentColumns = columns.some(col => {
    const colName = String(col).toLowerCase();
    return ['ace', 'adam', 'angee', 'tupac', 'leo', 'julia'].some(agent => colName.includes(agent));
  });

  const hasMetricRows = data.some(row => {
    const firstValue = String(row[columns[0]] || '').toLowerCase();
    return (
      firstValue.includes('members attended') ||
      firstValue.includes('phone time') ||
      firstValue.includes('crm tasks') ||
      firstValue.includes('requests')
    );
  });

  if (hasDateRange && hasAgentColumns && hasMetricRows) {
    return 'weekly';
  }

  const hasTimestamp = columns.some(col => {
    const value = String(firstRow[col] || '');
    return /^[A-Za-z]{3}\s+\d{1,2},\s+\d{4},\s+\d{1,2}:\d{2}:\d{2}\s+[ap]m$/i.test(value);
  });

  const hasPhoneNumber = columns.some(col => {
    const value = String(firstRow[col] || '');
    return /\(\+\d+\)/.test(value);
  });

  if (hasTimestamp && hasPhoneNumber) {
    return 'after_hours';
  }

  const hasSimpleDate = data.some(row => {
    const firstValue = String(row[columns[0]] || '');
    return /^\d{1,2}\.\d{1,2}\.\d{2}$/.test(firstValue);
  });

  const hasMemberIssueStructure = columns.length >= 2 && columns.length <= 4;

  if (hasSimpleDate && hasMemberIssueStructure) {
    return 'daily';
  }

  return null;
}

export function transformConciergeData(
  data: any[],
  reportType: ConciergeReportType
): ConciergeUploadResult {
  switch (reportType) {
    case 'weekly':
      return transformWeeklyMetrics(data as ConciergeWeeklyMetricsCSVRow[]);
    case 'daily':
      return transformDailyInteractions(data as ConciergeDailyInteractionsCSVRow[]);
    case 'after_hours':
      return transformAfterHours(data as ConciergeAfterHoursCSVRow[]);
    default:
      return {
        reportType: 'daily',
        success: false,
        totalRows: 0,
        validRows: 0,
        errors: [{ row: 0, errors: ['Unknown report type'] }],
        summary: {},
        data: [],
      };
  }
}

function transformWeeklyMetrics(data: ConciergeWeeklyMetricsCSVRow[]): ConciergeUploadResult {
  const transformed = transformWeeklyMetricsFile(data);
  const errors: Array<{ row: number; errors: string[] }> = [];

  transformed.forEach((metric, index) => {
    const validation = validateWeeklyMetric(metric);
    if (!validation.valid) {
      errors.push({
        row: index + 1,
        errors: validation.errors,
      });
    }
  });

  const validRows = transformed.filter((_, index) => {
    const validation = validateWeeklyMetric(transformed[index]);
    return validation.valid;
  });

  const summary = getWeeklyMetricsSummary(validRows);

  return {
    reportType: 'weekly',
    success: errors.length === 0,
    totalRows: transformed.length,
    validRows: validRows.length,
    errors,
    summary,
    data: validRows,
  };
}

function transformDailyInteractions(data: ConciergeDailyInteractionsCSVRow[]): ConciergeUploadResult {
  const transformed = transformDailyInteractionsFile(data);
  const errors: Array<{ row: number; errors: string[] }> = [];

  transformed.forEach((interaction, index) => {
    const validation = validateDailyInteraction(interaction);
    if (!validation.valid) {
      errors.push({
        row: index + 1,
        errors: validation.errors,
      });
    }
  });

  const validRows = transformed.filter((_, index) => {
    const validation = validateDailyInteraction(transformed[index]);
    return validation.valid;
  });

  const summary = getDailyInteractionsSummary(validRows);

  return {
    reportType: 'daily',
    success: errors.length === 0,
    totalRows: transformed.length,
    validRows: validRows.length,
    errors,
    summary,
    data: validRows,
  };
}

function transformAfterHours(data: ConciergeAfterHoursCSVRow[]): ConciergeUploadResult {
  const transformed = transformAfterHoursFile(data);
  const errors: Array<{ row: number; errors: string[] }> = [];

  transformed.forEach((call, index) => {
    const validation = validateAfterHoursCall(call);
    if (!validation.valid) {
      errors.push({
        row: index + 1,
        errors: validation.errors,
      });
    }
  });

  const validRows = transformed.filter((_, index) => {
    const validation = validateAfterHoursCall(transformed[index]);
    return validation.valid;
  });

  const summary = getAfterHoursSummary(validRows);

  return {
    reportType: 'after_hours',
    success: errors.length === 0,
    totalRows: transformed.length,
    validRows: validRows.length,
    errors,
    summary,
    data: validRows,
  };
}

export function getConciergeUploadTableName(reportType: ConciergeReportType): string {
  switch (reportType) {
    case 'weekly':
      return 'stg_concierge_weekly_metrics';
    case 'daily':
      return 'stg_concierge_daily_interactions';
    case 'after_hours':
      return 'stg_concierge_after_hours';
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
}

export function formatConciergeRowForInsert(row: any, reportType: ConciergeReportType, uploadMetadata: {
  uploadedBy?: string;
  uploadBatchId?: string;
  sheetName?: string;
}): any {
  const baseFields = {
    uploaded_by: uploadMetadata.uploadedBy || null,
    upload_batch_id: uploadMetadata.uploadBatchId || null,
    sheet_name: uploadMetadata.sheetName || null,
  };

  switch (reportType) {
    case 'weekly':
      return {
        ...baseFields,
        week_start_date: row.week_start_date,
        week_end_date: row.week_end_date,
        date_range: row.date_range,
        agent_name: row.agent_name,
        metric_type: row.metric_type,
        metric_value: row.metric_value,
        notes: row.notes || null,
      };

    case 'daily':
      return {
        ...baseFields,
        interaction_date: row.interaction_date,
        member_name: row.member_name,
        issue_description: row.issue_description || null,
        notes: row.notes || null,
      };

    case 'after_hours':
      return {
        ...baseFields,
        call_timestamp: row.call_timestamp,
        member_name_with_phone: row.member_name_with_phone,
        member_name: row.member_name,
        phone_number: row.phone_number || null,
        notes: row.notes || null,
      };

    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
}

export {
  type TransformedWeeklyMetric,
  type TransformedDailyInteraction,
  type TransformedAfterHoursCall,
};
