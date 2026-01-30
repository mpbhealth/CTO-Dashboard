import Papa from 'papaparse';
import { supabase, isSupabaseConfigured } from './supabase';
import type {
  Member,
  MemberImportLog,
  ImportError,
  CSVColumnMapping,
  CSVParseResult,
  MemberValidationResult,
  ImportResult,
} from '../types/commandCenter';

// ============================================
// CSV Parsing Functions
// ============================================

/**
 * Parse a CSV file and return headers, rows, and preview data
 * @param file - The CSV file to parse
 * @returns Parsed CSV result with headers and rows
 */
export async function parseCSVFile(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data;
        const preview = rows.slice(0, 5);

        resolve({
          headers,
          rows,
          totalRows: rows.length,
          preview,
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

/**
 * Auto-detect column mappings based on header names
 * @param headers - CSV column headers
 * @param sampleRow - A sample row for preview values
 * @returns Suggested column mappings
 */
export function autoDetectColumnMappings(
  headers: string[],
  sampleRow?: Record<string, string>
): CSVColumnMapping[] {
  const requiredFields: (keyof Member)[] = ['first_name', 'last_name', 'date_of_birth'];
  const optionalFields: (keyof Member)[] = [
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

  const allTargetFields = [...requiredFields, ...optionalFields];

  // Common aliases for auto-detection
  const fieldAliases: Record<string, string[]> = {
    first_name: ['firstname', 'first', 'fname', 'given_name', 'givenname'],
    last_name: ['lastname', 'last', 'lname', 'surname', 'family_name', 'familyname'],
    date_of_birth: ['dob', 'birthdate', 'birth_date', 'birthday', 'dateofbirth'],
    email: ['email_address', 'emailaddress', 'e_mail', 'e-mail'],
    phone: ['phone_number', 'phonenumber', 'telephone', 'tel', 'mobile', 'cell'],
    membership_number: ['member_id', 'memberid', 'member_number', 'membernumber', 'id'],
    address: ['street', 'street_address', 'streetaddress', 'address1', 'address_line_1'],
    city: ['town', 'municipality'],
    state: ['province', 'region', 'st'],
    zip_code: ['zipcode', 'postal_code', 'postalcode', 'zip', 'postcode'],
    plan_id: ['plan', 'plan_type', 'plantype', 'subscription'],
    status: ['member_status', 'memberstatus', 'account_status'],
    enrollment_date: ['join_date', 'joindate', 'signup_date', 'signupdate', 'start_date'],
    notes: ['comments', 'note', 'remarks'],
  };

  const mappings: CSVColumnMapping[] = [];

  for (const csvHeader of headers) {
    const normalizedHeader = csvHeader.toLowerCase().replace(/[^a-z0-9]/g, '_');
    let matchedField: keyof Member | null = null;

    // Direct match
    if (allTargetFields.includes(normalizedHeader as keyof Member)) {
      matchedField = normalizedHeader as keyof Member;
    } else {
      // Alias match
      for (const [field, aliases] of Object.entries(fieldAliases)) {
        if (aliases.includes(normalizedHeader)) {
          matchedField = field as keyof Member;
          break;
        }
      }
    }

    mappings.push({
      csvColumn: csvHeader,
      targetField: matchedField,
      required: matchedField ? requiredFields.includes(matchedField) : false,
      sample: sampleRow?.[csvHeader],
    });
  }

  return mappings;
}

/**
 * Get the list of available target fields for mapping
 * @returns Array of field options with labels
 */
export function getTargetFieldOptions(): { value: keyof Member | ''; label: string }[] {
  const fieldLabels: Record<string, string> = {
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

  return [
    { value: '', label: '-- Skip this column --' },
    ...Object.entries(fieldLabels).map(([value, label]) => ({
      value: value as keyof Member,
      label,
    })),
  ];
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate member data rows
 * @param rows - Parsed CSV rows
 * @param mappings - Column mappings
 * @returns Validation result with errors and warnings
 */
export function validateMemberData(
  rows: Record<string, string>[],
  mappings: CSVColumnMapping[]
): MemberValidationResult {
  const errors: ImportError[] = [];
  const warnings: ImportError[] = [];
  const validatedData: Partial<Member>[] = [];

  // Get required field mappings
  const requiredFields: (keyof Member)[] = ['first_name', 'last_name', 'date_of_birth'];
  const mappingLookup = new Map(
    mappings
      .filter((m) => m.targetField)
      .map((m) => [m.targetField!, m.csvColumn])
  );

  // Check if all required fields are mapped
  for (const field of requiredFields) {
    if (!mappingLookup.has(field)) {
      errors.push({
        row: 0,
        field,
        message: `Required field "${field}" is not mapped to any CSV column`,
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings, validatedData: [] };
  }

  // Validate each row
  rows.forEach((row, index) => {
    const rowNumber = index + 2; // Account for header row and 0-indexing
    const memberData: Partial<Member> = {};
    let rowValid = true;

    for (const mapping of mappings) {
      if (!mapping.targetField) continue;

      const value = row[mapping.csvColumn]?.trim() || '';
      const field = mapping.targetField;

      // Required field validation
      if (requiredFields.includes(field) && !value) {
        errors.push({
          row: rowNumber,
          field,
          message: `Missing required field: ${field}`,
          value: '',
        });
        rowValid = false;
        continue;
      }

      // Field-specific validation
      switch (field) {
        case 'email':
          if (value && !isValidEmail(value)) {
            warnings.push({
              row: rowNumber,
              field: 'email',
              message: 'Invalid email format',
              value,
            });
          }
          memberData.email = value || undefined;
          break;

        case 'date_of_birth': {
          const dob = parseDate(value);
          if (!dob) {
            errors.push({
              row: rowNumber,
              field: 'date_of_birth',
              message: 'Invalid date format for date of birth',
              value,
            });
            rowValid = false;
          } else {
            memberData.date_of_birth = dob;
          }
          break;
        }

        case 'enrollment_date':
          if (value) {
            const enrollDate = parseDate(value);
            if (!enrollDate) {
              warnings.push({
                row: rowNumber,
                field: 'enrollment_date',
                message: 'Invalid date format for enrollment date',
                value,
              });
            } else {
              memberData.enrollment_date = enrollDate;
            }
          }
          break;

        case 'phone':
          if (value) {
            memberData.phone = normalizePhone(value);
          }
          break;

        case 'status': {
          const validStatuses = ['active', 'pending', 'inactive', 'cancelled', 'suspended'];
          if (value && !validStatuses.includes(value.toLowerCase())) {
            warnings.push({
              row: rowNumber,
              field: 'status',
              message: `Unknown status "${value}", defaulting to "pending"`,
              value,
            });
            memberData.status = 'pending';
          } else {
            memberData.status = (value.toLowerCase() as Member['status']) || 'pending';
          }
          break;
        }

        case 'zip_code':
          if (value && !isValidZipCode(value)) {
            warnings.push({
              row: rowNumber,
              field: 'zip_code',
              message: 'ZIP code may be invalid',
              value,
            });
          }
          memberData.zip_code = value || undefined;
          break;

        default:
          if (value) {
            (memberData as Record<string, unknown>)[field] = value;
          }
      }
    }

    if (rowValid) {
      validatedData.push(memberData);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    validatedData,
  };
}

// ============================================
// Import Functions
// ============================================

/**
 * Import validated members into the database
 * @param validatedData - Array of validated member data
 * @param advisorId - The advisor ID to assign members to
 * @param fileName - Original file name for logging
 * @returns Import result with counts and errors
 */
export async function importMembers(
  validatedData: Partial<Member>[],
  advisorId: string,
  fileName: string
): Promise<ImportResult> {
  if (!isSupabaseConfigured) {
    console.warn('[MemberIngestion] Supabase not configured, simulating import');
    return simulateImport(validatedData, fileName);
  }

  // Create import log entry
  const { data: importLog, error: logError } = await supabase
    .from('member_import_logs')
    .insert({
      advisor_id: advisorId,
      file_name: fileName,
      total_rows: validatedData.length,
      status: 'processing',
    })
    .select()
    .single();

  if (logError) {
    console.error('[MemberIngestion] Error creating import log:', logError);
    return {
      success: false,
      totalProcessed: 0,
      successCount: 0,
      failureCount: validatedData.length,
      errors: [{ row: 0, message: 'Failed to create import log' }],
    };
  }

  const importLogId = importLog.id;
  const errors: ImportError[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Process in batches of 100
  const batchSize = 100;
  for (let i = 0; i < validatedData.length; i += batchSize) {
    const batch = validatedData.slice(i, i + batchSize);

    // Prepare batch data
    const batchData = batch.map((member) => ({
      ...member,
      assigned_advisor_id: advisorId,
      status: member.status || 'pending',
      created_at: new Date().toISOString(),
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('member_profiles')
      .insert(batchData)
      .select('id');

    if (insertError) {
      console.error('[MemberIngestion] Batch insert error:', insertError);
      failureCount += batch.length;
      errors.push({
        row: i + 1,
        message: `Batch insert failed: ${insertError.message}`,
      });
    } else {
      successCount += inserted?.length || 0;
      failureCount += batch.length - (inserted?.length || 0);
    }
  }

  // Update import log with results
  await supabase
    .from('member_import_logs')
    .update({
      successful_rows: successCount,
      failed_rows: failureCount,
      error_details: errors,
      status: errors.length > 0 && successCount === 0 ? 'failed' : 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', importLogId);

  return {
    success: failureCount === 0,
    importLogId,
    totalProcessed: validatedData.length,
    successCount,
    failureCount,
    errors,
  };
}

/**
 * Get import history for an advisor
 * @param advisorId - The advisor ID
 * @param limit - Maximum number of records to return
 * @returns Array of import logs
 */
export async function getImportHistory(
  advisorId: string,
  limit = 10
): Promise<MemberImportLog[]> {
  if (!isSupabaseConfigured) {
    return getMockImportHistory();
  }

  try {
    const { data, error } = await supabase
      .from('member_import_logs')
      .select('*')
      .eq('advisor_id', advisorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[MemberIngestion] Error fetching import history:', error);
      return getMockImportHistory();
    }

    return data || [];
  } catch (err) {
    console.error('[MemberIngestion] Exception:', err);
    return getMockImportHistory();
  }
}

/**
 * Generate a CSV template for member import
 * @returns CSV content as a string
 */
export function generateCSVTemplate(): string {
  const headers = [
    'first_name',
    'last_name',
    'date_of_birth',
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

  const sampleRow = [
    'John',
    'Doe',
    '1985-06-15',
    'john.doe@example.com',
    '(555) 123-4567',
    'MEM001',
    '123 Main St',
    'Springfield',
    'IL',
    '62701',
    'standard',
    'active',
    '2024-01-15',
    'Sample member',
  ];

  return `${headers.join(',')}\n${sampleRow.join(',')}`;
}

/**
 * Download the CSV template
 */
export function downloadCSVTemplate(): void {
  const content = generateCSVTemplate();
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'member_import_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================
// Helper Functions
// ============================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidZipCode(zip: string): boolean {
  // US ZIP code formats: 12345 or 12345-6789
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
}

function normalizePhone(phone: string): string {
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX if 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Return original if not 10 digits
  return phone;
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;

  // Try various date formats
  const formats = [
    // ISO format
    /^(\d{4})-(\d{2})-(\d{2})$/,
    // US format MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // US format MM-DD-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ];

  // Try ISO format first
  if (formats[0].test(dateStr)) {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return dateStr;
    }
  }

  // Try US format MM/DD/YYYY
  const usMatch1 = dateStr.match(formats[1]);
  if (usMatch1) {
    const [, month, day, year] = usMatch1;
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(isoDate);
    if (!isNaN(date.getTime())) {
      return isoDate;
    }
  }

  // Try US format MM-DD-YYYY
  const usMatch2 = dateStr.match(formats[2]);
  if (usMatch2) {
    const [, month, day, year] = usMatch2;
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(isoDate);
    if (!isNaN(date.getTime())) {
      return isoDate;
    }
  }

  return null;
}

function simulateImport(
  validatedData: Partial<Member>[],
  _fileName: string
): ImportResult {
  // Simulate some random failures for demo purposes
  const failureRate = 0.05;
  const failures = Math.floor(validatedData.length * failureRate);

  return {
    success: failures === 0,
    importLogId: `mock-${Date.now()}`,
    totalProcessed: validatedData.length,
    successCount: validatedData.length - failures,
    failureCount: failures,
    errors: failures > 0
      ? [{ row: Math.floor(Math.random() * validatedData.length) + 1, message: 'Simulated error' }]
      : [],
  };
}

function getMockImportHistory(): MemberImportLog[] {
  return [
    {
      id: 'log-1',
      advisor_id: 'adv-001',
      file_name: 'january_members.csv',
      total_rows: 150,
      successful_rows: 148,
      failed_rows: 2,
      error_details: [
        { row: 45, field: 'email', message: 'Invalid email format', value: 'bad-email' },
        { row: 98, field: 'date_of_birth', message: 'Invalid date format', value: '13/45/2000' },
      ],
      status: 'completed',
      created_at: '2024-01-15T10:30:00Z',
      completed_at: '2024-01-15T10:32:00Z',
    },
    {
      id: 'log-2',
      advisor_id: 'adv-001',
      file_name: 'december_members.csv',
      total_rows: 75,
      successful_rows: 75,
      failed_rows: 0,
      error_details: [],
      status: 'completed',
      created_at: '2023-12-20T14:15:00Z',
      completed_at: '2023-12-20T14:16:00Z',
    },
    {
      id: 'log-3',
      advisor_id: 'adv-001',
      file_name: 'november_batch.csv',
      total_rows: 200,
      successful_rows: 195,
      failed_rows: 5,
      error_details: [],
      status: 'completed',
      created_at: '2023-11-10T09:00:00Z',
      completed_at: '2023-11-10T09:05:00Z',
    },
  ];
}
