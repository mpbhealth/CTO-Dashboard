'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  Calendar,
  FileText,
  Bell,
} from 'lucide-react';

/**
 * CEO Dashboard Home
 * 
 * Executive-level overview with:
 * - Key business metrics (Revenue, Users, Growth, Goals)
 * - Quick action cards
 * - Recent activity feed
 */
export default function CEOHomePage() {
  // Mock data - will be replaced with real data from Supabase
  const metrics = [
    {
      label: 'Total Revenue',
      value: '$2.4M',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Active Members',
      value: '12,847',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Growth Rate',
      value: '23.4%',
      change: '+2.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Goals Met',
      value: '87%',
      change: '-3.2%',
      trend: 'down',
      icon: Target,
      color: 'from-amber-500 to-orange-500',
    },
  ];

  const quickActions = [
    { label: 'View Analytics', icon: LayoutDashboard, href: '/ceo/analytics' },
    { label: 'Board Packet', icon: FileText, href: '/ceo/board' },
    { label: 'Calendar', icon: Calendar, href: '/ceo/organizer' },
    { label: 'Notifications', icon: Bell, href: '/ceo/notifications' },
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
          CEO Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Welcome back. Here&apos;s your executive overview.
        </p>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? ArrowUpRight : ArrowDownRight;
          const trendColor =
            metric.trend === 'up' ? 'text-emerald-500' : 'text-red-500';

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

      {/* Quick Actions */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {action.label}
                </span>
              </a>
            );
          })}
        </div>
      </motion.div>

      {/* Activity Feed Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Activity feed will appear here</p>
            <p className="text-sm mt-1">Real-time updates from across the organization</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

