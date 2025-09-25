import { z } from 'zod';

// Source schema - original enrollment/status feed
export const SourceRowSchema = z.object({
  record_type: z.string().min(1, "record_type is required"),
  enrollment_id: z.string().optional(),
  member_id: z.string().min(1, "member_id is required"),
  enrollment_date: z.string().optional(),
  program_name: z.string().optional(),
  enrollment_status: z.string().optional(),
  enrollment_source: z.string().optional(),
  premium_amount: z.string().optional(),
  renewal_date: z.string().optional(),
  status_date: z.string().optional(),
  new_status: z.string().optional(),
  reason: z.string().optional(),
  source_system: z.string().optional(),
});

export type SourceRow = z.infer<typeof SourceRowSchema>;

// Target schema - template output
export const TargetRowSchema = z.object({
  'ID Customer': z.string(),
  'ID Product': z.string(),
  'Date Active': z.string(),
  'Date Inactive': z.string(),
  'Name First': z.string(),
  'Name Last': z.string(),
  'Product Admin Label': z.string(),
  'Product Benefit ID': z.string(),
  'Product Label': z.string(),
  'Date Created Member': z.string(),
  'Date First Billing': z.string(),
  'Date Last Payment': z.string(),
  'Date Next Billing': z.string(),
  'ID Agent': z.string(),
  'Last Payment': z.string(),
  'Last Transaction Amount': z.string(),
  'Product Amount': z.string(),
});

export type TargetRow = z.infer<typeof TargetRowSchema>;

// Intermediate processing schema
export const ProcessedRowSchema = z.object({
  member_id: z.string(),
  program_name: z.string(),
  enrollment_date: z.string().optional(),
  status_date: z.string().optional(),
  new_status: z.string().optional(),
  enrollment_source: z.string().optional(),
  premium_amount: z.string().optional(),
  renewal_date: z.string().optional(),
  record_type: z.enum(['enrollment', 'status_update', 'both']),
});

export type ProcessedRow = z.infer<typeof ProcessedRowSchema>;

// Target column order (must match exactly)
export const TARGET_COLUMNS: (keyof TargetRow)[] = [
  'ID Customer',
  'ID Product', 
  'Date Active',
  'Date Inactive',
  'Name First',
  'Name Last',
  'Product Admin Label',
  'Product Benefit ID',
  'Product Label',
  'Date Created Member',
  'Date First Billing',
  'Date Last Payment',
  'Date Next Billing',
  'ID Agent',
  'Last Payment',
  'Last Transaction Amount',
  'Product Amount'
];

// Status terms that indicate inactive/terminated enrollment
export const INACTIVE_STATUS_TERMS = ['inactive', 'cancelled', 'canceled', 'terminated'];

// Valid record types (normalized)
export const VALID_RECORD_TYPES = ['enrollment', 'status_update', 'both'] as const;