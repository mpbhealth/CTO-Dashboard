import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Shield,
} from 'lucide-react';
import type { MemberPortfolioStats } from '../../../types/commandCenter';

interface CommandCenterKPIsProps {
  stats: MemberPortfolioStats;
  loading?: boolean;
}

interface KPICardData {
  title: string;
  value: number | string;
  icon: typeof Users;
  color: 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose';
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  subtitle?: string;
}

const colorMap = {
  cyan: {
    bg: 'from-cyan-500 to-cyan-700',
    icon: 'bg-cyan-400/30',
    trend: { positive: 'text-cyan-200', negative: 'text-rose-200' },
  },
  emerald: {
    bg: 'from-emerald-500 to-emerald-700',
    icon: 'bg-emerald-400/30',
    trend: { positive: 'text-emerald-200', negative: 'text-rose-200' },
  },
  amber: {
    bg: 'from-amber-500 to-amber-700',
    icon: 'bg-amber-400/30',
    trend: { positive: 'text-amber-200', negative: 'text-rose-200' },
  },
  violet: {
    bg: 'from-violet-500 to-violet-700',
    icon: 'bg-violet-400/30',
    trend: { positive: 'text-violet-200', negative: 'text-rose-200' },
  },
  rose: {
    bg: 'from-rose-500 to-rose-700',
    icon: 'bg-rose-400/30',
    trend: { positive: 'text-emerald-200', negative: 'text-rose-200' },
  },
};

function KPICard({ data, delay }: { data: KPICardData; delay: number }) {
  const colors = colorMap[data.color];
  const Icon = data.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`bg-gradient-to-br ${colors.bg} rounded-xl shadow-lg p-6 text-white hover:shadow-xl hover:scale-[1.02] transition-all cursor-default`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors.icon}`}>
          <Icon className="w-6 h-6" />
        </div>
        {data.trend && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              data.trend.isPositive ? colors.trend.positive : colors.trend.negative
            }`}
          >
            {data.trend.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {Math.abs(data.trend.value)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold mb-1">
        {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
      </div>
      <div className="text-white/80 font-medium">{data.title}</div>
      {data.subtitle && <div className="text-white/60 text-sm mt-1">{data.subtitle}</div>}
      {data.trend && (
        <div className="text-white/60 text-xs mt-2">{data.trend.label}</div>
      )}
    </motion.div>
  );
}

function KPICardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gray-300 rounded-lg" />
        <div className="w-12 h-5 bg-gray-300 rounded" />
      </div>
      <div className="w-24 h-9 bg-gray-300 rounded mb-2" />
      <div className="w-32 h-5 bg-gray-300 rounded" />
    </div>
  );
}

export default function CommandCenterKPIs({ stats, loading }: CommandCenterKPIsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const kpiCards: KPICardData[] = [
    {
      title: 'Total Members',
      value: stats.total_members,
      icon: Users,
      color: 'cyan',
      trend: {
        value: stats.growth_rate,
        isPositive: stats.growth_rate >= 0,
        label: 'vs last month',
      },
      subtitle: `${stats.active_members} active`,
    },
    {
      title: 'Active Members',
      value: stats.active_members,
      icon: UserCheck,
      color: 'emerald',
      subtitle: `${Math.round((stats.active_members / stats.total_members) * 100)}% of total`,
    },
    {
      title: 'Pending',
      value: stats.pending_members,
      icon: UserPlus,
      color: 'amber',
      subtitle: 'Awaiting activation',
    },
    {
      title: 'Retention Rate',
      value: `${stats.retention_rate}%`,
      icon: Shield,
      color: 'violet',
      trend: {
        value: stats.retention_rate >= 90 ? 2.3 : -1.5,
        isPositive: stats.retention_rate >= 90,
        label: 'vs industry avg',
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiCards.map((card, index) => (
        <KPICard key={card.title} data={card} delay={index * 0.1} />
      ))}
    </div>
  );
}

// Additional stats row component for expanded view
export function CommandCenterSecondaryStats({ stats }: { stats: MemberPortfolioStats }) {
  const secondaryStats = [
    {
      label: 'Inactive Members',
      value: stats.inactive_members,
      icon: Clock,
      color: 'text-gray-500',
    },
    {
      label: 'Cancelled',
      value: stats.cancelled_members,
      icon: Users,
      color: 'text-red-500',
    },
    {
      label: 'Avg. Tenure',
      value: `${Math.round(stats.avg_member_tenure_days / 30)} months`,
      icon: Target,
      color: 'text-blue-500',
    },
    {
      label: 'Growth Rate',
      value: `${stats.growth_rate > 0 ? '+' : ''}${stats.growth_rate}%`,
      icon: TrendingUp,
      color: stats.growth_rate >= 0 ? 'text-emerald-500' : 'text-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {secondaryStats.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-100 p-4 flex items-center gap-3"
          >
            <Icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
