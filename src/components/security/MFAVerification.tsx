/**
 * MFA Verification Component
 *
 * Prompts user to enter their TOTP code during login.
 * Used when user has MFA enabled and needs to complete second factor.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, XCircle, Loader2 } from 'lucide-react';
import { getMFAFactors, createMFAChallenge, verifyMFACode, type MFAFactor } from '@/lib/security';

interface MFAVerificationProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MFAVerification({ isOpen, onSuccess, onCancel }: MFAVerificationProps) {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [factor, setFactor] = useState<MFAFactor | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load MFA factors and create challenge
  useEffect(() => {
    if (!isOpen) return;

    const init = async () => {
      setIsLoading(true);
      setError(null);

      const factors = await getMFAFactors();
      const verifiedFactor = factors.find(f => f.status === 'verified');

      if (!verifiedFactor) {
        setError('No verified MFA factor found');
        setIsLoading(false);
        return;
      }

      setFactor(verifiedFactor);

      const challengeResult = await createMFAChallenge(verifiedFactor.id);

      if (challengeResult.success && challengeResult.challengeId) {
        setChallengeId(challengeResult.challengeId);
      } else {
        setError(challengeResult.error || 'Failed to create MFA challenge');
      }

      setIsLoading(false);
    };

    init();
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (value && index === 5) {
      const fullCode = newCode.join('');
      handleVerify(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
      } else {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);

      if (pastedData.length >= 6) {
        handleVerify(newCode.join(''));
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const handleVerify = async (fullCode: string) => {
    if (!factor || !challengeId) {
      setError('MFA not properly initialized');
      return;
    }

    setIsVerifying(true);
    setError(null);

    const result = await verifyMFACode(factor.id, challengeId, fullCode);

    setIsVerifying(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Invalid verification code');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      // Create a new challenge for retry
      const newChallenge = await createMFAChallenge(factor.id);
      if (newChallenge.success && newChallenge.challengeId) {
        setChallengeId(newChallenge.challengeId);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md mx-4"
        >
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border-2 border-cyan-500/30 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Two-Factor Authentication</h2>
              <p className="text-sm text-slate-400 mt-2">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            )}

            {/* Code Input */}
            {!isLoading && challengeId && (
              <>
                <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={isVerifying}
                      className={`
                        w-12 h-14 text-center text-2xl font-bold rounded-xl
                        bg-slate-800/50 border-2 transition-all duration-200
                        text-white placeholder-slate-500
                        focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                        disabled:opacity-50
                        ${error
                          ? 'border-red-500/50'
                          : digit
                            ? 'border-cyan-500/50'
                            : 'border-slate-600/50 hover:border-slate-500'
                        }
                      `}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {/* Verifying State */}
                {isVerifying && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    <span className="text-sm text-slate-400">Verifying...</span>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-6 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Help Text */}
                <p className="text-xs text-slate-500 text-center mb-6">
                  Open your authenticator app and enter the current code for MPB Health Dashboard
                </p>

                {/* Cancel Button */}
                <button
                  onClick={onCancel}
                  className="w-full py-3 px-4 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}

            {/* Error State (no challenge) */}
            {!isLoading && !challengeId && error && (
              <div className="text-center">
                <div className="mb-4 flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
                <button
                  onClick={onCancel}
                  className="w-full py-3 px-4 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-colors"
                >
                  Go Back
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
