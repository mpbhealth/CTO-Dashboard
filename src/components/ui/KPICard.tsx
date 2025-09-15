//
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPIData } from '../../types/dashboard';

interface KPICardProps {
  data: KPIData;
}

export default function KPICard({ data }: KPICardProps) {
  const getTrendIcon = () => {
    switch (data.trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTrendColor = () => {
    switch (data.trend) {
      case 'up':
        return 'text-emerald-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow hover:shadow-md transition-shadow border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted text-sm font-medium">{data.title}</p>
          <p className="text-primary text-3xl font-bold mt-1">{data.value}</p>
        </div>
        <div className="flex items-center space-x-1">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {data.change}
          </span>
        </div>
      </div>
    </div>
  );
}
