import { supabase } from './supabase';
import Papa from 'papaparse';
import {
  transformWeeklyMetricsFile,
  validateWeeklyMetric,
  type TransformedWeeklyMetric,
} from './conciergeWeeklyMetricsTransformer';
import {
  transformDailyInteractionsFile,
  validateDailyInteraction,
  type TransformedDailyInteraction,
} from './conciergeDailyInteractionsTransformer';
import {
  transformAfterHoursFile,
  validateAfterHoursCall,
  type TransformedAfterHoursCall,
} from './conciergeAfterHoursTransformer';

export type ConciergeSubdepartment = 'weekly' | 'daily' | 'after_hours';

export interface UploadOptions {
  subdepartment: ConciergeSubdepartment;
  fileName: string;
  orgId?: string;
  uploadedBy?: string;
}

export interface UploadResult {
  success: boolean;
  uploadBatchId?: string;
  rowsProcessed: number;
  rowsSucceeded: number;
  rowsFailed: number;
  errors: Array<{
    row: number;
    message: string;
    data?: any;
  }>;
  warnings: Array<{
    row: number;
    message: string;
  }>;
  summary?: {
    dateRange?: string;
    agents?: string[];
    totalInteractions?: number;
    totalCalls?: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

async function generateUploadBatchId(): Promise<string> {
  const { data, error } = await supabase.rpc('gen_random_uuid');
  if (error || !data) {
    return crypto.randomUUID();
  }
  return data;
}

async function logUploadError(
  batchId: string,
  subdepartment: string,
  rowNumber: number,
  errorType: string,
  errorMessage: string,
  rowData?: any
): Promise<void> {
  try {
    await supabase.from('concierge_upload_errors').insert({
      upload_batch_id: batchId,
      subdepartment,
      row_number: rowNumber,
      error_type: errorType,
      error_message: errorMessage,
      row_data: rowData ? JSON.stringify(rowData) : null,
    });
  } catch (err) {
    console.error('Failed to log upload error:', err);
  }
}

async function logDataQuality(
  batchId: string | null,
  subdepartment: string,
  checkType: string,
  severity: 'info' | 'warning' | 'error',
  message: string,
  affectedRows: number = 0,
  details?: any
): Promise<void> {
  try {
    await supabase.from('concierge_data_quality_log').insert({
      upload_batch_id: batchId,
      subdepartment,
      check_type: checkType,
      severity,
      message,
      affected_rows: affectedRows,
      details: details ? JSON.stringify(details) : null,
    });
  } catch (err) {
    console.error('Failed to log data quality:', err);
  }
}

export async function uploadWeeklyMetrics(
  file: File,
  options: Omit<UploadOptions, 'subdepartment'>
): Promise<UploadResult> {
  const batchId = await generateUploadBatchId();
  const result: UploadResult = {
    success: false,
    uploadBatchId: batchId,
    rowsProcessed: 0,
    rowsSucceeded: 0,
    rowsFailed: 0,
    errors: [],
    warnings: [],
  };

  try {
    const fileContent = await file.text();

    const parseResult = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: resolve,
        error: reject,
      });
    });

    if (parseResult.errors.length > 0) {
      throw new Error(`CSV parsing failed: ${parseResult.errors[0].message}`);
    }

    const transformed = transformWeeklyMetricsFile(parseResult.data);
    result.rowsProcessed = transformed.length;

    if (transformed.length === 0) {
      throw new Error('No valid data found in file');
    }

    const validRecords: any[] = [];
    const agents = new Set<string>();
    const dateRanges = new Set<string>();

    for (let i = 0; i < transformed.length; i++) {
      const metric = transformed[i];
      const validation = validateWeeklyMetric(metric);

      if (!validation.valid) {
        result.rowsFailed++;
        const errorMsg = validation.errors.join('; ');
        result.errors.push({
          row: i + 1,
          message: errorMsg,
          data: metric,
        });
        await logUploadError(batchId, 'weekly', i + 1, 'validation', errorMsg, metric);
      } else {
        agents.add(metric.agent_name);
        dateRanges.add(metric.date_range);

        validRecords.push({
          org_id: options.orgId || '00000000-0000-0000-0000-000000000000',
          uploaded_by: options.uploadedBy || 'system',
          upload_batch_id: batchId,
          file_name: options.fileName,
          row_number: i + 1,
          week_start_date: metric.week_start_date,
          week_end_date: metric.week_end_date,
          date_range: metric.date_range,
          agent_name: metric.agent_name,
          metric_type: metric.metric_type,
          metric_value: metric.metric_value,
          notes: metric.notes,
          processing_status: 'pending',
        });

        if (validation.errors.length === 0 && validation.warnings.length > 0) {
          validation.warnings.forEach(warning => {
            result.warnings.push({ row: i + 1, message: warning });
          });
        }
      }
    }

    if (validRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('stg_concierge_weekly_metrics')
        .insert(validRecords);

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      result.rowsSucceeded = validRecords.length;
      result.success = true;

      result.summary = {
        dateRange: Array.from(dateRanges).join(', '),
        agents: Array.from(agents),
      };

      await logDataQuality(
        batchId,
        'weekly',
        'upload_complete',
        'info',
        `Successfully uploaded ${result.rowsSucceeded} weekly metrics records`,
        result.rowsSucceeded,
        result.summary
      );
    } else {
      throw new Error('No valid records to insert');
    }
  } catch (error) {
    result.success = false;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    result.errors.push({ row: 0, message: errorMessage });
    await logDataQuality(batchId, 'weekly', 'upload_failed', 'error', errorMessage, 0);
  }

  return result;
}

