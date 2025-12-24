'use client';

import { motion } from 'framer-motion';
import { Orbit, CheckSquare, Users, Kanban, Plus } from 'lucide-react';

/**
 * MPB Orbit - Task and Project Management
 * 
 * Placeholder page that will be migrated from the existing Orbit app
 */
export default function OrbitPage() {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Orbit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-space-grotesk)]">
              MPB Orbit
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Task and project management
            </p>
          </div>
        </div>
      </motion.div>

      {/* Coming Soon Card */}
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-600/10 rounded-2xl border border-violet-200 dark:border-violet-800 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Orbit className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            Orbit is Being Integrated
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The full MPB Orbit experience is being migrated into CommandOS.
            <br />
            All your tasks, projects, and boards will be available here soon.
          </p>

          {/* Feature Preview */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { icon: Kanban, label: 'Kanban Boards' },
              { icon: CheckSquare, label: 'Task Lists' },
              { icon: Users, label: 'Team Collaboration' },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.label}
                  className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl"
                >
                  <Icon className="w-8 h-8 text-violet-500 mx-auto mb-2" />
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {feature.label}
                  </div>
                </div>
              );
            })}
          </div>

          <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition-all">
            <Plus className="w-5 h-5" />
            Create Quick Task
          </button>
        </div>
      </motion.div>
    </div>
  );
}

