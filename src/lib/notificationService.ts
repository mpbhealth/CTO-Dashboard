// ============================================
// Notification Service
// Handles browser notifications, permissions, and sound
// ============================================

import type {
  NotificationPayload,
  NotificationPreferences,
  PermissionStatus,
  NotificationPriority,
} from '../types/notifications';
import { supabase, isSupabaseConfigured } from './supabase';
import { logger } from './logger';

// Sound file path
const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';

// Audio instance for notification sounds
let audioInstance: HTMLAudioElement | null = null;

/**
 * Initialize the audio instance for notification sounds
 */
function getAudioInstance(): HTMLAudioElement {
  if (!audioInstance) {
    audioInstance = new Audio(NOTIFICATION_SOUND_URL);
    audioInstance.volume = 0.5;
  }
  return audioInstance;
}

/**
 * Check if notifications are supported in this browser
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getPermissionStatus(): PermissionStatus {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission as PermissionStatus;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<PermissionStatus> {
  if (!isNotificationSupported()) {
    logger.warn('Notifications not supported in this browser');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    logger.warn('Notification permission was previously denied');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    logger.log('Notification permission result:', permission);
    return permission as PermissionStatus;
  } catch (error) {
    logger.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Check if we're in Do Not Disturb mode
 */
export function isInDNDMode(preferences: NotificationPreferences | null): boolean {
  if (!preferences || !preferences.dnd_enabled) {
    return false;
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  // Parse quiet hours
  const [startHour, startMin] = preferences.quiet_hours_start.split(':').map(Number);
  const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startMinutes > endMinutes) {
    return currentTime >= startMinutes || currentTime < endMinutes;
  }
  
  return currentTime >= startMinutes && currentTime < endMinutes;
}

/**
 * Check if a notification should be shown based on preferences
 */
export function shouldShowNotification(
  payload: NotificationPayload,
  preferences: NotificationPreferences | null
): boolean {
  // If no preferences, show all notifications
  if (!preferences) {
    return true;
  }

  // Check DND mode
  if (isInDNDMode(preferences)) {
    // Critical notifications can bypass DND if configured
    if (payload.priority === 'critical' && preferences.critical_bypass_dnd) {
      return true;
    }
    return false;
  }

  // Check notification type preferences
  switch (payload.type) {
    case 'system_incident':
      return preferences.system_incidents;
    case 'deployment_failed':
      return preferences.deployment_alerts;
    case 'assignment':
      return preferences.assignments;
    case 'project_update':
      return preferences.project_updates;
    case 'compliance_alert':
      return preferences.compliance_alerts;
    case 'sla_breach':
      return preferences.sla_breaches;
    case 'ticket_escalation':
      return preferences.critical_alerts;
    default:
      return true;
  }
}

/**
 * Play notification sound
 */
export async function playNotificationSound(
  preferences: NotificationPreferences | null
): Promise<void> {
  // Check if sound is enabled
  if (preferences && !preferences.sound_enabled) {
    return;
  }

  // Check DND mode (unless critical bypass)
  if (isInDNDMode(preferences)) {
    return;
  }

  try {
    const audio = getAudioInstance();
    audio.currentTime = 0;
    await audio.play();
  } catch (error) {
    // Audio play can fail due to autoplay policies
    logger.warn('Could not play notification sound:', error);
  }
}

/**
 * Show a desktop notification
 */
export async function showDesktopNotification(
  payload: NotificationPayload,
  preferences: NotificationPreferences | null
): Promise<void> {
  // Check if we should show this notification
  if (!shouldShowNotification(payload, preferences)) {
    logger.log('Notification suppressed by preferences:', payload.type);
    return;
  }

  // Check permission
  if (getPermissionStatus() !== 'granted') {
    logger.warn('Cannot show notification - permission not granted');
    return;
  }

  // Play sound
  await playNotificationSound(preferences);

  // Try to show via service worker first (works when app is in background)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          title: payload.title,
          options: {
            body: payload.body,
            priority: payload.priority,
            data: payload.data,
            tag: `${payload.type}-${Date.now()}`,
          },
        },
      });
      return;
    } catch (error) {
      logger.warn('Service worker notification failed, falling back to direct:', error);
    }
  }

  // Fallback to direct notification
  try {
    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-32x32.svg',
      tag: `${payload.type}-${Date.now()}`,
      data: payload.data,
      requireInteraction: payload.priority === 'critical',
    });

    // Handle click
    notification.onclick = () => {
      window.focus();
      if (payload.data?.url) {
        window.location.href = payload.data.url;
      }
      notification.close();
    };
  } catch (error) {
    logger.error('Error showing notification:', error);
  }
}

/**
 * Save a notification to the database
 */
export async function saveNotificationToDatabase(
  userId: string,
  payload: NotificationPayload
): Promise<string | null> {
  if (!isSupabaseConfigured) {
    logger.warn('Supabase not configured - notification not saved');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: payload.type,
        priority: payload.priority,
        title: payload.title,
        body: payload.body || null,
        data: payload.data || {},
        source_table: payload.source_table || null,
        source_id: payload.source_id || null,
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return data?.id || null;
  } catch (error) {
    logger.error('Error saving notification to database:', error);
    return null;
  }
}

/**
 * Fetch user's notification preferences
 */
export async function fetchNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    return null;
  }
}

/**
 * Update user's notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  updates: Partial<NotificationPreferences>
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...updates,
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    return false;
  }
}

/**
 * Fetch user's notifications
 */
export async function fetchNotifications(
  userId: string,
  limit = 50
): Promise<Notification[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    return false;
  }
}

/**
 * Dismiss a notification (soft delete)
 */
export async function dismissNotification(
  notificationId: string
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    logger.error('Error dismissing notification:', error);
    return false;
  }
}

/**
 * Get the navigation URL for a notification type
 */
export function getNotificationUrl(
  type: string,
  sourceTable?: string,
  sourceId?: string,
  dashboardRole: 'cto' | 'ceo' = 'cto'
): string {
  const prefix = dashboardRole === 'ceo' ? '/ceod' : '/ctod';
  
  switch (type) {
    case 'system_incident':
      return `${prefix}/infrastructure/api-status`;
    case 'deployment_failed':
      return `${prefix}/infrastructure/deployments`;
    case 'assignment':
      return `${prefix}/development/assignments`;
    case 'project_update':
      return `${prefix}/development/projects`;
    case 'compliance_alert':
      return `${prefix}/compliance`;
    case 'sla_breach':
      return `${prefix}/operations/it-support`;
    case 'ticket_escalation':
      return `${prefix}/operations/it-support`;
    default:
      return `${prefix}/home`;
  }
}

/**
 * Create a notification payload from a database event
 */
export function createNotificationPayload(
  type: NotificationPayload['type'],
  priority: NotificationPriority,
  title: string,
  body?: string,
  sourceTable?: string,
  sourceId?: string,
  dashboardRole: 'cto' | 'ceo' = 'cto'
): NotificationPayload {
  return {
    type,
    priority,
    title,
    body,
    source_table: sourceTable,
    source_id: sourceId,
    data: {
      url: getNotificationUrl(type, sourceTable, sourceId, dashboardRole),
      actionType: 'navigate',
    },
  };
}

