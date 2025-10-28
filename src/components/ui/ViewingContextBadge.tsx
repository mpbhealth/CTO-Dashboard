import { Building2, Users, Eye } from 'lucide-react';

interface ViewingContextBadgeProps {
  context: 'company' | 'department' | 'team' | 'personal';
  label?: string;
  className?: string;
}

export function ViewingContextBadge({
  context,
  label,
  className = '',
}: ViewingContextBadgeProps) {
  const config = {
    company: {
      icon: Building2,
      color: 'bg-indigo-100 text-indigo-800',
      defaultLabel: 'Company View',
    },
    department: {
      icon: Building2,
      color: 'bg-pink-100 text-pink-800',
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
