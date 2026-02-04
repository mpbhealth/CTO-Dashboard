/**
 * Input Sanitization Utilities
 *
 * Comprehensive XSS protection and input validation.
 * Uses DOMPurify for HTML sanitization.
 */

import DOMPurify from 'dompurify';
import { z } from 'zod';

// Configure DOMPurify defaults
const DOMPURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'img'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id', 'style',
    'target', 'rel', 'width', 'height'
  ],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'],
  ADD_TAGS: [],
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  USE_PROFILES: { html: true },
};

// Strict config for user-generated content
const STRICT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
};

// Email content config (more permissive for displaying emails)
const EMAIL_CONFIG: DOMPurify.Config = {
  ...DOMPURIFY_CONFIG,
  ADD_ATTR: ['target'],
  FORCE_BODY: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string, config: 'default' | 'strict' | 'email' = 'default'): string {
  const configMap = {
    default: DOMPURIFY_CONFIG,
    strict: STRICT_CONFIG,
    email: EMAIL_CONFIG,
  };

  return DOMPurify.sanitize(html, configMap[config]);
}

/**
 * Strip all HTML tags, returning plain text
 */
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}

/**
 * Escape HTML entities for safe display
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize a URL (prevent javascript: and data: protocols)
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }

    return parsed.href;
  } catch {
    // Invalid URL
    return '';
  }
}

/**
 * Sanitize filename (remove path traversal attempts)
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\]/g, '') // Remove path separators
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[<>:"|?*]/g, '') // Remove Windows invalid chars
    .replace(/[\x00-\x1f\x80-\x9f]/g, '') // Remove control characters
    .trim();
}

// ============================================
// Zod Schemas for Input Validation
// ============================================

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(254, 'Email address too long')
  .transform(v => v.toLowerCase().trim());

/**
 * Phone number schema (flexible international format)
 */
export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-\+\(\)\.]{7,20}$/, 'Invalid phone number format')
  .transform(v => v.replace(/[\s\-\(\)\.]/g, ''));

/**
 * Name schema (person's name)
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters')
  .transform(v => v.trim());

/**
 * Username schema
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username too long')
  .regex(/^[a-zA-Z0-9_\-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

/**
 * UUID schema
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid ID format');

/**
 * URL schema
 */
export const urlSchema = z
  .string()
  .url('Invalid URL')
  .refine(url => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'URL must use HTTP or HTTPS');

/**
 * Date schema (ISO format)
 */
export const dateSchema = z
  .string()
  .datetime({ message: 'Invalid date format' });

/**
 * Safe text schema (strips HTML)
 */
export const safeTextSchema = z
  .string()
  .transform(v => stripHtml(v).trim());

/**
 * Rich text schema (sanitizes HTML)
 */
export const richTextSchema = z
  .string()
  .transform(v => sanitizeHtml(v, 'strict'));

/**
 * PIN schema (6 digits)
 */
export const pinSchema = z
  .string()
  .length(6, 'PIN must be 6 digits')
  .regex(/^\d{6}$/, 'PIN must contain only digits');

/**
 * SSN schema (partial, last 4 digits)
 */
export const ssnLastFourSchema = z
  .string()
  .length(4, 'Must be exactly 4 digits')
  .regex(/^\d{4}$/, 'Must contain only digits');

/**
 * Currency amount schema
 */
export const currencySchema = z
  .number()
  .min(0, 'Amount cannot be negative')
  .max(999999999.99, 'Amount too large')
  .transform(v => Math.round(v * 100) / 100); // Round to 2 decimal places

/**
 * Percentage schema
 */
export const percentageSchema = z
  .number()
  .min(0, 'Percentage cannot be negative')
  .max(100, 'Percentage cannot exceed 100');

// ============================================
// Form Validation Helpers
// ============================================

/**
 * Validate and sanitize form data
 */
export function validateFormData<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}

/**
 * Get formatted validation errors
 */
export function formatValidationErrors(errors: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  for (const issue of errors.issues) {
    const path = issue.path.join('.');
    if (!formatted[path]) {
      formatted[path] = issue.message;
    }
  }

  return formatted;
}

// ============================================
// Content Security
// ============================================

/**
 * Check if content contains potential XSS patterns
 */
export function detectXSSPatterns(content: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:\s*text\/html/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<form/gi,
    /expression\s*\(/gi,
    /url\s*\(\s*['"]?\s*javascript:/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(content));
}

/**
 * Sanitize object values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = stripHtml(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? stripHtml(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) :
        item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
