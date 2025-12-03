import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logger } from '../lib/logger';

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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileReady: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_CACHE_KEY = 'mpb_profile_cache';
const PROFILE_CACHE_TTL = 5 * 60 * 1000;
const DEMO_MODE_KEY = 'mpb_demo_mode';
const DEMO_ROLE_KEY = 'mpb_demo_role';

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

  const profileCache = useRef<Map<string, Profile>>(new Map());
  const fetchingRef = useRef<string | null>(null);
  const initializingRef = useRef(false);
  const authCompletedRef = useRef(false);

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
    if (fetchingRef.current === userId) {
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

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
        .abortSignal(controller.signal);

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

  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    const queryRole = getDemoRoleFromQuery();
    const savedDemoMode = localStorage.getItem(DEMO_MODE_KEY) === 'true';
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
      throw error;
    }

    logger.log('Sign in successful, fetching profile...');
    if (data.user) {
      await fetchProfile(data.user.id);
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
    if (isDemoMode) {
      localStorage.removeItem(DEMO_MODE_KEY);
      localStorage.removeItem(DEMO_ROLE_KEY);
      setProfile(null);
      setUser(null);
      setProfileReady(false);
      setIsDemoMode(false);
      window.location.href = '/';
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setProfileReady(false);
    profileCache.current.clear();
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(PROFILE_CACHE_KEY))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      logger.error('Error clearing profile cache', error);
    }
  }, [isDemoMode]);

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

    logger.log('Password updated successfully');
  }, [isDemoMode, user?.email]);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    profileReady,
    isDemoMode,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updatePassword,
  }), [user, session, profile, loading, profileReady, isDemoMode, signIn, signUp, signOut, refreshProfile, updatePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
