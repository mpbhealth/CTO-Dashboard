import { Eye, EyeOff } from 'lucide-react';

interface VisibilityBadgeProps {
  isVisible: boolean;
  label?: string;
  className?: string;
}

export function VisibilityBadge({
  isVisible,
  label,
  className = '',
}: VisibilityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${
        isVisible
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-slate-100 text-slate-600'
      } ${className}`}
    >
      {isVisible ? (
        <Eye className="w-3 h-3" />
      ) : (
        <EyeOff className="w-3 h-3" />
      )}
      <span>{label || (isVisible ? 'Visible' : 'Hidden')}</span>
    </span>
  );
}

export default VisibilityBadge;
