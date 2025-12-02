import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, CheckCircle, XCircle, Fingerprint, ShieldCheck } from 'lucide-react';

const ACCESS_PIN = '087708';
const STORAGE_KEY = 'mpb_access_verified';

interface AccessGateProps {
  children: React.ReactNode;
}

export function AccessGate({ children }: AccessGateProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [pin, setPin] = useState<string[]>(['', '', '', '', '', '']);
  const [isShaking, setIsShaking] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if already verified on mount
  useEffect(() => {
    const verified = sessionStorage.getItem(STORAGE_KEY);
    setIsVerified(verified === 'true');
  }, []);

  const handleSuccess = useCallback(() => {
    setShowSuccess(true);
    setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setIsVerified(true);
    }, 1000);
  }, []);

  const handleError = useCallback(() => {
    setIsShaking(true);
    setShowError(true);
    setAttemptCount(prev => prev + 1);
    
    setTimeout(() => {
      setIsShaking(false);
      setShowError(false);
      setPin(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }, 800);
  }, []);

  const verifyPin = useCallback((enteredPin: string) => {
    if (enteredPin === ACCESS_PIN) {
      handleSuccess();
    } else {
      handleError();
    }
  }, [handleSuccess, handleError]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all digits are entered
    if (value && index === 5) {
      const fullPin = newPin.join('');
      verifyPin(fullPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
        const newPin = [...pin];
        newPin[index - 1] = '';
        setPin(newPin);
      } else {
        // Clear current input
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
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
      const newPin = [...pin];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newPin[i] = pastedData[i];
      }
      setPin(newPin);
      
      // Focus the next empty input or verify if complete
      if (pastedData.length >= 6) {
        verifyPin(newPin.join(''));
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  // Show loading state while checking session storage
  if (isVerified === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // If verified, render children
  if (isVerified) {
    return <>{children}</>;
  }

  // Render PIN gate
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M0 0h40v40H0z'/%3E%3Cpath d='M40 40h40v40H40z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* Ambient Lighting Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Main Card */}
        <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border-2 border-cyan-500/20">
          {/* Logo & Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <img
                src="/0001MPB.Health-Logo-png-1.png"
                alt="MPB Health"
                className="h-14 w-auto drop-shadow-2xl"
              />
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-20 h-20 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl border border-cyan-400/30"
            >
              <Lock className="w-10 h-10 text-white" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4 text-cyan-400 bg-cyan-500/20 border border-cyan-500/30">
                Secure Access
              </div>
              <h1 className="text-3xl font-bold mb-3 tracking-tight text-white">
                Enter Access PIN
              </h1>
              <p className="text-sm leading-relaxed text-slate-300">
                Enter your 6-digit access code to proceed
              </p>
            </motion.div>
          </div>

          {/* PIN Input */}
          <motion.div
            animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {pin.map((digit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                >
                  <input
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`
                      w-12 h-14 text-center text-2xl font-bold rounded-xl
                      bg-slate-800/50 border-2 transition-all duration-200
                      text-white placeholder-slate-500
                      focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                      ${showError 
                        ? 'border-red-500 bg-red-500/10' 
                        : showSuccess 
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : digit 
                            ? 'border-cyan-500/50' 
                            : 'border-slate-600/50 hover:border-slate-500'
                      }
                    `}
                    autoFocus={index === 0}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Status Messages */}
          <AnimatePresence mode="wait">
            {showError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-3"
              >
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-400">Access Denied</p>
                  <p className="text-xs text-red-400/70">Invalid access code. Please try again.</p>
                </div>
              </motion.div>
            )}

            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-3"
              >
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Access Granted</p>
                  <p className="text-xs text-emerald-400/70">Redirecting to portal...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attempt Counter (subtle warning) */}
          {attemptCount >= 3 && !showSuccess && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-xs text-amber-400/80 mb-4"
            >
              Multiple failed attempts detected
            </motion.p>
          )}

          {/* Security Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 pt-6 border-t border-slate-700/30"
          >
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-slate-400">AES-256</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-600"></div>
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-medium text-slate-400">HIPAA</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-600"></div>
              <div className="flex items-center space-x-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-medium text-slate-400">SOC 2</span>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 text-center">
              © 2025 MPB Health. All rights reserved.
            </p>
          </motion.div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-gradient-to-br from-purple-400/20 via-indigo-500/10 to-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </motion.div>
    </div>
  );
}