export async function uploadDailyInteractions(
  file: File,
  options: Omit<UploadOptions, 'subdepartment'>
): Promise<UploadResult> {
  const batchId = await generateUploadBatchId();
  const result: UploadResult = {
    success: false,
    uploadBatchId: batchId,
    rowsProcessed: 0,
    rowsSucceeded: 0,
    rowsFailed: 0,
    errors: [],
    warnings: [],
  };

  try {
    const fileContent = await file.text();

    const parseResult = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
      Papa.parse(fileContent, {
        header: false,
        skipEmptyLines: true,
        complete: resolve,
        error: reject,
      });
    });

    if (parseResult.errors.length > 0) {
      throw new Error(`CSV parsing failed: ${parseResult.errors[0].message}`);
    }

    const dataAsObjects = parseResult.data.map((row: any[]) => {
      const obj: any = {};
      row.forEach((val, idx) => {
        obj[`col_${idx}`] = val;
      });
      return obj;
    });

    const transformed = transformDailyInteractionsFile(dataAsObjects);
    result.rowsProcessed = transformed.length;

    if (transformed.length === 0) {
      throw new Error('No valid data found in file');
    }

    const validRecords: any[] = [];
    let totalInteractions = 0;
    let noCallsDays = 0;

    for (let i = 0; i < transformed.length; i++) {
      const interaction = transformed[i];
      const validation = validateDailyInteraction(interaction);

      if (!validation.valid) {
        result.rowsFailed++;
        const errorMsg = validation.errors.join('; ');
        result.errors.push({
          row: i + 1,
          message: errorMsg,
          data: interaction,
        });
        await logUploadError(batchId, 'daily', i + 1, 'validation', errorMsg, interaction);
      } else {
        if (interaction.member_name === 'NO CALLS') {
          noCallsDays++;
        } else {
          totalInteractions++;
        }

        validRecords.push({
          org_id: options.orgId || '00000000-0000-0000-0000-000000000000',
          uploaded_by: options.uploadedBy || 'system',
          upload_batch_id: batchId,
          file_name: options.fileName,
          row_number: i + 1,
          interaction_date: interaction.interaction_date,
          member_name: interaction.member_name,
          issue_description: interaction.issue_description,
          notes: interaction.notes,
          processing_status: 'pending',
        });

        if (validation.errors.length === 0 && validation.warnings.length > 0) {
          validation.warnings.forEach(warning => {
            result.warnings.push({ row: i + 1, message: warning });
          });
        }
      }
    }

    if (validRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('stg_concierge_daily_interactions')
        .insert(validRecords);

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      result.rowsSucceeded = validRecords.length;
      result.success = true;

      result.summary = {
        totalInteractions,
      };

      await logDataQuality(
        batchId,
        'daily',
        'upload_complete',
        'info',
        `Successfully uploaded ${totalInteractions} daily interactions (${noCallsDays} no-call days)`,
        result.rowsSucceeded,
        result.summary
      );
    } else {
      throw new Error('No valid records to insert');
    }
  } catch (error) {
    result.success = false;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    result.errors.push({ row: 0, message: errorMessage });
    await logDataQuality(batchId, 'daily', 'upload_failed', 'error', errorMessage, 0);
  }

  return result;
}

