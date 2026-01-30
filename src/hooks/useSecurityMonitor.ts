/**
 * Security Monitor Hook
 * 
 * React hooks for security monitoring, alerting, and threat level assessment.
 * Integrates with securityAlertService for SOC 2 and HIPAA compliance.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSecurityStatus,
  runSecurityCheck,
  getAlertRules,
  saveAlertRule,
  deleteAlertRule,
  toggleAlertRule,
  getAlertChannelConfig,
  saveAlertChannelConfig,
  calculateThreatLevel,
  type AlertRule,
  type SecurityMonitorStatus,
  type SecurityCheckResult,
  type AlertChannelConfig,
  type ThreatLevel,
} from '../lib/securityAlertService';

// ============================================
// Query Keys
// ============================================

const SECURITY_QUERY_KEYS = {
  all: ['security-monitor'] as const,
  status: () => [...SECURITY_QUERY_KEYS.all, 'status'] as const,
  rules: () => [...SECURITY_QUERY_KEYS.all, 'rules'] as const,
  channels: () => [...SECURITY_QUERY_KEYS.all, 'channels'] as const,
  threatLevel: () => [...SECURITY_QUERY_KEYS.all, 'threat-level'] as const,
};

// ============================================
// Status Hooks
// ============================================

/**
 * Hook to get security monitor status
 */
export function useSecurityStatus() {
  return useQuery({
    queryKey: SECURITY_QUERY_KEYS.status(),
    queryFn: getSecurityStatus,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}

/**
 * Hook to calculate and get current threat level
 */
export function useThreatLevel() {
  return useQuery({
    queryKey: SECURITY_QUERY_KEYS.threatLevel(),
    queryFn: calculateThreatLevel,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

/**
 * Hook to run a manual security check
 */
export function useSecurityCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rules?: AlertRule[]) => runSecurityCheck(rules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.status() });
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.threatLevel() });
    },
  });
}

// ============================================
// Alert Rules Hooks
// ============================================

/**
 * Hook to get alert rules
 */
export function useAlertRules() {
  return useQuery({
    queryKey: SECURITY_QUERY_KEYS.rules(),
    queryFn: getAlertRules,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to save an alert rule
 */
export function useSaveAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rule: AlertRule) => saveAlertRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.rules() });
    },
  });
}

/**
 * Hook to delete an alert rule
 */
export function useDeleteAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => deleteAlertRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.rules() });
    },
  });
}

/**
 * Hook to toggle an alert rule
 */
export function useToggleAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) =>
      toggleAlertRule(ruleId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.rules() });
    },
  });
}

// ============================================
// Channel Configuration Hooks
// ============================================

/**
 * Hook to get alert channel configuration
 */
export function useAlertChannelConfig() {
  return useQuery({
    queryKey: SECURITY_QUERY_KEYS.channels(),
    queryFn: getAlertChannelConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to save alert channel configuration
 */
export function useSaveAlertChannelConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: AlertChannelConfig) => saveAlertChannelConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.channels() });
    },
  });
}

// ============================================
// Combined Hooks
// ============================================

/**
 * Hook that provides comprehensive security monitoring data
 */
export function useSecurityDashboard() {
  const status = useSecurityStatus();
  const threatLevel = useThreatLevel();
  const rules = useAlertRules();
  const check = useSecurityCheck();

  return {
    status: status.data,
    threatLevel: threatLevel.data,
    rules: rules.data,
    isLoading: status.isLoading || threatLevel.isLoading || rules.isLoading,
    isError: status.isError || threatLevel.isError || rules.isError,
    runCheck: check.mutateAsync,
    isChecking: check.isPending,
    refetch: () => {
      status.refetch();
      threatLevel.refetch();
      rules.refetch();
    },
  };
}

// ============================================
// Type Exports
// ============================================

export type {
  AlertRule,
  SecurityMonitorStatus,
  SecurityCheckResult,
  AlertChannelConfig,
  ThreatLevel,
};
