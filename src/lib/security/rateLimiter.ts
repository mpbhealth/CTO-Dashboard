/**
 * Rate Limiting Service
 *
 * Client-side rate limiting to prevent abuse.
 * Complements server-side rate limiting for defense in depth.
 */

import { logSecurityEvent } from '../auditService';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
}

interface RateLimitState {
  requests: number[];
  blockedUntil: number | null;
}

// Default configurations for different action types
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Login attempts: 5 per 15 minutes, block for 30 minutes
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 30 * 60 * 1000,
  },
  // API calls: 100 per minute, block for 5 minutes
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    blockDurationMs: 5 * 60 * 1000,
  },
  // Password reset: 3 per hour, block for 1 hour
  passwordReset: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
    blockDurationMs: 60 * 60 * 1000,
  },
  // File upload: 20 per minute, block for 10 minutes
  fileUpload: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    blockDurationMs: 10 * 60 * 1000,
  },
  // Data export: 5 per hour, block for 2 hours
  dataExport: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
    blockDurationMs: 2 * 60 * 60 * 1000,
  },
  // Search: 30 per minute, block for 2 minutes
  search: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    blockDurationMs: 2 * 60 * 1000,
  },
};

// In-memory storage for rate limit states
const rateLimitStates: Map<string, RateLimitState> = new Map();

/**
 * Get storage key for rate limit
 */
function getStorageKey(action: string, identifier?: string): string {
  return `ratelimit_${action}_${identifier || 'default'}`;
}

/**
 * Load rate limit state from sessionStorage
 */
function loadState(key: string): RateLimitState {
  // Check memory first
  if (rateLimitStates.has(key)) {
    return rateLimitStates.get(key)!;
  }

  // Try sessionStorage
  try {
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const state = JSON.parse(stored) as RateLimitState;
      rateLimitStates.set(key, state);
      return state;
    }
  } catch {
    // Ignore parse errors
  }

  // Initialize new state
  const newState: RateLimitState = { requests: [], blockedUntil: null };
  rateLimitStates.set(key, newState);
  return newState;
}

/**
 * Save rate limit state to sessionStorage
 */
function saveState(key: string, state: RateLimitState): void {
  rateLimitStates.set(key, state);
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clean up old requests outside the window
 */
function cleanOldRequests(requests: number[], windowMs: number): number[] {
  const cutoff = Date.now() - windowMs;
  return requests.filter(timestamp => timestamp > cutoff);
}

/**
 * Check if an action is rate limited
 */
export function isRateLimited(
  action: keyof typeof RATE_LIMIT_CONFIGS | string,
  identifier?: string
): { limited: boolean; remainingMs?: number; retryAfter?: Date } {
  const config = RATE_LIMIT_CONFIGS[action] || RATE_LIMIT_CONFIGS.api;
  const key = getStorageKey(action, identifier);
  const state = loadState(key);

  // Check if currently blocked
  if (state.blockedUntil && state.blockedUntil > Date.now()) {
    const remainingMs = state.blockedUntil - Date.now();
    return {
      limited: true,
      remainingMs,
      retryAfter: new Date(state.blockedUntil),
    };
  }

  // Clear block if expired
  if (state.blockedUntil && state.blockedUntil <= Date.now()) {
    state.blockedUntil = null;
    state.requests = [];
    saveState(key, state);
  }

  // Clean old requests and check count
  state.requests = cleanOldRequests(state.requests, config.windowMs);

  if (state.requests.length >= config.maxRequests) {
    // Apply block
    state.blockedUntil = Date.now() + config.blockDurationMs;
    saveState(key, state);

    // Log rate limit event
    logSecurityEvent('RATE_LIMIT', `Rate limit exceeded for ${action}`, {
      severity: 'CRITICAL',
      details: {
        action,
        identifier,
        requestCount: state.requests.length,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        blockDurationMs: config.blockDurationMs,
      }
    }).catch(() => {});

    return {
      limited: true,
      remainingMs: config.blockDurationMs,
      retryAfter: new Date(state.blockedUntil),
    };
  }

  return { limited: false };
}

/**
 * Record a request for rate limiting
 */
export function recordRequest(
  action: keyof typeof RATE_LIMIT_CONFIGS | string,
  identifier?: string
): void {
  const config = RATE_LIMIT_CONFIGS[action] || RATE_LIMIT_CONFIGS.api;
  const key = getStorageKey(action, identifier);
  const state = loadState(key);

  // Don't record if blocked
  if (state.blockedUntil && state.blockedUntil > Date.now()) {
    return;
  }

  // Clean and add new request
  state.requests = cleanOldRequests(state.requests, config.windowMs);
  state.requests.push(Date.now());
  saveState(key, state);
}

/**
 * Check and record in one call
 * Returns true if the request should proceed, false if rate limited
 */
export function checkRateLimit(
  action: keyof typeof RATE_LIMIT_CONFIGS | string,
  identifier?: string
): { allowed: boolean; remainingMs?: number; retryAfter?: Date } {
  const limitCheck = isRateLimited(action, identifier);

  if (limitCheck.limited) {
    return { allowed: false, ...limitCheck };
  }

  recordRequest(action, identifier);
  return { allowed: true };
}

/**
 * Get remaining requests before rate limit
 */
export function getRemainingRequests(
  action: keyof typeof RATE_LIMIT_CONFIGS | string,
  identifier?: string
): number {
  const config = RATE_LIMIT_CONFIGS[action] || RATE_LIMIT_CONFIGS.api;
  const key = getStorageKey(action, identifier);
  const state = loadState(key);

  if (state.blockedUntil && state.blockedUntil > Date.now()) {
    return 0;
  }

  const cleanedRequests = cleanOldRequests(state.requests, config.windowMs);
  return Math.max(0, config.maxRequests - cleanedRequests.length);
}

/**
 * Reset rate limit for an action (admin function)
 */
export function resetRateLimit(
  action: keyof typeof RATE_LIMIT_CONFIGS | string,
  identifier?: string
): void {
  const key = getStorageKey(action, identifier);
  const newState: RateLimitState = { requests: [], blockedUntil: null };
  saveState(key, newState);
}

/**
 * Create a rate-limited wrapper for async functions
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  action: keyof typeof RATE_LIMIT_CONFIGS | string,
  getIdentifier?: (...args: Parameters<T>) => string
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const identifier = getIdentifier?.(...args);
    const check = checkRateLimit(action, identifier);

    if (!check.allowed) {
      const error = new Error(
        `Rate limit exceeded. Please try again ${check.retryAfter ? `after ${check.retryAfter.toLocaleTimeString()}` : 'later'}.`
      );
      (error as Error & { retryAfter?: Date }).retryAfter = check.retryAfter;
      throw error;
    }

    return fn(...args) as Promise<ReturnType<T>>;
  };
}
