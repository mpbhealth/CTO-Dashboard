import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Smartphone } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function InstallAppBanner() {
  const { canInstall, isIOS, isInstalled, promptInstall, dismissPrompt } = useInstallPrompt();

  if (isInstalled) return null;

  // iOS manual instructions
  if (isIOS) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-4 left-4 right-4 z-[55] max-w-md mx-auto"
        >
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">Install MPB Dashboard</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tap <Share className="w-3.5 h-3.5 inline-block mx-0.5 -mt-0.5" /> then
                  <span className="font-medium text-slate-300"> "Add to Home Screen"</span>
                </p>
              </div>
              <button
                onClick={dismissPrompt}
                className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Desktop / Android prompt
  if (!canInstall) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="fixed bottom-4 left-4 right-4 z-[55] max-w-md mx-auto"
      >
        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Install MPB Dashboard</h3>
              <p className="text-xs text-slate-400">Get faster access from your device</p>
            </div>
            <button
              onClick={promptInstall}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-sm font-medium transition-all whitespace-nowrap"
            >
              Install
            </button>
            <button
              onClick={dismissPrompt}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
