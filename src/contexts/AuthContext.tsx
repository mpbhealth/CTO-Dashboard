import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_CACHE_KEY = 'mpb_profile_cache';
const PROFILE_CACHE_TTL = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);

  const profileCache = useRef<Map<string, Profile>>(new Map());
  const fetchingRef = useRef<string | null>(null);
  const initializingRef = useRef(false);

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

  const fetchProfile = useCallback(async (userId: string, skipCache = false) => {
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

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
      setProfile(null);
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

    supabase.auth.getSession().then(({ data: { session } }) => {
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
        setProfileReady(true);
      }
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

    return () => subscription.unsubscribe();
  }, [fetchProfile, loadCachedProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
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
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    profileReady,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }), [user, session, profile, loading, profileReady, signIn, signUp, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
