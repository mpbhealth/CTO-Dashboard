// ============================================
// Notification System Types
// ============================================

export type NotificationType =
  | 'system_incident'
  | 'deployment_failed'
  | 'assignment'
  | 'project_update'
  | 'compliance_alert'
  | 'sla_breach'
  | 'ticket_escalation'
  | 'general';

export type NotificationPriority = 'critical' | 'high' | 'info';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string | null;
  data: NotificationData;
  read_at: string | null;
  dismissed_at: string | null;
  source_table: string | null;
  source_id: string | null;
  created_at: string;
}

export interface NotificationData {
  url?: string;
  actionLabel?: string;
  actionType?: 'navigate' | 'dismiss' | 'acknowledge';
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  critical_alerts: boolean;
  sla_breaches: boolean;
  system_incidents: boolean;
  assignments: boolean;
  project_updates: boolean;
  compliance_alerts: boolean;
  deployment_alerts: boolean;
  sound_enabled: boolean;
  dnd_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  critical_bypass_dnd: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPayload {
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body?: string;
  data?: NotificationData;
  source_table?: string;
  source_id?: string;
}

export type PermissionStatus = 'granted' | 'denied' | 'default';

export interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  criticalCount: number;
  permissionStatus: PermissionStatus;
  isLoading: boolean;
  preferences: NotificationPreferences | null;
  requestPermission: () => Promise<PermissionStatus>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  sendTestNotification: () => void;
}

// Notification icon mapping for UI
export const notificationTypeIcons: Record<NotificationType, string> = {
  system_incident: 'AlertTriangle',
  deployment_failed: 'XCircle',
  assignment: 'UserPlus',
  project_update: 'FolderKanban',
  compliance_alert: 'Shield',
  sla_breach: 'Clock',
  ticket_escalation: 'AlertOctagon',
  general: 'Bell',
};

// Priority color mapping
export const priorityColors: Record<NotificationPriority, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

