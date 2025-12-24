'use client';

import { motion } from 'framer-motion';
import {
  Server,
  Code,
  Shield,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  GitBranch,
  Bug,
  Clock,
  CheckCircle2,
} from 'lucide-react';

/**
 * CTO Dashboard Home
 * 
 * Technology-focused overview with:
 * - System health metrics
 * - Development velocity
 * - Security status
 * - Quick access to key tools
 */
export default function CTOHomePage() {
  // Mock data - will be replaced with real data from Supabase
  const metrics = [
    {
      label: 'System Uptime',
      value: '99.98%',
      change: '+0.12%',
      trend: 'up',
      icon: Server,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Deploy Velocity',
      value: '47/wk',
      change: '+15%',
      trend: 'up',
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Security Score',
      value: '94/100',
      change: '+3',
      trend: 'up',
      icon: Shield,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Open Issues',
      value: '23',
      change: '-8',
      trend: 'down',
      icon: Bug,
      color: 'from-amber-500 to-orange-500',
    },
  ];

  const recentDeployments = [
    { name: 'api-v2.3.1', status: 'success', time: '2 hours ago', branch: 'main' },
    { name: 'dashboard-fix', status: 'success', time: '5 hours ago', branch: 'hotfix' },
    { name: 'auth-update', status: 'pending', time: 'In progress', branch: 'feature' },
  ];

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-space-grotesk)]">
          CTO Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Engineering metrics and system health at a glance.
        </p>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? ArrowUpRight : ArrowDownRight;
          const trendColor =
            metric.label === 'Open Issues'
              ? metric.trend === 'down'
                ? 'text-emerald-500'
                : 'text-red-500'
              : metric.trend === 'up'
              ? 'text-emerald-500'
              : 'text-red-500';

          return (
            <motion.div
              key={metric.label}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 ${trendColor}`}>
                  <TrendIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{metric.change}</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metric.value}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {metric.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deployments */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            Recent Deployments
          </h2>
          <div className="space-y-4">
            {recentDeployments.map((deploy) => (
              <div
                key={deploy.name}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  {deploy.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                  )}
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {deploy.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {deploy.branch}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {deploy.time}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Engineering Tools
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Tech Stack', href: '/cto/development/tech-stack', icon: Server },
              { label: 'Projects', href: '/cto/development/projects', icon: GitBranch },
              { label: 'Compliance', href: '/cto/compliance', icon: Shield },
              { label: 'API Status', href: '/cto/infrastructure/api-status', icon: Zap },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <a
                  key={tool.label}
                  href={tool.href}
                  className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {tool.label}
                  </span>
                </a>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

