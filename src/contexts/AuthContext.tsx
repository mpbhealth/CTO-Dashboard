import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logger } from '../lib/logger';
import { logLogin, logLoginFailed, logLogout, logSecurityEvent } from '../lib/auditService';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  display_name?: string;
  role?: string;
  org_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Session timeout configuration for HIPAA compliance
 */
interface SessionTimeoutConfig {
  /** Inactivity timeout in minutes (default: 15 for PHI access) */
  timeoutMinutes: number;
  /** Warning before logout in seconds (default: 60) */
  warningSeconds: number;
  /** Enable session timeout (default: true) */
  enabled: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileReady: boolean;
  isDemoMode: boolean;
  /** Session timeout configuration */
  sessionTimeout: SessionTimeoutConfig;
  /** Time remaining before session timeout (in seconds, null if not close to timeout) */
  timeoutWarning: number | null;
  /** Last activity timestamp */
  lastActivity: Date | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** Reset activity timer (call on user interaction) */
  resetActivityTimer: () => void;
  /** Dismiss timeout warning and extend session */
  extendSession: () => void;
  /** Update session timeout configuration */
  updateSessionTimeoutConfig: (config: Partial<SessionTimeoutConfig>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_CACHE_KEY = 'mpb_profile_cache';
const PROFILE_CACHE_TTL = 5 * 60 * 1000;
const DEMO_MODE_KEY = 'mpb_demo_mode';
const DEMO_ROLE_KEY = 'mpb_demo_role';
const SESSION_TIMEOUT_CONFIG_KEY = 'mpb_session_timeout_config';

/**
 * Default session timeout configuration for HIPAA compliance
 * 15 minute inactivity timeout is standard for PHI access
 */
const DEFAULT_SESSION_TIMEOUT_CONFIG: SessionTimeoutConfig = {
  timeoutMinutes: 15,
  warningSeconds: 60,
  enabled: true,
};

/**
 * Activity events to track for session timeout
 */
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
] as const;

function getDemoRoleFromQuery(): 'ceo' | 'cto' | null {
  const params = new URLSearchParams(window.location.search);
  const role = params.get('demo_role');
  if (role === 'ceo' || role === 'cto') {
    return role;
  }
  return null;
}

function createDemoProfile(role: 'ceo' | 'cto'): Profile {
  const demoId = `demo-${role}-${Date.now()}`;
  return {
    id: demoId,
    email: `demo-${role}@mpbhealth.com`,
    full_name: role === 'ceo' ? 'Demo CEO User' : 'Demo CTO User',
    display_name: role === 'ceo' ? 'Demo CEO' : 'Demo CTO',
    role: role,
    org_id: 'demo-org-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function createDemoUser(role: 'ceo' | 'cto'): Partial<User> {
  return {
    id: `demo-user-${role}`,
    email: `demo-${role}@mpbhealth.com`,
    created_at: new Date().toISOString(),
    app_metadata: { role },
    user_metadata: { role, full_name: role === 'ceo' ? 'Demo CEO' : 'Demo CTO' },
    aud: 'authenticated',
    role: 'authenticated'
  } as User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Session timeout state
  const [sessionTimeout, setSessionTimeout] = useState<SessionTimeoutConfig>(() => {
    try {
      const saved = localStorage.getItem(SESSION_TIMEOUT_CONFIG_KEY);
      if (saved) {
        return { ...DEFAULT_SESSION_TIMEOUT_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_SESSION_TIMEOUT_CONFIG;
  });
  const [timeoutWarning, setTimeoutWarning] = useState<number | null>(null);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  const profileCache = useRef<Map<string, Profile>>(new Map());
  const fetchingRef = useRef<string | null>(null);
  const initializingRef = useRef(false);
  const authCompletedRef = useRef(false);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const loadCachedProfile = useCallback((userId: string): Profile | null => {
    try {
      const cached = localStorage.getItem(`${PROFILE_CACHE_KEY}_${userId}`);
      if (cached) {
        const { profile, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < PROFILE_CACHE_TTL) {
          return profile;
        }
        localStorage.removeItem(`${PROFILE_CACHE_KEY}_${userId}`);
      }
    } catch (error) {
      logger.error('Error loading cached profile', error);
    }
    return null;
  }, []);

  const saveCachedProfile = useCallback((userId: string, profile: Profile) => {
    try {
      localStorage.setItem(
        `${PROFILE_CACHE_KEY}_${userId}`,
        JSON.stringify({ profile, timestamp: Date.now() })
      );
    } catch (error) {
      logger.error('Error saving cached profile', error);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string, skipCache = false, retryCount = 0) => {
    if (fetchingRef.current === userId && !skipCache) {
      return;
    }

    if (!skipCache) {
      const memCached = profileCache.current.get(userId);
      if (memCached) {
        setProfile(memCached);
        setProfileReady(true);
        return;
      }

      const diskCached = loadCachedProfile(userId);
      if (diskCached) {
        setProfile(diskCached);
        profileCache.current.set(userId, diskCached);
        setProfileReady(true);
        return;
      }
    }

    fetchingRef.current = userId;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Try to find profile by user_id first (correct column)
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
        .abortSignal(controller.signal);

      // If not found by user_id, try by id (some old migrations used id instead of user_id)
      if (!data && !error) {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      clearTimeout(timeoutId);

      if (error) {
        if (error.name === 'AbortError') {
          logger.error('Profile fetch timeout - using cached or default data');
          throw new Error('Profile fetch timeout');
        }

        if (error.code === '403' || error.message?.includes('403')) {
          if (retryCount < 2) {
            logger.warn(`Auth 403 error, retrying... (attempt ${retryCount + 1})`);
            fetchingRef.current = null;
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return fetchProfile(userId, skipCache, retryCount + 1);
          }
        }

        throw error;
      }

      if (data) {
        setProfile(data);
        profileCache.current.set(userId, data);
        saveCachedProfile(userId, data);
        setProfileReady(true);
      } else {
        setProfile(null);
        setProfileReady(true);
      }
    } catch (error) {
      logger.error('Error fetching profile', error);
      const diskCached = loadCachedProfile(userId);
      if (diskCached) {
        logger.warn('Using cached profile after fetch error');
        setProfile(diskCached);
        profileCache.current.set(userId, diskCached);
      } else {
        setProfile(null);
      }
      setProfileReady(true);
    } finally {
      fetchingRef.current = null;
    }
  }, [loadCachedProfile, saveCachedProfile]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      profileCache.current.delete(user.id);
      try {
        localStorage.removeItem(`${PROFILE_CACHE_KEY}_${user.id}`);
      } catch (error) {
        logger.error('Error clearing cached profile', error);
      }
      await fetchProfile(user.id, true);
    }
  }, [user?.id, fetchProfile]);

  // ============================================
  // Session Timeout Functions (HIPAA Compliance)
  // ============================================

  /**
   * Handle session timeout - log out user due to inactivity
   */
  const handleSessionTimeout = useCallback(async () => {
    if (!user || isDemoMode) return;
    
    logger.warn('Session timeout due to inactivity');
    
    // Log the session timeout event
    await logLogout(user.id, user.email || '', 'session_timeout');
    await logSecurityEvent('SESSION_EXPIRED', 'Session expired due to inactivity', {
      resourceType: 'session',
      details: {
        inactivityMinutes: sessionTimeout.timeoutMinutes,
        userId: user.id,
      },
    });
    
    // Clear timeout warning
    setTimeoutWarning(null);
    
    // Sign out the user
    await supabase.auth.signOut();
    setProfile(null);
    setProfileReady(false);
    profileCache.current.clear();
  }, [user, isDemoMode, sessionTimeout.timeoutMinutes]);

  /**
   * Start the warning countdown before timeout
   */
  const startWarningCountdown = useCallback(() => {
    if (!sessionTimeout.enabled || !user || isDemoMode) return;
    
    let secondsRemaining = sessionTimeout.warningSeconds;
    setTimeoutWarning(secondsRemaining);
    
    warningTimerRef.current = setInterval(() => {
      secondsRemaining -= 1;
      setTimeoutWarning(secondsRemaining);
      
      if (secondsRemaining <= 0) {
        if (warningTimerRef.current) {
          clearInterval(warningTimerRef.current);
          warningTimerRef.current = null;
        }
        handleSessionTimeout();
      }
    }, 1000);
  }, [sessionTimeout.enabled, sessionTimeout.warningSeconds, user, isDemoMode, handleSessionTimeout]);

  /**
   * Reset the activity timer
   */
  const resetActivityTimer = useCallback(() => {
    if (!sessionTimeout.enabled || !user || isDemoMode) return;
    
    const now = Date.now();
    lastActivityRef.current = now;
    setLastActivity(new Date(now));
    
    // Clear any existing timers
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
      activityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearInterval(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    
    // Clear warning if user is active
    setTimeoutWarning(null);
    
    // Calculate time until warning should start
    const timeUntilWarning = (sessionTimeout.timeoutMinutes * 60 - sessionTimeout.warningSeconds) * 1000;
    
    // Set timer for warning
    activityTimerRef.current = setTimeout(() => {
      startWarningCountdown();
    }, timeUntilWarning);
  }, [sessionTimeout.enabled, sessionTimeout.timeoutMinutes, sessionTimeout.warningSeconds, user, isDemoMode, startWarningCountdown]);

  /**
   * Extend the session (dismiss warning and reset timer)
   */
  const extendSession = useCallback(() => {
    logger.log('Session extended by user');
    resetActivityTimer();
  }, [resetActivityTimer]);

  /**
   * Update session timeout configuration
   */
  const updateSessionTimeoutConfig = useCallback((config: Partial<SessionTimeoutConfig>) => {
    setSessionTimeout(prev => {
      const newConfig = { ...prev, ...config };
      try {
        localStorage.setItem(SESSION_TIMEOUT_CONFIG_KEY, JSON.stringify(newConfig));
      } catch {
        // Ignore storage errors
      }
      return newConfig;
    });
  }, []);

  // Set up activity event listeners for session timeout
  useEffect(() => {
    if (!sessionTimeout.enabled || !user || isDemoMode) {
      return;
    }

    // Throttled activity handler
    let lastEventTime = 0;
    const throttleMs = 5000; // Only register activity every 5 seconds
    
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastEventTime > throttleMs) {
        lastEventTime = now;
        resetActivityTimer();
      }
    };

    // Add event listeners
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize the timer
    resetActivityTimer();

    return () => {
      // Remove event listeners
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      
      // Clear timers
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
        activityTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearInterval(warningTimerRef.current);
        warningTimerRef.current = null;
      }
    };
  }, [sessionTimeout.enabled, user, isDemoMode, resetActivityTimer]);

  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    const queryRole = getDemoRoleFromQuery();
    const _savedDemoMode = localStorage.getItem(DEMO_MODE_KEY) === 'true';
    const savedDemoRole = localStorage.getItem(DEMO_ROLE_KEY) as 'ceo' | 'cto' | null;

    if (queryRole) {
      localStorage.setItem(DEMO_MODE_KEY, 'true');
      localStorage.setItem(DEMO_ROLE_KEY, queryRole);
    }

    const shouldUseDemoMode = !isSupabaseConfigured || queryRole;

    if (shouldUseDemoMode) {
      const demoRole = queryRole || savedDemoRole || 'cto';
      setIsDemoMode(true);
      const demoUser = createDemoUser(demoRole);
      const demoProfile = createDemoProfile(demoRole);

      setUser(demoUser as User);
      setProfile(demoProfile);
      setProfileReady(true);
      setLoading(false);

      logger.warn(`Running in DEMO MODE as ${demoRole.toUpperCase()}`);
      return;
    }

    // Reset auth completed flag
    authCompletedRef.current = false;

    const loadingTimeout = setTimeout(() => {
      // Use ref to check if auth completed, not the stale closure value
      if (!authCompletedRef.current) {
        logger.warn('Auth is taking longer than expected - checking network connection...');
        // Only show error after 15s total
        setTimeout(() => {
          if (!authCompletedRef.current) {
            logger.error('Auth timeout - check your network connection or Supabase status');
            setLoading(false);
            setProfileReady(true);
          }
        }, 5000);
      }
    }, 10000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      authCompletedRef.current = true;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        const cachedProfile = loadCachedProfile(session.user.id);
        if (cachedProfile) {
          setProfile(cachedProfile);
          profileCache.current.set(session.user.id, cachedProfile);
          setProfileReady(true);
          setLoading(false);
        }
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setProfileReady(true);
      }
      setLoading(false);
    }).catch((error) => {
      authCompletedRef.current = true;
      logger.error('Error getting session', error);
      setProfile(null);
      setProfileReady(true);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        const cachedProfile = loadCachedProfile(session.user.id);
        if (cachedProfile) {
          setProfile(cachedProfile);
          profileCache.current.set(session.user.id, cachedProfile);
          setProfileReady(true);
        }
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setProfileReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, [fetchProfile, loadCachedProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    logger.log('Attempting sign in...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Sign in failed:', {
        message: error.message,
        status: error.status,
        code: error.code,
        name: error.name,
      });
      
      // Log failed login attempt for security auditing
      await logLoginFailed(email, error.message || 'Unknown error');
      
      throw error;
    }

    logger.log('Sign in successful, updating state and fetching profile...');
    if (data.user && data.session) {
      // Log successful login for security auditing
      await logLogin(data.user.id, email, 'password');
      
      // Immediately update user and session state - don't wait for onAuthStateChange
      setUser(data.user);
      setSession(data.session);
      // Fetch profile and wait for it to complete
      await fetchProfile(data.user.id, true); // skipCache to ensure fresh data
      
      // Initialize activity timer for session timeout
      setLastActivity(new Date());
    }
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (data.user) {
      await fetchProfile(data.user.id);
    }
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    // Clear session timeout timers first (always do this)
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
      activityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearInterval(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    setTimeoutWarning(null);
    setLastActivity(null);

    if (isDemoMode) {
      localStorage.removeItem(DEMO_MODE_KEY);
      localStorage.removeItem(DEMO_ROLE_KEY);
      setProfile(null);
      setUser(null);
      setProfileReady(false);
      setIsDemoMode(false);
      window.location.href = '/login';
      return;
    }

    // Log logout for security auditing - non-blocking to prevent logout failures
    if (user) {
      logLogout(user.id, user.email || '', 'user_initiated').catch((err) => {
        logger.warn('Failed to log logout event:', err);
      });
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('Supabase signOut error:', error);
        // Continue with cleanup even if Supabase signOut fails
      }
    } catch (err) {
      logger.error('Error during Supabase signOut:', err);
      // Continue with cleanup
    }

    // Always clear local state
    setProfile(null);
    setUser(null);
    setProfileReady(false);
    profileCache.current.clear();
    
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(PROFILE_CACHE_KEY))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      logger.error('Error clearing profile cache', error);
    }

    // Navigate to login page
    window.location.href = '/login';
  }, [isDemoMode, user]);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (isDemoMode) {
      throw new Error('Password cannot be changed in demo mode');
    }

    if (!user?.email) {
      throw new Error('No user email found');
    }

    // Re-authenticate with current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw updateError;
    }

    // Log password change for security auditing
    await logSecurityEvent('PASSWORD_CHANGE', 'User changed their password', {
      resourceType: 'user',
      resourceId: user.id,
    });

    logger.log('Password updated successfully');
  }, [isDemoMode, user?.email, user?.id]);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    profileReady,
    isDemoMode,
    sessionTimeout,
    timeoutWarning,
    lastActivity,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updatePassword,
    resetActivityTimer,
    extendSession,
    updateSessionTimeoutConfig,
  }), [
    user,
    session,
    profile,
    loading,
    profileReady,
    isDemoMode,
    sessionTimeout,
    timeoutWarning,
    lastActivity,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updatePassword,
    resetActivityTimer,
    extendSession,
    updateSessionTimeoutConfig,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
