/**
 * MFA Enrollment Component
 *
 * Allows users to set up TOTP-based multi-factor authentication.
 * Required for admin and officer roles per HIPAA compliance.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Copy, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { enrollMFA, verifyMFAEnrollment } from '@/lib/security';

interface MFAEnrollmentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MFAEnrollment({ isOpen, onClose, onSuccess }: MFAEnrollmentProps) {
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [factorId, setFactorId] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleStartEnrollment = async () => {
    setIsLoading(true);
    setError(null);

    const result = await enrollMFA('MPB Health Dashboard');

    setIsLoading(false);

    if (result.success && result.factorId && result.qrCode && result.secret) {
      setFactorId(result.factorId);
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setStep('verify');
    } else {
      setError(result.error || 'Failed to start MFA enrollment');
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await verifyMFAEnrollment(factorId, verificationCode);

    setIsLoading(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || 'Verification failed');
      setVerificationCode('');
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(cleaned);
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
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {step === 'setup' ? 'Enable Two-Factor Authentication' : 'Verify Your Authenticator'}
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                {step === 'setup'
                  ? 'Add an extra layer of security to your account'
                  : 'Enter the code from your authenticator app'
                }
              </p>
            </div>

            {/* Setup Step */}
            {step === 'setup' && !qrCode && (
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="text-sm font-medium text-white mb-2">Requirements:</h3>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>• Keep your phone nearby to scan the QR code</li>
                    <li>• Save your backup codes in a secure location</li>
                  </ul>
                </div>

                <button
                  onClick={handleStartEnrollment}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Begin Setup'
                  )}
                </button>
              </div>
            )}

            {/* Verify Step */}
            {step === 'verify' && qrCode && (
              <div className="space-y-6">
                {/* QR Code */}
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-4">
                    Scan this QR code with your authenticator app:
                  </p>
                  <div className="bg-white p-4 rounded-xl inline-block">
                    <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                  </div>
                </div>

                {/* Manual Entry */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-2">
                    Or enter this code manually:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono text-cyan-400 bg-slate-900/50 px-3 py-2 rounded">
                      {secret}
                    </code>
                    <button
                      onClick={copySecret}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Verification Code Input */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Enter the 6-digit code from your app:
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={verificationCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="000000"
                    className="w-full text-center text-2xl font-mono tracking-widest py-4 px-4 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={isLoading || verificationCode.length !== 6}
                    className="flex-1 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Enable'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Initial Error */}
            {step === 'setup' && error && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Cancel button for setup step */}
            {step === 'setup' && !qrCode && (
              <button
                onClick={onClose}
                className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
