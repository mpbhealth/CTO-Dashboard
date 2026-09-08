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
      <div className="flex min-h-screen items-center justify-center bg-aryx-bg">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-aryx-line" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-aryx-accent" />
          </div>
          <p className="text-sm text-aryx-muted">Checking security status...</p>
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
        <div className="flex min-h-screen items-center justify-center bg-aryx-bg p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="cos-page w-full"
          >
            <div className="rounded-2xl border border-aryx-line bg-aryx-elevated p-8 shadow-xl">
              {/* Icon */}
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>

              {/* Title */}
              <h1 className="mb-2 text-center font-display text-2xl font-bold text-aryx-ink">
                Two-Factor Authentication Required
              </h1>

              {/* Description */}
              <p className="mb-6 text-center text-aryx-muted">
                Your role as <span className="font-medium text-aryx-ink">{profile?.role}</span>{' '}
                requires multi-factor authentication for HIPAA compliance.
              </p>

              {/* Benefits */}
              <div className="mb-6 rounded-xl bg-aryx-ink/5 p-4">
                <h3 className="mb-3 text-sm font-medium text-aryx-ink">
                  Why is MFA required?
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-aryx-muted">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span>Protects sensitive patient health information (PHI)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-aryx-muted">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span>Meets HIPAA security requirements</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-aryx-muted">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span>Prevents unauthorized access even if password is compromised</span>
                  </li>
                </ul>
              </div>

              {/* Setup Button */}
              <button
                onClick={() => setShowEnrollment(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-aryx-accent px-4 py-3 font-medium text-white transition-colors"
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
