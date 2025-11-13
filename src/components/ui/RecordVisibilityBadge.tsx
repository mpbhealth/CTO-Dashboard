import { Lock, Globe, Users } from 'lucide-react';

interface RecordVisibilityBadgeProps {
  visibility: 'private' | 'org' | 'shared';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function RecordVisibilityBadge({ visibility, size = 'md', showLabel = true }: RecordVisibilityBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const config = {
    private: {
      icon: Lock,
      label: 'Private',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200'
    },
    org: {
      icon: Globe,
      label: 'Organization',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    shared: {
      icon: Users,
      label: 'Shared',
      bgColor: 'bg-pink-100',
      textColor: 'text-pink-700',
      borderColor: 'border-pink-200'
    }
  };

  const { icon: Icon, label, bgColor, textColor, borderColor } = config[visibility];

  return (
    <span
      className={`
        inline-flex items-center space-x-1.5 rounded-full border font-medium
        ${sizeClasses[size]} ${bgColor} ${textColor} ${borderColor}
      `}
      title={label}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{label}</span>}
    </span>
  );
}
