/**
 * Sanitize user input before using it in Supabase PostgREST filter syntax
 * (.ilike, .or, etc.). Strips characters that have special meaning in
 * PostgREST filter strings: . , ( ) ! % \
 * Also trims whitespace and caps length to prevent abuse.
 */
export function sanitizeSearchTerm(input: string): string {
  return input.replace(/[.,()\!\%\\]/g, '').trim().substring(0, 200);
}
