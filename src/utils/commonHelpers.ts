import { STATUS_TYPES } from '../lib/constants';

// Common formatting utilities
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Status styling utilities
export const getStatusColor = (status: string, type: keyof typeof STATUS_TYPES) => {
  const statusMap: Record<string, Record<string, string>> = {
    ASSIGNMENT: {
      todo: 'bg-slate-100 text-slate-800',
      in_progress: 'bg-amber-100 text-amber-800',
      done: 'bg-emerald-100 text-emerald-800',
    },
    PROJECT: {
      Planning: 'bg-blue-100 text-blue-800',
      Building: 'bg-amber-100 text-amber-800',
      Live: 'bg-emerald-100 text-emerald-800',
    },
    ROADMAP: {
      Backlog: 'bg-slate-100 text-slate-800',
      'In Progress': 'bg-amber-100 text-amber-800',
      Complete: 'bg-emerald-100 text-emerald-800',
    },
    TECH_STACK: {
      Active: 'bg-emerald-100 text-emerald-800',
      Experimental: 'bg-amber-100 text-amber-800',
      Deprecated: 'bg-red-100 text-red-800',
    },
    TEAM_MEMBER: {
      Available: 'bg-emerald-500',
      'In Meeting': 'bg-amber-500',
      'Focus Time': 'bg-red-500',
      Away: 'bg-slate-500',
    },
  };

  return statusMap[type]?.[status] || 'bg-slate-100 text-slate-800';
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// String utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Number utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const getRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Date utilities
export const getDateRange = (days: number): { start: string; end: string } => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

export const getDaysBetween = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};
