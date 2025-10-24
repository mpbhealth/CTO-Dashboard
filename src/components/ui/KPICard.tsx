import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  data: {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down';
    icon?: any;
  };
}

export default function KPICard({ data }: KPICardProps) {
  const { title, value, change, trend, icon: Icon } = data;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-sky-600" />}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-600'
          }`}>
            {trend === 'up' && <TrendingUp className="w-4 h-4" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4" />}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
}
