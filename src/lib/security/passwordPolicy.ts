/**
 * Password Policy Enforcement
 *
 * HIPAA and SOC 2 compliant password validation.
 * Enforces strong password requirements.
 */

export interface PasswordValidationResult {
  valid: boolean;
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
}

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minUniqueChars: number;
  preventCommonPasswords: boolean;
  preventUserInfo: boolean;
}

// HIPAA-compliant default policy
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minUniqueChars: 8,
  preventCommonPasswords: true,
  preventUserInfo: true,
};

// Common weak passwords to block
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  'qwerty', 'qwerty123', 'abc123', 'monkey', 'master', 'dragon', 'letmein',
  'login', 'admin', 'welcome', 'iloveyou', 'sunshine', 'princess', 'football',
  'baseball', 'soccer', 'hockey', 'batman', 'superman', 'trustno1', 'shadow',
  'ashley', 'michael', 'ninja', 'mustang', 'password1!', 'P@ssw0rd', 'P@ssword1',
  'Welcome1', 'Welcome123', 'Qwerty123', 'Admin123', 'Passw0rd', 'Test1234',
  'mpbhealth', 'mpb123', 'health123', 'dashboard', 'secure123'
]);

// Character class patterns
const PATTERNS = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  numbers: /[0-9]/,
  specialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/,
  repeatingChars: /(.)\1{2,}/, // 3+ repeating characters
  sequentialNumbers: /(012|123|234|345|456|567|678|789|890)/,
  sequentialLetters: /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i,
  keyboardSequence: /(qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm)/i,
};

/**
 * Validate password against policy
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
  userInfo?: { email?: string; name?: string }
): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Length checks
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  } else {
    score += 20;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 5;
  }

  if (password.length > policy.maxLength) {
    errors.push(`Password must be no more than ${policy.maxLength} characters`);
  }

  // Character class checks
  if (policy.requireUppercase && !PATTERNS.uppercase.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (PATTERNS.uppercase.test(password)) {
    score += 15;
  }

  if (policy.requireLowercase && !PATTERNS.lowercase.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (PATTERNS.lowercase.test(password)) {
    score += 15;
  }

  if (policy.requireNumbers && !PATTERNS.numbers.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (PATTERNS.numbers.test(password)) {
    score += 15;
  }

  if (policy.requireSpecialChars && !PATTERNS.specialChars.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  } else if (PATTERNS.specialChars.test(password)) {
    score += 15;
  }

  // Unique character check
  const uniqueChars = new Set(password.toLowerCase()).size;
  if (uniqueChars < policy.minUniqueChars) {
    errors.push(`Password must contain at least ${policy.minUniqueChars} unique characters`);
  } else {
    score += 10;
  }

  // Common password check
  if (policy.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.has(lowerPassword)) {
      errors.push('This password is too common. Please choose a more unique password.');
      score -= 30;
    }
  }

  // User info check
  if (policy.preventUserInfo && userInfo) {
    const lowerPassword = password.toLowerCase();
    if (userInfo.email) {
      const emailParts = userInfo.email.toLowerCase().split(/[@.]/);
      for (const part of emailParts) {
        if (part.length >= 3 && lowerPassword.includes(part)) {
          errors.push('Password should not contain parts of your email address');
          score -= 15;
          break;
        }
      }
    }
    if (userInfo.name) {
      const nameParts = userInfo.name.toLowerCase().split(/\s+/);
      for (const part of nameParts) {
        if (part.length >= 3 && lowerPassword.includes(part)) {
          errors.push('Password should not contain your name');
          score -= 15;
          break;
        }
      }
    }
  }

  // Pattern-based deductions
  if (PATTERNS.repeatingChars.test(password)) {
    suggestions.push('Avoid repeating characters (e.g., "aaa")');
    score -= 10;
  }

  if (PATTERNS.sequentialNumbers.test(password)) {
    suggestions.push('Avoid sequential numbers (e.g., "123")');
    score -= 10;
  }

  if (PATTERNS.sequentialLetters.test(password.toLowerCase())) {
    suggestions.push('Avoid sequential letters (e.g., "abc")');
    score -= 10;
  }

  if (PATTERNS.keyboardSequence.test(password.toLowerCase())) {
    suggestions.push('Avoid keyboard patterns (e.g., "qwerty")');
    score -= 10;
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  return {
    valid: errors.length === 0,
    score,
    errors,
    suggestions,
  };
}

/**
 * Get password strength label
 */
export function getPasswordStrength(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) return { label: 'Strong', color: 'green' };
  if (score >= 60) return { label: 'Good', color: 'blue' };
  if (score >= 40) return { label: 'Fair', color: 'yellow' };
  if (score >= 20) return { label: 'Weak', color: 'orange' };
  return { label: 'Very Weak', color: 'red' };
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + special;

  // Ensure at least one of each type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
