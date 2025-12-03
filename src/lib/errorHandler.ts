/**
 * Error handling utilities for Supabase operations
 * Provides user-friendly error messages for common database errors
 */

export interface SupabaseError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Parse a Supabase/PostgreSQL error and return a user-friendly message
 */
export function parseSupabaseError(error: unknown): string {
  if (!error) return 'An unknown error occurred';
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object') {
    const supabaseError = error as SupabaseError;
    
    // PostgreSQL error codes
    switch (supabaseError.code) {
      case '23505': // unique_violation
        return 'A record with this information already exists.';
      case '23503': // foreign_key_violation
        return 'This operation references data that does not exist.';
      case '23502': // not_null_violation
        return 'A required field is missing.';
      case '23514': // check_violation
        return 'The data provided does not meet the requirements.';
      case '42703': // undefined_column
        return 'Database schema mismatch - a column may be missing. Please contact your administrator.';
      case '42501': // insufficient_privilege
        return 'Permission denied - you may not have access to perform this operation.';
      case '42P01': // undefined_table
        return 'Database table not found. Please contact your administrator.';
      case '22P02': // invalid_text_representation
        return 'Invalid data format provided.';
      case '22003': // numeric_value_out_of_range
        return 'A numeric value is out of range.';
      case 'PGRST116': // PostgREST: not found
        return 'The requested record was not found.';
      case 'PGRST301': // PostgREST: JWT expired
        return 'Your session has expired. Please sign in again.';
      case 'PGRST302': // PostgREST: JWT invalid
        return 'Authentication error. Please sign in again.';
      default:
        break;
    }
    
    // Build error message from available fields
    let message = supabaseError.message || 'An error occurred';
    
    // Sanitize common technical messages
    if (message.includes('violates row-level security policy')) {
      return 'You do not have permission to perform this action.';
    }
    if (message.includes('violates foreign key constraint')) {
      return 'This operation references data that does not exist or cannot be deleted because it is in use.';
    }
    if (message.includes('duplicate key value violates unique constraint')) {
      return 'A record with this information already exists.';
    }
    if (message.includes('null value in column')) {
      return 'A required field is missing.';
    }
    
    // Add hint if available
    if (supabaseError.hint) {
      message += ` (${supabaseError.hint})`;
    }
    
    return message;
  }
  
  return String(error);
}

/**
 * Log error with context for debugging
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}

/**
 * Handle and parse error, logging it for debugging
 */
export function handleError(context: string, error: unknown): string {
  logError(context, error);
  return parseSupabaseError(error);
}

