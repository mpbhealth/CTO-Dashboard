/**
 * Security Audit Hook
 * 
 * React hooks for security audit logging and querying.
 * Integrates with the auditService for SOC 2 and HIPAA compliance.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  logSecurityEvent,
  logPHIAccess,
  logDataExport,
  logAdminAction,
  logSecurityAlert,
  queryAuditLogs,
  getRecentCriticalEvents,
  getUserActivityLog,
  getPHIAccessLog,
  getAuditStatistics,
  type SecurityEventType,
  type SecuritySeverity,
  type ResourceType,
  type SecurityAuditEntry,
  type AuditLogQueryOptions,
} from '../lib/auditService';

// ============================================
// Query Keys
// ============================================

const AUDIT_QUERY_KEYS = {
  all: ['security-audit'] as const,
  logs: (options: AuditLogQueryOptions) => [...AUDIT_QUERY_KEYS.all, 'logs', options] as const,
  critical: () => [...AUDIT_QUERY_KEYS.all, 'critical'] as const,
  userActivity: (userId: string) => [...AUDIT_QUERY_KEYS.all, 'user', userId] as const,
  phiAccess: (resourceId: string) => [...AUDIT_QUERY_KEYS.all, 'phi', resourceId] as const,
  statistics: (days: number) => [...AUDIT_QUERY_KEYS.all, 'stats', days] as const,
};

// ============================================
// Query Hooks
// ============================================

/**
 * Hook to query audit logs with filters
 */
export function useAuditLogs(options: AuditLogQueryOptions = {}) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.logs(options),
    queryFn: () => queryAuditLogs(options),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}

/**
 * Hook to get recent critical security events
 */
export function useCriticalEvents(limit: number = 10) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.critical(),
    queryFn: () => getRecentCriticalEvents(limit),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // More frequent for critical events
  });
}

/**
 * Hook to get user activity log
 */
export function useUserActivityLog(userId?: string, limit: number = 50) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.userActivity(targetUserId || ''),
    queryFn: () => getUserActivityLog(targetUserId || '', limit),
    enabled: !!targetUserId,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to get PHI access log for a record
 */
export function usePHIAccessLog(resourceId: string, limit: number = 50) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.phiAccess(resourceId),
    queryFn: () => getPHIAccessLog(resourceId, limit),
    enabled: !!resourceId,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to get audit statistics
 */
export function useAuditStatistics(days: number = 30) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.statistics(days),
    queryFn: () => getAuditStatistics(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Hook for logging security events
 */
export function useLogSecurityEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      eventType: SecurityEventType;
      action: string;
      options?: {
        severity?: SecuritySeverity;
        resourceType?: ResourceType;
        resourceId?: string;
        details?: Record<string, unknown>;
      };
    }) => logSecurityEvent(params.eventType, params.action, params.options),
    onSuccess: () => {
      // Invalidate audit queries to refresh data
      queryClient.invalidateQueries({ queryKey: AUDIT_QUERY_KEYS.all });
    },
  });
}

/**
 * Hook for logging PHI access
 */
export function useLogPHIAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      action: 'VIEW' | 'EXPORT' | 'MODIFY' | 'DELETE';
      resourceId: string;
      details: {
        recordType?: string;
        fieldAccessed?: string[];
        purpose?: string;
        patientId?: string;
      };
    }) => logPHIAccess(params.action, params.resourceId, params.details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUDIT_QUERY_KEYS.all });
    },
  });
}

/**
 * Hook for logging data exports
 */
export function useLogDataExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      resourceType: ResourceType;
      recordCount: number;
      format: string;
      details?: Record<string, unknown>;
    }) => logDataExport(params.resourceType, params.recordCount, params.format, params.details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUDIT_QUERY_KEYS.all });
    },
  });
}

/**
 * Hook for logging admin actions
 */
export function useLogAdminAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      action: string;
      resourceType: ResourceType;
      resourceId: string;
      details?: Record<string, unknown>;
    }) => logAdminAction(params.action, params.resourceType, params.resourceId, params.details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUDIT_QUERY_KEYS.all });
    },
  });
}

/**
 * Hook for logging security alerts
 */
export function useLogSecurityAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      alertType: string;
      message: string;
      details?: Record<string, unknown>;
    }) => logSecurityAlert(params.alertType, params.message, params.details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUDIT_QUERY_KEYS.all });
    },
  });
}

// ============================================
// Utility Hooks
// ============================================

/**
 * Hook that provides all audit logging functions
 * Convenience hook for components that need multiple logging capabilities
 */
export function useAuditLogger() {
  const logEvent = useLogSecurityEvent();
  const logPHI = useLogPHIAccess();
  const logExport = useLogDataExport();
  const logAdmin = useLogAdminAction();
  const logAlert = useLogSecurityAlert();

  return {
    logEvent: logEvent.mutateAsync,
    logPHI: logPHI.mutateAsync,
    logExport: logExport.mutateAsync,
    logAdmin: logAdmin.mutateAsync,
    logAlert: logAlert.mutateAsync,
    isLogging:
      logEvent.isPending ||
      logPHI.isPending ||
      logExport.isPending ||
      logAdmin.isPending ||
      logAlert.isPending,
  };
}

// ============================================
// Type Exports
// ============================================

export type {
  SecurityEventType,
  SecuritySeverity,
  ResourceType,
  SecurityAuditEntry,
  AuditLogQueryOptions,
};
