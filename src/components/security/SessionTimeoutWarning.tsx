/**
 * Session Timeout Warning Component
 *
 * HIPAA Compliance: Displays a warning before automatic logout
 * due to inactivity. Users can extend their session or log out.
 */

import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

export function SessionTimeoutWarning() {
  const { timeoutWarning, extendSession, signOut } = useAuth();

  if (timeoutWarning === null) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs} seconds`;
  };

  const isUrgent = timeoutWarning <= 30;

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
          <div className={`
            bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
            rounded-2xl shadow-2xl border-2 p-8
            ${isUrgent ? 'border-red-500/50' : 'border-amber-500/50'}
          `}>
            {/* Icon */}
            <div className={`
              w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center
              ${isUrgent
                ? 'bg-red-500/20 border border-red-500/30'
                : 'bg-amber-500/20 border border-amber-500/30'
              }
            `}>
              <Clock className={`w-8 h-8 ${isUrgent ? 'text-red-400' : 'text-amber-400'}`} />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-white text-center mb-2">
              Session Expiring Soon
            </h2>

            {/* Message */}
            <p className="text-slate-300 text-center mb-4">
              Your session will expire due to inactivity.
            </p>

            {/* Countdown */}
            <div className={`
              text-center py-4 px-6 rounded-xl mb-6
              ${isUrgent
                ? 'bg-red-500/10 border border-red-500/30'
                : 'bg-amber-500/10 border border-amber-500/30'
              }
            `}>
              <p className={`text-3xl font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>
                {formatTime(timeoutWarning)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Time remaining
              </p>
            </div>

            {/* HIPAA Notice */}
            <p className="text-xs text-slate-500 text-center mb-6">
              For your security and HIPAA compliance, sessions automatically
              end after 15 minutes of inactivity.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => signOut()}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-600 text-slate-300
                  hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
              <button
                onClick={() => extendSession()}
                className={`
                  flex-1 px-4 py-3 rounded-xl text-white font-medium
                  transition-colors flex items-center justify-center gap-2
                  ${isUrgent
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-cyan-600 hover:bg-cyan-700'
                  }
                `}
              >
                <RefreshCw className="w-4 h-4" />
                Stay Logged In
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
