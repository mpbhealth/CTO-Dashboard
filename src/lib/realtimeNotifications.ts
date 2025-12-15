// ============================================
// Realtime Notifications
// Supabase Realtime subscriptions for dashboard events
// ============================================

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { logger } from './logger';
import type { NotificationPayload, NotificationPriority } from '../types/notifications';

// Types for database events
type RealtimePayload<T> = {
  new: T;
  old: T | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
};

// Callback type for notification dispatch
type NotificationCallback = (payload: NotificationPayload) => void;

// Subscription configuration
interface SubscriptionConfig {
  table: string;
  event: 'INSERT' | 'UPDATE' | '*';
  filter?: string;
  handler: (payload: RealtimePayload<Record<string, unknown>>) => NotificationPayload | null;
}

/**
 * Create notification payload for API incidents
 */
function handleApiIncident(
  payload: RealtimePayload<Record<string, unknown>>
): NotificationPayload | null {
  const record = payload.new;
  if (!record) return null;

  const severity = record.severity as string;
  const priority: NotificationPriority = 
    severity === 'critical' ? 'critical' : 
    severity === 'warning' ? 'high' : 'info';

  const status = record.status as string;
  const isNew = payload.eventType === 'INSERT';
  const isResolved = status === 'resolved';

  if (isResolved) {
    return {
      type: 'system_incident',
      priority: 'info',
      title: 'Incident Resolved',
      body: `${record.title} has been resolved`,
      source_table: 'api_incidents',
      source_id: record.id as string,
      data: {
        url: '/ctod/infrastructure/api-status',
        actionType: 'navigate',
      },
    };
  }

  return {
    type: 'system_incident',
    priority,
    title: isNew ? 'New System Incident' : 'Incident Updated',
    body: record.title as string,
    source_table: 'api_incidents',
    source_id: record.id as string,
    data: {
      url: '/ctod/infrastructure/api-status',
      actionType: 'navigate',
    },
  };
}

/**
 * Create notification payload for failed deployments
 */
function handleDeploymentLog(
  payload: RealtimePayload<Record<string, unknown>>
): NotificationPayload | null {
  const record = payload.new;
  if (!record) return null;

  const status = record.status as string;
  
  // Only notify on failed deployments
  if (status !== 'Failed') {
    return null;
  }

  return {
    type: 'deployment_failed',
    priority: 'high',
    title: 'Deployment Failed',
    body: `${record.project} deployment to ${record.env} failed`,
    source_table: 'deployment_logs',
    source_id: record.id as string,
    data: {
      url: '/ctod/infrastructure/deployments',
      actionType: 'navigate',
    },
  };
}

/**
 * Create notification payload for assignments
 */
function handleAssignment(
  payload: RealtimePayload<Record<string, unknown>>
): NotificationPayload | null {
  const record = payload.new;
  if (!record) return null;

  const isNew = payload.eventType === 'INSERT';
  const priority = (record.priority as string)?.toLowerCase();
  const notificationPriority: NotificationPriority = 
    priority === 'high' ? 'high' : 'info';

  return {
    type: 'assignment',
    priority: notificationPriority,
    title: isNew ? 'New Assignment' : 'Assignment Updated',
    body: record.title as string,
    source_table: 'assignments',
    source_id: record.id as string,
    data: {
      url: '/ctod/development/assignments',
      actionType: 'navigate',
    },
  };
}

/**
 * Create notification payload for project updates
 */
function handleProject(
  payload: RealtimePayload<Record<string, unknown>>
): NotificationPayload | null {
  const newRecord = payload.new;
  const oldRecord = payload.old;
  if (!newRecord) return null;

  // Only notify on status changes
  if (oldRecord && oldRecord.status === newRecord.status) {
    return null;
  }

  const status = newRecord.status as string;
  let body = `${newRecord.name}`;
  
  if (status === 'Live') {
    body += ' is now live!';
  } else if (status === 'Building') {
    body += ' is now in development';
  } else {
    body += ` status changed to ${status}`;
  }

  return {
    type: 'project_update',
    priority: status === 'Live' ? 'high' : 'info',
    title: 'Project Update',
    body,
    source_table: 'projects',
    source_id: newRecord.id as string,
    data: {
      url: '/ctod/development/projects',
      actionType: 'navigate',
    },
  };
}

/**
 * Create notification payload for compliance incidents
 */
function handleComplianceIncident(
  payload: RealtimePayload<Record<string, unknown>>
): NotificationPayload | null {
  const record = payload.new;
  if (!record) return null;

  const severity = (record.severity as string)?.toLowerCase();
  const priority: NotificationPriority = 
    severity === 'critical' || severity === 'high' ? 'critical' : 
    severity === 'medium' ? 'high' : 'info';

  return {
    type: 'compliance_alert',
    priority,
    title: 'Compliance Incident',
    body: record.title as string,
    source_table: 'compliance_incidents',
    source_id: record.id as string,
    data: {
      url: '/ctod/compliance/incidents',
      actionType: 'navigate',
    },
  };
}

/**
 * Create notification payload for high-priority tickets
 */
function handleTicket(
  payload: RealtimePayload<Record<string, unknown>>
): NotificationPayload | null {
  const record = payload.new;
  if (!record) return null;

  const ticketPriority = (record.priority as string)?.toLowerCase();
  
  // Only notify on high/critical priority tickets
  if (ticketPriority !== 'high' && ticketPriority !== 'critical' && ticketPriority !== 'urgent') {
    return null;
  }

  const isNew = payload.eventType === 'INSERT';

  return {
    type: 'ticket_escalation',
    priority: 'high',
    title: isNew ? 'High Priority Ticket' : 'Ticket Escalated',
    body: record.title as string,
    source_table: 'tickets_cache',
    source_id: record.id as string,
    data: {
      url: '/ctod/operations/it-support',
      actionType: 'navigate',
    },
  };
}

