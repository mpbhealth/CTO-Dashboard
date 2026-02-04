/**
 * Password Strength Indicator Component
 *
 * Visual feedback for password strength during password entry.
 * Integrates with the password policy validation.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle } from 'lucide-react';
import { validatePassword, getPasswordStrength, type PasswordValidationResult } from '@/lib/security';

interface PasswordStrengthIndicatorProps {
  password: string;
  email?: string;
  name?: string;
  showRequirements?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  email,
  name,
  showRequirements = true,
  className = '',
}: PasswordStrengthIndicatorProps) {
  const validation = useMemo<PasswordValidationResult>(() => {
    if (!password) {
      return { valid: false, score: 0, errors: [], suggestions: [] };
    }
    return validatePassword(password, undefined, { email, name });
  }, [password, email, name]);

  const strength = useMemo(() => {
    return getPasswordStrength(validation.score);
  }, [validation.score]);

  const requirements = [
    { label: 'At least 12 characters', met: password.length >= 12 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) },
    { label: '8 unique characters', met: new Set(password.toLowerCase()).size >= 8 },
  ];

  const getStrengthColor = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      red: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-400' },
      orange: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-400' },
      yellow: { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-400' },
      blue: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400' },
      green: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-400' },
    };
    return colors[color] || colors.red;
  };

  const strengthColors = getStrengthColor(strength.color);

  if (!password) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Password strength</span>
          <span className={`text-xs font-medium ${strengthColors.text}`}>
            {strength.label}
          </span>
        </div>
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${strengthColors.bg} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${validation.score}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-2">
          {requirements.map((req, index) => (
            <div
              key={index}
              className={`flex items-center gap-1.5 text-xs ${
                req.met ? 'text-green-400' : 'text-slate-500'
              }`}
            >
              {req.met ? (
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {validation.suggestions.length > 0 && (
        <div className="space-y-1">
          {validation.suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="flex items-start gap-1.5 text-xs text-amber-400"
            >
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}

      {/* Policy Errors */}
      {validation.errors.length > 0 && !validation.valid && (
        <div className="space-y-1">
          {validation.errors.slice(0, 3).map((error, index) => (
            <div
              key={index}
              className="flex items-start gap-1.5 text-xs text-red-400"
            >
              <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Compact password strength bar (no requirements list)
 */
export function PasswordStrengthBar({
  password,
  email,
  name,
  className = '',
}: Omit<PasswordStrengthIndicatorProps, 'showRequirements'>) {
  return (
    <PasswordStrengthIndicator
      password={password}
      email={email}
      name={name}
      showRequirements={false}
      className={className}
    />
  );
}
