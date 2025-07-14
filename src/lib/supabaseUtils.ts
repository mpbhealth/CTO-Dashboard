import { supabase } from './supabase';

/**
 * Sanitizes a string to prevent XSS attacks
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string | null | undefined): string {
  if (input === null || input === undefined) return '';
  
  return String(input)
    .replace(/[<>]/g, '') // Remove angle brackets to prevent HTML injection
    .trim();
}

/**
 * Sanitizes an object by sanitizing all string values
 * @param obj Object to sanitize
 * @returns New object with sanitized string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key as keyof T] = sanitizeString(value) as any;
    } else if (Array.isArray(value)) {
      result[key as keyof T] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      ) as any;
    } else {
      result[key as keyof T] = value;
    }
  }
  
  return result;
}

/**
 * Performs a batch upsert operation for an array of records
 * 
 * @param tableName The name of the table to upsert to
 * @param records Array of records to upsert
 * @param onConflict Column(s) to handle conflicts on (e.g., 'id', 'enrollment_id')
 * @param batchSize Number of records to upsert in each batch (default: 100)
 * @returns Object containing counts of inserted, updated, and errors
 */
export async function batchUpsert<T extends Record<string, any>>(
  tableName: string,
  records: T[],
  onConflict: string,
  batchSize: number = 100
): Promise<{ inserted: number; errors: number }> {
  let inserted = 0;
  let errors = 0;

  // Sanitize all records before inserting
  const sanitizedRecords = records.map(record => sanitizeObject(record));

  // Process in batches
  for (let i = 0; i < sanitizedRecords.length; i += batchSize) {
    const batch = sanitizedRecords.slice(i, i + batchSize);
    const { error } = await supabase
      .from(tableName)
      .upsert(batch, { onConflict });

    if (error) {
      console.error(`Error upserting batch to ${tableName}:`, error);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, errors };
}

/**
 * Interface for a universal record that can be either an enrollment or status update
 */
export interface UniversalImportRecord {
  record_type: 'enrollment' | 'status_update' | 'both';
  // Enrollment fields
  enrollment_id?: string;
  member_id: string;
  enrollment_date?: string;
  program_name?: string;
  enrollment_status?: string;
  enrollment_source?: string;
  premium_amount?: number | string;
  renewal_date?: string;
  // Status update fields
  status_date?: string;
  new_status?: string;
  reason?: string;
  source_system?: string;
}

/**
 * Processes a universal CSV import by separating records into appropriate tables
 * 
 * @param records Array of universal import records from the CSV
 * @returns Object containing counts of inserted and error records for each table
 */
export async function processUniversalImport(
  records: UniversalImportRecord[]
): Promise<{ 
  enrollments: { inserted: number; errors: number; }; 
  statusUpdates: { inserted: number; errors: number; }; 
}> {
  const enrollmentRecords: any[] = [];
  const statusUpdateRecords: any[] = [];
  
  // Separate records based on record_type
  records.forEach(record => {
    // Process enrollment records (record_type is 'enrollment' or 'both')
    if (record.record_type === 'enrollment' || record.record_type === 'both') {
      if (record.enrollment_id && record.enrollment_date && record.program_name && 
          record.enrollment_status && record.member_id && record.premium_amount) {
        
        enrollmentRecords.push({
          enrollment_id: record.enrollment_id,
          member_id: record.member_id,
          enrollment_date: new Date(record.enrollment_date).toISOString(),
          program_name: record.program_name,
          enrollment_status: record.enrollment_status.toLowerCase(),
          enrollment_source: record.enrollment_source || null,
          premium_amount: typeof record.premium_amount === 'string' 
            ? parseFloat(record.premium_amount) 
            : record.premium_amount,
          renewal_date: record.renewal_date ? new Date(record.renewal_date).toISOString() : null
        });
      }
    }
    
    // Process status update records (record_type is 'status_update' or 'both')
    if (record.record_type === 'status_update' || record.record_type === 'both') {
      if (record.member_id && record.status_date && record.new_status) {
        statusUpdateRecords.push({
          member_id: record.member_id,
          status_date: new Date(record.status_date).toISOString(),
          new_status: record.new_status.toLowerCase(),
          reason: record.reason || null,
          source_system: record.source_system || null
        });
      }
    }
  });
  
  // Perform batch upserts for each table
  const [enrollmentResults, statusUpdateResults] = await Promise.all([
    enrollmentRecords.length > 0 
      ? batchUpsert('member_enrollments', enrollmentRecords, 'enrollment_id') 
      : { inserted: 0, errors: 0 },
    statusUpdateRecords.length > 0
      ? batchUpsert('member_status_updates', statusUpdateRecords, 'id')
      : { inserted: 0, errors: 0 }
  ]);
  
  return {
    enrollments: enrollmentResults,
    statusUpdates: statusUpdateResults
  };
}