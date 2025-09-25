import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { 
  SourceRow, 
  TargetRow, 
  ProcessedRow, 
  SourceRowSchema, 
  TARGET_COLUMNS,
  INACTIVE_STATUS_TERMS,
  VALID_RECORD_TYPES 
} from './schemas';

import { 
  productCodeMap, 
  productAdminLabelMap, 
  productBenefitIdMap,
  lookupWithFallback,
  coalesce
} from './lookups';

// Initialize dayjs plugins
dayjs.extend(customParseFormat);

/**
 * Date parsing utilities
 */
const DATE_INPUT_FORMATS = ['YYYY-MM-DD', 'MM/DD/YYYY', 'YYYY-MM-DDTHH:mm:ssZ'];

export function parseDate(dateStr: string | undefined): string {
  if (!dateStr || !dateStr.trim()) return '';
  
  const trimmed = dateStr.trim();
  
  // Try each format
  for (const format of DATE_INPUT_FORMATS) {
    const parsed = dayjs(trimmed, format, true);
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD');
    }
  }
  
  // Try default parsing as fallback
  const fallbackParsed = dayjs(trimmed);
  if (fallbackParsed.isValid()) {
    return fallbackParsed.format('YYYY-MM-DD');
  }
  
  console.warn(`Unable to parse date: ${dateStr}`);
  return '';
}

/**
 * Currency parsing utilities
 */
export function parseCurrency(value: string | undefined): string {
  if (!value || !value.trim()) return '';
  
  // Strip currency symbols and whitespace
  const cleaned = value.replace(/[$,\s]/g, '');
  
  // Parse as float
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return '';
  
  // Return formatted to 2 decimals
  return parsed.toFixed(2);
}

/**
 * Agent ID extraction from enrollment_source
 */
export function parseAgentId(enrollmentSource: string | undefined): string {
  if (!enrollmentSource) return '';
  
  // Look for patterns like "agent:1234" or "agent#1234"
  const match = enrollmentSource.match(/agent[:#](\w+)/i);
  return match ? match[1] : '';
}

/**
 * Normalize record type to valid enum values
 */
function normalizeRecordType(recordType: string): 'enrollment' | 'status_update' | 'both' | null {
  const normalized = recordType.toLowerCase().trim();
  if (VALID_RECORD_TYPES.includes(normalized as any)) {
    return normalized as any;
  }
  return null;
}

/**
 * Check if status indicates inactive/terminated enrollment
 */
export function isInactiveStatus(status: string | undefined): boolean {
  if (!status) return false;
  return INACTIVE_STATUS_TERMS.includes(status.toLowerCase().trim());
}

/**
 * Filter and validate source rows
 */
function filterAndValidateRows(rows: any[]): ProcessedRow[] {
  const processedRows: ProcessedRow[] = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    try {
      // Validate against source schema
      const validatedRow = SourceRowSchema.parse(row);
      
      // Check if member_id is not empty (required)
      if (!validatedRow.member_id || !validatedRow.member_id.trim()) {
        console.warn(`Row ${i + 1}: Skipping row with empty member_id`);
        continue;
      }
      
      // Normalize record type
      const normalizedRecordType = normalizeRecordType(validatedRow.record_type);
      if (!normalizedRecordType) {
        console.warn(`Row ${i + 1}: Invalid record_type '${validatedRow.record_type}', skipping`);
        continue;
      }
      
      // Create processed row
      const processedRow: ProcessedRow = {
        member_id: validatedRow.member_id.trim(),
        program_name: validatedRow.program_name?.trim() || '',
        enrollment_date: validatedRow.enrollment_date?.trim(),
        status_date: validatedRow.status_date?.trim(),
        new_status: validatedRow.new_status?.trim(),
        enrollment_source: validatedRow.enrollment_source?.trim(),
        premium_amount: validatedRow.premium_amount?.trim(),
        renewal_date: validatedRow.renewal_date?.trim(),
        record_type: normalizedRecordType
      };
      
      processedRows.push(processedRow);
      
    } catch (error) {
      console.warn(`Row ${i + 1}: Validation failed -`, error);
      continue;
    }
  }
  
  return processedRows;
}

/**
 * Transform processed row to target row
 */
function transformRow(row: ProcessedRow): TargetRow {
  // Determine dates based on record type and status
  let dateActive = '';
  let dateInactive = '';
  
  if (row.record_type === 'enrollment') {
    dateActive = parseDate(row.enrollment_date);
    // Date Inactive remains blank for enrollment-only records
  } else if (row.record_type === 'status_update') {
    // For status updates, check if it's an inactive status
    if (isInactiveStatus(row.new_status)) {
      dateInactive = parseDate(row.status_date);
    }
  } else if (row.record_type === 'both') {
    dateActive = parseDate(row.enrollment_date);
    if (isInactiveStatus(row.new_status)) {
      dateInactive = parseDate(row.status_date);
    }
  }
  
  return {
    'ID Customer': row.member_id,
    'ID Product': lookupWithFallback(productCodeMap, row.program_name),
    'Date Active': dateActive,
    'Date Inactive': dateInactive,
    'Name First': '',  // Not available in source
    'Name Last': '',   // Not available in source
    'Product Admin Label': coalesce(
      lookupWithFallback(productAdminLabelMap, row.program_name),
      row.program_name
    ),
    'Product Benefit ID': lookupWithFallback(productBenefitIdMap, row.program_name),
    'Product Label': row.program_name || '',
    'Date Created Member': parseDate(row.enrollment_date),
    'Date First Billing': parseDate(row.enrollment_date),
    'Date Last Payment': '',  // Not available in source
    'Date Next Billing': parseDate(row.renewal_date),
    'ID Agent': parseAgentId(row.enrollment_source),
    'Last Payment': '',  // Not available in source
    'Last Transaction Amount': '',  // Not available in source
    'Product Amount': parseCurrency(row.premium_amount)
  };
}

/**
 * Merge logic for duplicate member_id/program_name combinations
 */
type MergeKey = string; // member_id|program_name

function generateMergeKey(row: TargetRow): MergeKey {
  return `${row['ID Customer']}|${row['Product Label']}`;
}

function mergeRows(rows: TargetRow[]): TargetRow[] {
  const mergeMap = new Map<MergeKey, TargetRow>();
  
  for (const row of rows) {
    const key = generateMergeKey(row);
    
    if (mergeMap.has(key)) {
      const existing = mergeMap.get(key)!;
      
      // Merge logic: earliest active date, latest inactive date, last non-empty values
      const merged: TargetRow = {
        ...existing,
        // Min date active (earliest)
        'Date Active': minDate(existing['Date Active'], row['Date Active']),
        // Max date inactive (latest)
        'Date Inactive': maxDate(existing['Date Inactive'], row['Date Inactive']),
        // Last non-empty for these fields
        'Product Amount': row['Product Amount'] || existing['Product Amount'],
        'Date Next Billing': row['Date Next Billing'] || existing['Date Next Billing'],
        'ID Agent': row['ID Agent'] || existing['ID Agent'],
      };
      
      mergeMap.set(key, merged);
    } else {
      mergeMap.set(key, { ...row });
    }
  }
  
  return Array.from(mergeMap.values());
}

/**
 * Date comparison utilities for merging
 */
function minDate(date1: string, date2: string): string {
  if (!date1) return date2;
  if (!date2) return date1;
  return dayjs(date1).isBefore(dayjs(date2)) ? date1 : date2;
}

function maxDate(date1: string, date2: string): string {
  if (!date1) return date2;
  if (!date2) return date1;
  return dayjs(date1).isAfter(dayjs(date2)) ? date1 : date2;
}

/**
 * Validation of final output
 */
function validateOutput(rows: TargetRow[]): void {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // ID Customer not empty
    if (!row['ID Customer']) {
      throw new Error(`Row ${i + 1}: ID Customer is empty`);
    }
    
    // Date Active <= Date Inactive when both exist
    if (row['Date Active'] && row['Date Inactive']) {
      const activeDate = dayjs(row['Date Active']);
      const inactiveDate = dayjs(row['Date Inactive']);
      
      if (activeDate.isAfter(inactiveDate)) {
        throw new Error(`Row ${i + 1}: Date Active (${row['Date Active']}) is after Date Inactive (${row['Date Inactive']})`);
      }
    }
    
    // Product Amount is numeric or empty
    if (row['Product Amount']) {
      const amount = parseFloat(row['Product Amount']);
      if (isNaN(amount)) {
        throw new Error(`Row ${i + 1}: Product Amount '${row['Product Amount']}' is not numeric`);
      }
    }
  }
}