export async function uploadAfterHoursCalls(
  file: File,
  options: Omit<UploadOptions, 'subdepartment'>
): Promise<UploadResult> {
  const batchId = await generateUploadBatchId();
  const result: UploadResult = {
    success: false,
    uploadBatchId: batchId,
    rowsProcessed: 0,
    rowsSucceeded: 0,
    rowsFailed: 0,
    errors: [],
    warnings: [],
  };

  try {
    const fileContent = await file.text();

    const parseResult = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
      Papa.parse(fileContent, {
        header: false,
        skipEmptyLines: true,
        complete: resolve,
        error: reject,
      });
    });

    if (parseResult.errors.length > 0) {
      throw new Error(`CSV parsing failed: ${parseResult.errors[0].message}`);
    }

    const dataAsObjects = parseResult.data.map((row: any[]) => {
      const obj: any = {};
      row.forEach((val, idx) => {
        obj[`col_${idx}`] = val;
      });
      return obj;
    });

    const transformed = transformAfterHoursFile(dataAsObjects);
    result.rowsProcessed = transformed.length;

    if (transformed.length === 0) {
      throw new Error('No valid data found in file');
    }

    const validRecords: any[] = [];
    let totalCalls = 0;

    for (let i = 0; i < transformed.length; i++) {
      const call = transformed[i];
      const validation = validateAfterHoursCall(call);

      if (!validation.valid) {
        result.rowsFailed++;
        const errorMsg = validation.errors.join('; ');
        result.errors.push({
          row: i + 1,
          message: errorMsg,
          data: call,
        });
        await logUploadError(batchId, 'after_hours', i + 1, 'validation', errorMsg, call);
      } else {
        totalCalls++;

        validRecords.push({
          org_id: options.orgId || '00000000-0000-0000-0000-000000000000',
          uploaded_by: options.uploadedBy || 'system',
          upload_batch_id: batchId,
          file_name: options.fileName,
          row_number: i + 1,
          call_timestamp: call.call_timestamp,
          member_name_with_phone: call.member_name_with_phone,
          member_name: call.member_name,
          phone_number: call.phone_number,
          notes: call.notes,
          processing_status: 'pending',
        });

        if (validation.errors.length === 0 && validation.warnings.length > 0) {
          validation.warnings.forEach(warning => {
            result.warnings.push({ row: i + 1, message: warning });
          });
        }
      }
    }

    if (validRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('stg_concierge_after_hours')
        .insert(validRecords);

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      result.rowsSucceeded = validRecords.length;
      result.success = true;

      result.summary = {
        totalCalls,
      };

      await logDataQuality(
        batchId,
        'after_hours',
        'upload_complete',
        'info',
        `Successfully uploaded ${totalCalls} after-hours calls`,
        result.rowsSucceeded,
        result.summary
      );
    } else {
      throw new Error('No valid records to insert');
    }
  } catch (error) {
    result.success = false;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    result.errors.push({ row: 0, message: errorMessage });
    await logDataQuality(batchId, 'after_hours', 'upload_failed', 'error', errorMessage, 0);
  }

  return result;
}

export async function uploadConciergeFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  switch (options.subdepartment) {
    case 'weekly':
      return uploadWeeklyMetrics(file, options);
    case 'daily':
      return uploadDailyInteractions(file, options);
    case 'after_hours':
      return uploadAfterHoursCalls(file, options);
    default:
      throw new Error(`Unknown subdepartment: ${options.subdepartment}`);
  }
}

export async function getConciergeUploadTemplates() {
  const { data, error } = await supabase
    .from('concierge_upload_templates')
    .select('*')
    .eq('is_active', true)
    .order('subdepartment');

  if (error) {
    console.error('Failed to fetch upload templates:', error);
    return [];
  }

  return data || [];
}

export async function getUploadHistory(subdepartment?: ConciergeSubdepartment, limit: number = 20) {
  let query = supabase
    .from('concierge_data_quality_log')
    .select('*')
    .eq('check_type', 'upload_complete')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (subdepartment) {
    query = query.eq('subdepartment', subdepartment);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch upload history:', error);
    return [];
  }

  return data || [];
}

export async function getUploadErrors(uploadBatchId: string) {
  const { data, error } = await supabase
    .from('concierge_upload_errors')
    .select('*')
    .eq('upload_batch_id', uploadBatchId)
    .order('row_number');

  if (error) {
    console.error('Failed to fetch upload errors:', error);
    return [];
  }

  return data || [];
}
