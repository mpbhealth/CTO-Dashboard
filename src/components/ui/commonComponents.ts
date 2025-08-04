import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, formatDate, getStatusColor } from '../utils/commonHelpers';

// Common animation variants
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3 }
};

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3 }
};

// Common loading spinner component
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-indigo-600 ${sizeClasses[size]}`} />
  );
};

// Common error message component
export const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({ 
  message, 
  onRetry 
}) => (
  <div className="text-center py-8">
    <p className="text-red-600 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Retry
      </button>
    )}
  </div>
);

// Common empty state component
export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}> = ({ icon, title, description, action }) => (
  <div className="text-center py-12">
    <div className="w-12 h-12 text-slate-400 mx-auto mb-4">{icon}</div>
    <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 mb-4">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

// Common status badge component
export const StatusBadge: React.FC<{
  status: string;
  type: 'assignment' | 'project' | 'roadmap' | 'tech_stack' | 'team_member';
}> = ({ status, type }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status, type)}`}>
    {status}
  </span>
);