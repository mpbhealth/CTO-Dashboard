import { motion } from 'framer-motion';
import { Activity, AlertTriangle } from 'lucide-react';

export function SharedOverview() {
  return (
    <div className="space-y-8 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Overview</h1>
            <p className="text-slate-600 mt-2 text-lg">
              Company-wide insights and metrics
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-slate-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
            title="Refresh data"
          >
            <Activity className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Shared overview page under development</p>
        </div>
      </div>
    </div>
  );
}

export default SharedOverview;
