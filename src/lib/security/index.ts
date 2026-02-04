/**
 * Security Module Index
 *
 * Centralized exports for all security-related functionality.
 */

// Access Gate
export {
  validateAccessPin,
  hashPin,
  isAccessVerified,
  setAccessVerified,
  clearAccessVerification,
  isLockedOut,
} from './accessGateService';

// Password Policy
export {
  validatePassword,
  getPasswordStrength,
  generateSecurePassword,
  DEFAULT_PASSWORD_POLICY,
  type PasswordValidationResult,
  type PasswordPolicy,
} from './passwordPolicy';

// Input Sanitization
export {
  sanitizeHtml,
  stripHtml,
  escapeHtml,
  sanitizeUrl,
  sanitizeFilename,
  detectXSSPatterns,
  sanitizeObject,
  validateFormData,
  formatValidationErrors,
  // Zod schemas
  emailSchema,
  phoneSchema,
  nameSchema,
  usernameSchema,
  uuidSchema,
  urlSchema,
  dateSchema,
  safeTextSchema,
  richTextSchema,
  pinSchema,
  ssnLastFourSchema,
  currencySchema,
  percentageSchema,
} from './inputSanitizer';

// MFA
export {
  isMFARequired,
  getMFAFactors,
  hasMFAEnabled,
  enrollMFA,
  verifyMFAEnrollment,
  createMFAChallenge,
  verifyMFACode,
  unenrollMFA,
  getMFAAuthLevel,
  needsMFAVerification,
  type MFAFactor,
  type MFAChallenge,
} from './mfaService';

// Rate Limiting
export {
  isRateLimited,
  recordRequest,
  checkRateLimit,
  getRemainingRequests,
  resetRateLimit,
  withRateLimit,
} from './rateLimiter';
