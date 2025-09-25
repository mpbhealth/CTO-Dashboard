// Lookup maps for data transformation
// These can be easily edited to accommodate new programs/products

export const productCodeMap: Record<string, string> = {
  'MPB Essentials': 'PROD-ESS',
  'MPB Plus': 'PROD-PLUS', 
  'MPB Premium': 'PROD-PREM',
  // Add additional program mappings here
};

export const productAdminLabelMap: Record<string, string> = {
  'MPB Essentials': 'Essentials',
  'MPB Plus': 'Plus',
  'MPB Premium': 'Premium',
  // Add additional admin label mappings here
};

export const productBenefitIdMap: Record<string, string> = {
  'MPB Essentials': 'BEN-1001',
  'MPB Plus': 'BEN-2001', 
  'MPB Premium': 'BEN-3001',
  // Add additional benefit ID mappings here
};

/**
 * Lookup helper function with fallback
 */
export function lookupWithFallback(
  map: Record<string, string>, 
  key: string | undefined, 
  fallback: string = ''
): string {
  if (!key) return fallback;
  return map[key] || fallback;
}

/**
 * Coalesce function - return first non-empty value
 */
export function coalesce(...values: (string | undefined | null)[]): string {
  for (const value of values) {
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return '';
}