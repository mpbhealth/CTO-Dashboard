import { useNavigate } from 'react-router-dom';
import { Users, FileText, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import { useAdminStats } from './AdminStatsContext';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: 'blue' | 'purple' | 'emerald' | 'red' | 'amber';
  urgent?: boolean;
  urgentValue?: number;
  link?: string;
  formatAsCurrency?: boolean;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    icon: 'text-blue-600',
    text: 'text-blue-700',
    ring: 'ring-blue-500/30',
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    icon: 'text-purple-600',
    text: 'text-purple-700',
    ring: 'ring-purple-500/30',
  },
  emerald: {
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    icon: 'text-emerald-600',
    text: 'text-emerald-700',
    ring: 'ring-emerald-500/30',
  },
  red: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    icon: 'text-red-600',
    text: 'text-red-700',
    ring: 'ring-red-500/30',
  },
  amber: {
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    icon: 'text-amber-600',
    text: 'text-amber-700',
    ring: 'ring-amber-500/30',
  },
};

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  urgent, 
  urgentValue,
  link,
  formatAsCurrency 
}: StatCardProps) {
  const navigate = useNavigate();
  const colors = colorClasses[color];
  
  const displayValue = formatAsCurrency
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value as number)
    : typeof value === 'number' ? value.toLocaleString() : value;

  const handleClick = () => {
    if (link) navigate(link);
  };

  return (
    <button
      onClick={handleClick}
      disabled={!link}
      className={`
        relative flex items-center gap-3 p-4 rounded-xl
        ${colors.bg} 
        transition-all duration-200 
        ${link ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]' : 'cursor-default'}
        ${urgent && urgentValue && urgentValue > 0 ? `ring-2 ${colors.ring}` : ''}
        w-full text-left
      `}
    >
      {/* Urgent indicator */}
      {urgent && urgentValue && urgentValue > 0 && (
        <span className="absolute top-2 right-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        </span>
      )}
      
      <div className={`p-2.5 rounded-lg ${colors.iconBg}`}>
        <Icon className={`w-5 h-5 ${colors.icon}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
        <p className={`text-lg font-bold ${colors.text} truncate`}>{displayValue}</p>
      </div>
    </button>
  );
}

export function AdminStatsBar() {
  const { stats, loading, refreshStats, lastUpdated } = useAdminStats();

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Quick Stats</h2>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-slate-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={refreshStats}
              disabled={loading}
              className={`
                p-1.5 rounded-lg text-slate-400 
                hover:bg-slate-100 hover:text-slate-600
                transition-all duration-200
                ${loading ? 'animate-spin' : ''}
              `}
              title="Refresh stats"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Members"
            value={stats.total_members}
            icon={Users}
            color="blue"
            link="/admin/members"
          />
          
          <StatCard
            label="Pending Claims"
            value={stats.pending_claims}
            icon={FileText}
            color={stats.pending_claims > 0 ? 'amber' : 'purple'}
            urgent={true}
            urgentValue={stats.pending_claims}
            link="/admin/claims"
          />
          
          <StatCard
            label="Revenue MTD"
            value={stats.total_revenue_this_month}
            icon={DollarSign}
            color="emerald"
            formatAsCurrency={true}
            link="/admin/transactions"
          />
          
          <StatCard
            label="Open Tickets"
            value={stats.pending_support_tickets}
            icon={AlertCircle}
            color={stats.pending_support_tickets > 0 ? 'red' : 'blue'}
            urgent={true}
            urgentValue={stats.pending_support_tickets}
            link="/admin/support"
          />
        </div>
      </div>
    </div>
  );
}

export default AdminStatsBar;

