import { Building2, Users, Eye } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface ViewingContextBadgeProps {
  context?: 'company' | 'department' | 'team' | 'personal';
  label?: string;
  className?: string;
}

export function ViewingContextBadge({
  context: contextProp,
  label,
  className = '',
}: ViewingContextBadgeProps) {
  const location = useLocation();

  const detectContextFromUrl = (): 'company' | 'department' | 'team' | 'personal' => {
    const pathname = location.pathname;

    if (pathname.includes('/departments/')) {
      return 'department';
    }

    if (pathname.includes('/team') || pathname.includes('/members')) {
      return 'team';
    }

    if (pathname.includes('/home') || pathname === '/ceod/home' || pathname === '/ctod/home') {
      return 'personal';
    }

    return 'company';
  };

  const context = contextProp || detectContextFromUrl();

  const config = {
    company: {
      icon: Building2,
      color: 'bg-blue-100 text-blue-800',
      defaultLabel: 'Company View',
    },
    department: {
      icon: Building2,
      color: 'bg-indigo-100 text-indigo-800',
      defaultLabel: 'Department View',
    },
    team: {
      icon: Users,
      color: 'bg-sky-100 text-sky-800',
      defaultLabel: 'Team View',
    },
    personal: {
      icon: Eye,
      color: 'bg-emerald-100 text-emerald-800',
      defaultLabel: 'Personal View',
    },
  };

  const { icon: Icon, color, defaultLabel } = config[context];

  return (
    <span
      className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-full ${color} ${className}`}
    >
      <Icon className="w-3 h-3" />
      <span>{label || defaultLabel}</span>
    </span>
  );
}

export default ViewingContextBadge;
