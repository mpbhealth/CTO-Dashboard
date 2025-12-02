import React from 'react';
import type { 
  DocStatus, 
  IncidentSeverity, 
  TaskStatus, 
  TaskPriority,
  RiskStatus,
  BAAStatus,
  AuditStatus,
  UserRole
} from '../../types/compliance';

interface ChipProps {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
}

const Chip: React.FC<ChipProps> = ({ label, variant, size = 'md' }) => {
  const variantClasses = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {label}
    </span>
  );
};

export const PolicyStatusChip: React.FC<{ status: DocStatus; size?: 'sm' | 'md' | 'lg' }> = ({ status, size }) => {
  const statusConfig: Record<DocStatus, { label: string; variant: ChipProps['variant'] }> = {
    draft: { label: 'Draft', variant: 'default' },
    in_review: { label: 'In Review', variant: 'info' },
    approved: { label: 'Approved', variant: 'success' },
    archived: { label: 'Archived', variant: 'default' },
  };

  const config = statusConfig[status];
  return <Chip label={config.label} variant={config.variant} size={size} />;
};

export const SeverityChip: React.FC<{ severity: IncidentSeverity; size?: 'sm' | 'md' | 'lg' }> = ({ severity, size }) => {
  const severityConfig: Record<IncidentSeverity, { label: string; variant: ChipProps['variant'] }> = {
    low: { label: 'Low', variant: 'info' },
    medium: { label: 'Medium', variant: 'warning' },
    high: { label: 'High', variant: 'error' },
    critical: { label: 'Critical', variant: 'error' },
  };

  const config = severityConfig[severity];
  return <Chip label={config.label} variant={config.variant} size={size} />;
};

export const TaskStatusChip: React.FC<{ status: TaskStatus; size?: 'sm' | 'md' | 'lg' }> = ({ status, size }) => {
  const statusConfig: Record<TaskStatus, { label: string; variant: ChipProps['variant'] }> = {
    todo: { label: 'To Do', variant: 'default' },
    in_progress: { label: 'In Progress', variant: 'info' },
    blocked: { label: 'Blocked', variant: 'warning' },
    done: { label: 'Done', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'default' },
  };

  const config = statusConfig[status];
  return <Chip label={config.label} variant={config.variant} size={size} />;
};

export const PriorityChip: React.FC<{ priority: TaskPriority; size?: 'sm' | 'md' | 'lg' }> = ({ priority, size }) => {
  const priorityConfig: Record<TaskPriority, { label: string; variant: ChipProps['variant'] }> = {
    low: { label: 'Low', variant: 'default' },
    medium: { label: 'Medium', variant: 'info' },
    high: { label: 'High', variant: 'warning' },
    urgent: { label: 'Urgent', variant: 'error' },
  };

  const config = priorityConfig[priority];
  return <Chip label={config.label} variant={config.variant} size={size} />;
};

export const RiskStatusChip: React.FC<{ status: RiskStatus; size?: 'sm' | 'md' | 'lg' }> = ({ status, size }) => {
  const statusConfig: Record<RiskStatus, { label: string; variant: ChipProps['variant'] }> = {
    open: { label: 'Open', variant: 'warning' },
    mitigating: { label: 'Mitigating', variant: 'info' },
    accepted: { label: 'Accepted', variant: 'default' },
    closed: { label: 'Closed', variant: 'success' },
  };

  const config = statusConfig[status];
  return <Chip label={config.label} variant={config.variant} size={size} />;
};

export const BAAStatusChip: React.FC<{ status: BAAStatus; size?: 'sm' | 'md' | 'lg' }> = ({ status, size }) => {
  const statusConfig: Record<BAAStatus, { label: string; variant: ChipProps['variant'] }> = {
    active: { label: 'Active', variant: 'success' },
    pending: { label: 'Pending', variant: 'warning' },
    expired: { label: 'Expired', variant: 'error' },
    terminated: { label: 'Terminated', variant: 'default' },
  };

  const config = statusConfig[status];
  return <Chip label={config.label} variant={config.variant} size={size} />;
};

export const AuditStatusChip: React.FC<{ status: AuditStatus; size?: 'sm' | 'md' | 'lg' }> = ({ status, size }) => {
  const statusConfig: Record<AuditStatus, { label: string; variant: ChipProps['variant'] }> = {
    planned: { label: 'Planned', variant: 'default' },
    'in-progress': { label: 'In Progress', variant: 'info' },
    completed: { label: 'Completed', variant: 'success' },
    archived: { label: 'Archived', variant: 'default' },
  };

  const config = statusConfig[status];
  return <Chip label={config.label} variant={config.variant} size={size} />;
};

export const RoleBadge: React.FC<{ role: UserRole; size?: 'sm' | 'md' | 'lg' }> = ({ role, size }) => {
  const roleConfig: Record<UserRole, { label: string; variant: ChipProps['variant'] }> = {
    admin: { label: 'Admin', variant: 'error' },
    hipaa_officer: { label: 'HIPAA Officer', variant: 'success' },
    privacy_officer: { label: 'Privacy Officer', variant: 'info' },
    security_officer: { label: 'Security Officer', variant: 'info' },
    legal: { label: 'Legal', variant: 'warning' },
    auditor: { label: 'Auditor', variant: 'default' },
    staff: { label: 'Staff', variant: 'default' },
  };

  const config = roleConfig[role];
  return <Chip label={config.label} variant={config.variant} size={size} />;
};

export const RiskScoreChip: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg' }> = ({ score, size }) => {
  let variant: ChipProps['variant'] = 'default';
  
  if (score >= 20) variant = 'error';
  else if (score >= 12) variant = 'warning';
  else if (score >= 6) variant = 'info';
  
  return <Chip label={`Risk: ${score}`} variant={variant} size={size} />;
};

