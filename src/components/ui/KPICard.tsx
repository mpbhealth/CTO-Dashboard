import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: string;
}

export default function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = 'indigo',
}: KPICardProps) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    indigo: { bg: 'from-indigo-500 to-indigo-700', text: 'text-indigo-100', border: 'border-indigo-300' },
    emerald: { bg: 'from-emerald-500 to-emerald-700', text: 'text-emerald-100', border: 'border-emerald-300' },
    pink: { bg: 'from-pink-500 to-pink-700', text: 'text-pink-100', border: 'border-pink-300' },
    amber: { bg: 'from-amber-500 to-amber-700', text: 'text-amber-100', border: 'border-amber-300' },
    sky: { bg: 'from-sky-500 to-sky-700', text: 'text-sky-100', border: 'border-sky-300' },
    purple: { bg: 'from-purple-500 to-purple-700', text: 'text-purple-100', border: 'border-purple-300' },
    red: { bg: 'from-red-500 to-red-700', text: 'text-red-100', border: 'border-red-300' },
  };

  const colors = colorMap[color] || colorMap.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-br ${colors.bg} p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-10 h-10 opacity-80" />
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && (
        <p className={`${colors.text} text-sm mt-1`}>{subtitle}</p>
      )}
      {trend && (
        <div className="mt-3 flex items-center space-x-2">
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-200' : 'text-red-200'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs opacity-75">vs last period</span>
        </div>
      )}
    </motion.div>
  );
}
