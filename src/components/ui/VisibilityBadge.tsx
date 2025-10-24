import { Lock, Share2, Globe } from 'lucide-react';
import type { Visibility } from '../../lib/dualDashboard';

interface VisibilityBadgeProps {
  visibility: Visibility;
  size?: 'sm' | 'md';
}

export function VisibilityBadge({ visibility, size = 'sm' }: VisibilityBadgeProps) {
  const configs = {
    private: {
      label: 'Private',
      icon: Lock,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      iconColor: 'text-gray-500',
    },
    shared_to_cto: {
      label: 'Shared with CTO',
      icon: Share2,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-500',
    },
    shared_to_ceo: {
      label: 'Shared with CEO',
      icon: Share2,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      iconColor: 'text-purple-500',
    },
    org_public: {
      label: 'Organization',
      icon: Globe,
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      iconColor: 'text-green-500',
    },
  };

  const config = configs[visibility];
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 12 : 16;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bgColor} ${config.textColor} ${padding} ${textSize}`}
    >
      <Icon size={iconSize} className={config.iconColor} />
      {config.label}
    </span>
  );
}
