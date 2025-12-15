// ============================================
// Notification Provider
// React context for notification state management
// ============================================

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  isNotificationSupported,
  getPermissionStatus,
  requestNotificationPermission,
  showDesktopNotification,
  saveNotificationToDatabase,
  fetchNotificationPreferences,
  updateNotificationPreferences as updatePrefsService,
  fetchNotifications as fetchNotificationsService,
  markNotificationAsRead as markReadService,
  markAllNotificationsAsRead as markAllReadService,
  dismissNotification as dismissService,
  createNotificationPayload,
} from '../lib/notificationService';
import {
  initializeRealtimeNotifications,
  cleanupRealtimeNotifications,
} from '../lib/realtimeNotifications';
import type {
  Notification,
  NotificationPayload,
  NotificationPreferences,
  NotificationContextValue,
  PermissionStatus,
} from '../types/notifications';
import { logger } from '../lib/logger';

// Create context with undefined default
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Provider props
interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * NotificationProvider component
 * Provides notification state and methods to the entire app
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, profile, profileReady, isDemoMode } = useAuth();
  
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('default');
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs for cleanup
  const initializedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // Compute unread counts
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read_at).length,
    [notifications]
  );

  const criticalCount = useMemo(
    () => notifications.filter((n) => !n.read_at && n.priority === 'critical').length,
    [notifications]
  );

  /**
   * Handle incoming notification from realtime subscription
   */
  const handleRealtimeNotification = useCallback(
    async (payload: NotificationPayload) => {
      if (!user?.id) return;

      logger.log('Received realtime notification:', payload.title);

      // Save to database
      const notificationId = await saveNotificationToDatabase(user.id, payload);

      // Show desktop notification
      await showDesktopNotification(payload, preferences);

      // Add to local state
      if (notificationId) {
        const newNotification: Notification = {
          id: notificationId,
          user_id: user.id,
          type: payload.type,
          priority: payload.priority,
          title: payload.title,
          body: payload.body || null,
          data: payload.data || {},
          read_at: null,
          dismissed_at: null,
          source_table: payload.source_table || null,
          source_id: payload.source_id || null,
          created_at: new Date().toISOString(),
        };

        setNotifications((prev) => [newNotification, ...prev]);
      }
    },
    [user?.id, preferences]
  );

  /**
   * Initialize notifications when user is authenticated
   */
  useEffect(() => {
    if (!profileReady || !user?.id || initializedRef.current) {
      return;
    }

    // Track user ID for cleanup
    userIdRef.current = user.id;

    const initializeNotifications = async () => {
      setIsLoading(true);

      try {
        // Check notification permission
        if (isNotificationSupported()) {
          setPermissionStatus(getPermissionStatus());
        }

        // Fetch preferences
        const prefs = await fetchNotificationPreferences(user.id);
        setPreferences(prefs);

        // Fetch existing notifications
        const existingNotifications = await fetchNotificationsService(user.id);
        setNotifications(existingNotifications as Notification[]);

        // Get user role for realtime subscriptions
        const userRole = (profile?.role?.toLowerCase() || 'staff') as 'cto' | 'ceo' | 'admin' | 'staff';

        // Initialize realtime subscriptions (skip in demo mode)
        if (!isDemoMode) {
          initializeRealtimeNotifications(user.id, userRole, handleRealtimeNotification);
        }

        initializedRef.current = true;
      } catch (error) {
        logger.error('Error initializing notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeNotifications();

    // Cleanup on unmount or user change
    return () => {
      if (initializedRef.current) {
        cleanupRealtimeNotifications();
        initializedRef.current = false;
      }
    };
  }, [profileReady, user?.id, profile?.role, isDemoMode, handleRealtimeNotification]);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<PermissionStatus> => {
    const permission = await requestNotificationPermission();
    setPermissionStatus(permission);
    return permission;
  }, []);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (id: string): Promise<void> => {
    const success = await markReadService(id);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!user?.id) return;

    const success = await markAllReadService(user.id);
    if (success) {
      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => (n.read_at ? n : { ...n, read_at: now }))
      );
    }
  }, [user?.id]);

  /**
   * Dismiss a notification
   */
  const dismissNotification = useCallback(async (id: string): Promise<void> => {
    const success = await dismissService(id);
    if (success) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  }, []);

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>): Promise<void> => {
      if (!user?.id) return;

      const success = await updatePrefsService(user.id, updates);
      if (success) {
        setPreferences((prev) => (prev ? { ...prev, ...updates } : null));
      }
    },
    [user?.id]
  );

  /**
   * Send a test notification (for debugging/demo)
   */
  const sendTestNotification = useCallback(() => {
    const testPayload = createNotificationPayload(
      'general',
      'info',
      'Test Notification',
      'This is a test notification from the CTO Dashboard',
      undefined,
      undefined,
      (profile?.role?.toLowerCase() === 'ceo' ? 'ceo' : 'cto') as 'ceo' | 'cto'
    );

    handleRealtimeNotification(testPayload);
  }, [profile?.role, handleRealtimeNotification]);

  // Memoize context value
  const contextValue = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      criticalCount,
      permissionStatus,
      isLoading,
      preferences,
      requestPermission,
      markAsRead,
      markAllAsRead,
      dismissNotification,
      updatePreferences,
      sendTestNotification,
    }),
    [
      notifications,
      unreadCount,
      criticalCount,
      permissionStatus,
      isLoading,
      preferences,
      requestPermission,
      markAsRead,
      markAllAsRead,
      dismissNotification,
      updatePreferences,
      sendTestNotification,
    ]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access notification context
 */
export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
}

/**
 * Hook to check if notifications are available
 * Returns safe defaults if outside provider
 */
export function useNotificationsOptional(): NotificationContextValue | null {
  return useContext(NotificationContext) || null;
}

