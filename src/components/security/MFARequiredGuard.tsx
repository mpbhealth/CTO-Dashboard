/**
 * MFA Required Guard Component
 *
 * Enforces MFA for privileged roles (admin, officers, executives).
 * Blocks access until MFA is set up and verified.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isMFARequired, hasMFAEnabled, needsMFAVerification } from '@/lib/security';
import { MFAEnrollment } from './MFAEnrollment';
import { MFAVerification } from './MFAVerification';

interface MFARequiredGuardProps {
  children: React.ReactNode;
}

export function MFARequiredGuard({ children }: MFARequiredGuardProps) {
  const { profile, isDemoMode } = useAuth();
  const [checking, setChecking] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const requiresMFA = isMFARequired(profile?.role);

  useEffect(() => {
    const checkMFAStatus = async () => {
      // Skip MFA check in demo mode
      if (isDemoMode) {
        setChecking(false);
        return;
      }

      // Skip if role doesn't require MFA
      if (!requiresMFA) {
        setChecking(false);
        return;
      }

      try {
        const [enabled, needsVerify] = await Promise.all([
          hasMFAEnabled(),
          needsMFAVerification(),
        ]);

        setMfaEnabled(enabled);
        setNeedsVerification(needsVerify);

        // If MFA is enabled but needs verification this session, show verification
        if (enabled && needsVerify) {
          setShowVerification(true);
        }
      } catch (err) {
        console.error('[MFA Guard] Error checking MFA status:', err);
      }

      setChecking(false);
    };

    checkMFAStatus();
  }, [isDemoMode, requiresMFA]);

  const handleEnrollmentSuccess = () => {
    setMfaEnabled(true);
    setShowEnrollment(false);
  };

  const handleVerificationSuccess = () => {
    setNeedsVerification(false);
    setShowVerification(false);
  };

  // Loading state
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Checking security status...</p>
        </div>
      </div>
    );
  }

  // Skip for demo mode or roles that don't require MFA
  if (isDemoMode || !requiresMFA) {
    return <>{children}</>;
  }

  // Show verification dialog if needed
  if (showVerification) {
    return (
      <>
        {children}
        <MFAVerification
          isOpen={showVerification}
          onSuccess={handleVerificationSuccess}
          onCancel={() => {
            // Can't cancel - must verify
            // Could redirect to logout
          }}
        />
      </>
    );
  }

  // MFA enrollment required but not set up
  if (!mfaEnabled) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
                Two-Factor Authentication Required
              </h1>

              {/* Description */}
              <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
                Your role as <span className="font-medium text-slate-900 dark:text-white">{profile?.role}</span>{' '}
                requires multi-factor authentication for HIPAA compliance.
              </p>

              {/* Benefits */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                  Why is MFA required?
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Protects sensitive patient health information (PHI)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Meets HIPAA security requirements</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Prevents unauthorized access even if password is compromised</span>
                  </li>
                </ul>
              </div>

              {/* Setup Button */}
              <button
                onClick={() => setShowEnrollment(true)}
                className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Set Up Two-Factor Authentication
              </button>
            </div>
          </motion.div>
        </div>

        {/* Enrollment Dialog */}
        <MFAEnrollment
          isOpen={showEnrollment}
          onClose={() => setShowEnrollment(false)}
          onSuccess={handleEnrollmentSuccess}
        />
      </>
    );
  }

  // MFA is enabled and verified - render children
  return <>{children}</>;
}