/**
 * Main transformation function
 */
export async function transformCsv(inputPath: string, outputPath: string): Promise<void> {
  console.log(`Transforming ${inputPath} -> ${outputPath}`);
  
  // Read input CSV
  const inputData = fs.readFileSync(inputPath, 'utf8');
  
  return new Promise((resolve, reject) => {
    const rows: any[] = [];
    
    parse(inputData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
    .on('data', (row: any) => {
      rows.push(row);
    })
    .on('error', (err: any) => {
      reject(err);
    })
    .on('end', async () => {
      try {
        console.log(`Read ${rows.length} rows from input`);
        
        // Filter and validate
        const processedRows = filterAndValidateRows(rows);
        console.log(`${processedRows.length} rows passed validation`);
        
        // Transform
        const transformedRows = processedRows.map(transformRow);
        console.log(`Transformed ${transformedRows.length} rows`);
        
        // Merge duplicates
        const mergedRows = mergeRows(transformedRows);
        console.log(`After merging: ${mergedRows.length} unique rows`);
        
        // Validate output
        validateOutput(mergedRows);
        console.log('Output validation passed');
        
        // Write output CSV
        const outputData = await new Promise<string>((resolve, reject) => {
          stringify(mergedRows, {
            header: true,
            columns: TARGET_COLUMNS,
          }, (err: any, output: any) => {
            if (err) reject(err);
            else resolve(output);
          });
        });
        
        fs.writeFileSync(outputPath, outputData, 'utf8');
        console.log(`Wrote ${mergedRows.length} rows to ${outputPath}`);
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * CLI Interface
 */
const program = new Command();

program
  .name('csv-enrollment-transformer')
  .description('Transform enrollment/status CSV to template format')
  .version('1.0.0')
  .requiredOption('-i, --input <path>', 'Input CSV file path')
  .requiredOption('-o, --output <path>', 'Output CSV file path')
  .action(async (options) => {
    try {
      await transformCsv(options.input, options.output);
      console.log('Transformation completed successfully!');
    } catch (error) {
      console.error('Transformation failed:', error);
      process.exit(1);
    }
  });

// Execute CLI if run directly
if (require.main === module) {
  program.parse(process.argv);
}