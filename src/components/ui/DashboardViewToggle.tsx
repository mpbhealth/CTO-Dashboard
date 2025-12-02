import { LayoutDashboard, LayoutList } from 'lucide-react';

interface DashboardViewToggleProps {
  view: 'dashboard' | 'list';
  onViewChange: (view: 'dashboard' | 'list') => void;
  className?: string;
}

export function DashboardViewToggle({
  view,
  onViewChange,
  className = '',
}: DashboardViewToggleProps) {
  return (
    <div className={`inline-flex rounded-lg border border-slate-300 bg-white ${className}`}>
      <button
        onClick={() => onViewChange('dashboard')}
        className={`px-4 py-2 rounded-l-lg flex items-center space-x-2 transition-colors ${
          view === 'dashboard'
            ? 'bg-indigo-600 text-white'
            : 'text-slate-700 hover:bg-slate-50'
        }`}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span className="text-sm font-medium">Dashboard</span>
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`px-4 py-2 rounded-r-lg flex items-center space-x-2 transition-colors border-l ${
          view === 'list'
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'text-slate-700 hover:bg-slate-50 border-slate-300'
        }`}
      >
        <LayoutList className="w-4 h-4" />
        <span className="text-sm font-medium">List</span>
      </button>
    </div>
  );
}

export default DashboardViewToggle;
