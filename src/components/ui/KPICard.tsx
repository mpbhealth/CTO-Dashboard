import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KPIData {
  id?: string;
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'success' | 'warning' | 'danger' | 'info';
}

interface KPICardProps {
  title?: string;
  value?: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: string;
  data?: KPIData;
}

export default function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = 'cyan',
  data,
}: KPICardProps) {
  // If data prop is provided, use it to populate the card
  const cardTitle = data?.label || title || '';
  const cardValue = data?.value || value || 0;
  const cardTrend = data?.change ? {
    value: Math.abs(data.change),
    isPositive: data.change > 0
  } : trend;
  const cardColor = data?.status === 'success' ? 'emerald' :
                    data?.status === 'warning' ? 'amber' :
                    data?.status === 'danger' ? 'red' :
                    data?.status === 'info' ? 'sky' :
                    color;
  // Standardized gradient color map for consistent stat cards
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    indigo: { bg: 'from-indigo-500 to-indigo-600', text: 'text-indigo-100', border: 'border-indigo-300' },
    emerald: { bg: 'from-emerald-500 to-emerald-600', text: 'text-emerald-100', border: 'border-emerald-300' },
    pink: { bg: 'from-pink-500 to-pink-600', text: 'text-pink-100', border: 'border-pink-300' },
    amber: { bg: 'from-amber-500 to-amber-600', text: 'text-amber-100', border: 'border-amber-300' },
    sky: { bg: 'from-sky-500 to-sky-600', text: 'text-sky-100', border: 'border-sky-300' },
    purple: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-100', border: 'border-purple-300' },
    red: { bg: 'from-red-500 to-red-600', text: 'text-red-100', border: 'border-red-300' },
    cyan: { bg: 'from-cyan-500 to-cyan-600', text: 'text-cyan-100', border: 'border-cyan-300' },
    teal: { bg: 'from-teal-500 to-teal-600', text: 'text-teal-100', border: 'border-teal-300' },
    rose: { bg: 'from-rose-500 to-rose-600', text: 'text-rose-100', border: 'border-rose-300' },
  };

  const colors = colorMap[cardColor] || colorMap.cyan;

  // Default icon based on trend
  const DefaultIcon = cardTrend?.isPositive ? TrendingUp : TrendingDown;
  const DisplayIcon = Icon || DefaultIcon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-br ${colors.bg} p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <DisplayIcon className="w-10 h-10 opacity-80" />
        <span className="text-3xl font-bold">{cardValue}</span>
      </div>
      <h3 className="text-lg font-semibold">{cardTitle}</h3>
      {subtitle && (
        <p className={`${colors.text} text-sm mt-1`}>{subtitle}</p>
      )}
      {cardTrend && (
        <div className="mt-3 flex items-center space-x-2">
          <span
            className={`text-sm font-medium ${
              cardTrend.isPositive ? 'text-green-200' : 'text-red-200'
            }`}
          >
            {cardTrend.isPositive ? '↑' : '↓'} {Math.abs(cardTrend.value)}%
          </span>
          <span className="text-xs opacity-75">vs last period</span>
        </div>
      )}
    </motion.div>
  );
}