// Subscription configurations for CTO dashboard
const ctoSubscriptions: SubscriptionConfig[] = [
  {
    table: 'api_incidents',
    event: '*',
    handler: handleApiIncident,
  },
  {
    table: 'deployment_logs',
    event: 'INSERT',
    handler: handleDeploymentLog,
  },
  {
    table: 'assignments',
    event: '*',
    handler: handleAssignment,
  },
  {
    table: 'projects',
    event: 'UPDATE',
    handler: handleProject,
  },
  {
    table: 'compliance_incidents',
    event: 'INSERT',
    handler: handleComplianceIncident,
  },
  {
    table: 'tickets_cache',
    event: '*',
    handler: handleTicket,
  },
];

// Subscription configurations for CEO dashboard (subset of CTO)
const ceoSubscriptions: SubscriptionConfig[] = [
  {
    table: 'api_incidents',
    event: '*',
    filter: 'severity=eq.critical',
    handler: handleApiIncident,
  },
  {
    table: 'compliance_incidents',
    event: 'INSERT',
    handler: handleComplianceIncident,
  },
];

/**
 * RealtimeNotificationManager class
 * Manages Supabase realtime subscriptions for notifications
 */
export class RealtimeNotificationManager {
  private channels: RealtimeChannel[] = [];
  private callback: NotificationCallback | null = null;
  private userId: string | null = null;
  private userRole: 'cto' | 'ceo' | 'admin' | 'staff' = 'staff';
  private isSubscribed = false;

  /**
   * Initialize the realtime notification manager
   */
  initialize(
    userId: string,
    userRole: 'cto' | 'ceo' | 'admin' | 'staff',
    callback: NotificationCallback
  ): void {
    this.userId = userId;
    this.userRole = userRole;
    this.callback = callback;

    if (!isSupabaseConfigured) {
      logger.warn('Supabase not configured - realtime notifications disabled');
      return;
    }

    this.subscribe();
  }

  /**
   * Subscribe to relevant database tables based on user role
   */
  private subscribe(): void {
    if (this.isSubscribed) {
      return;
    }

    // Determine which subscriptions to use based on role
    const subscriptions = this.getSubscriptionsForRole();

    subscriptions.forEach((config, index) => {
      const channelName = `notifications-${config.table}-${index}`;
      
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: config.event,
            schema: 'public',
            table: config.table,
            filter: config.filter,
          },
          (payload) => {
            this.handleDatabaseEvent(config, payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.log(`Subscribed to ${config.table} changes`);
          } else if (status === 'CHANNEL_ERROR') {
            logger.error(`Error subscribing to ${config.table}`);
          }
        });

      this.channels.push(channel);
    });

    this.isSubscribed = true;
    logger.log('Realtime notification subscriptions initialized');
  }

  /**
   * Get subscription configurations based on user role
   */
  private getSubscriptionsForRole(): SubscriptionConfig[] {
    switch (this.userRole) {
      case 'ceo':
        return ceoSubscriptions;
      case 'cto':
      case 'admin':
        return ctoSubscriptions;
      case 'staff':
        // Staff gets assignment notifications only
        return ctoSubscriptions.filter(s => s.table === 'assignments');
      default:
        return [];
    }
  }

  /**
   * Handle a database event and dispatch notification if applicable
   */
  private handleDatabaseEvent(
    config: SubscriptionConfig,
    payload: unknown
  ): void {
    try {
      const typedPayload = payload as RealtimePayload<Record<string, unknown>>;
      const notificationPayload = config.handler(typedPayload);

      if (notificationPayload && this.callback) {
        // Check if this notification is relevant to the current user
        // (e.g., assignment is assigned to them)
        if (this.isRelevantToUser(config.table, typedPayload.new)) {
          this.callback(notificationPayload);
        }
      }
    } catch (error) {
      logger.error('Error handling database event:', error);
    }
  }

  /**
   * Check if an event is relevant to the current user
   */
  private isRelevantToUser(
    table: string,
    record: Record<string, unknown> | null
  ): boolean {
    if (!record || !this.userId) {
      return true; // Default to showing if we can't determine
    }

    // For assignments, check if assigned to current user
    if (table === 'assignments') {
      const assignedTo = record.assigned_to as string;
      // Show if assigned to user or if user is admin/CTO
      if (this.userRole === 'admin' || this.userRole === 'cto') {
        return true;
      }
      return assignedTo === this.userId;
    }

    // For other tables, show to all CTO/admin users
    return this.userRole === 'cto' || this.userRole === 'admin' || this.userRole === 'ceo';
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribe(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels = [];
    this.isSubscribed = false;
    logger.log('Realtime notification subscriptions removed');
  }

  /**
   * Check if currently subscribed
   */
  isActive(): boolean {
    return this.isSubscribed;
  }
}

// Singleton instance
let managerInstance: RealtimeNotificationManager | null = null;

/**
 * Get or create the realtime notification manager instance
 */
export function getRealtimeNotificationManager(): RealtimeNotificationManager {
  if (!managerInstance) {
    managerInstance = new RealtimeNotificationManager();
  }
  return managerInstance;
}

/**
 * Initialize realtime notifications
 */
export function initializeRealtimeNotifications(
  userId: string,
  userRole: 'cto' | 'ceo' | 'admin' | 'staff',
  callback: NotificationCallback
): void {
  const manager = getRealtimeNotificationManager();
  manager.initialize(userId, userRole, callback);
}

/**
 * Cleanup realtime notifications
 */
export function cleanupRealtimeNotifications(): void {
  if (managerInstance) {
    managerInstance.unsubscribe();
  }
}

