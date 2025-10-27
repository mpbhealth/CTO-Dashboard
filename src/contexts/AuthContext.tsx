import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type UserRole = 'ceo' | 'cto' | 'admin' | 'staff';

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
}

function setCookie(name: string, value: string, maxAge: number = 86400): void {
  try {
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; samesite=lax`;
    console.log(`[AuthContext] Cookie set: ${name}=${value}`);
  } catch (error) {
    console.error('[AuthContext] Failed to set cookie:', error);
  }
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
}

function verifyCookie(name: string, expectedValue: string): boolean {
  const actual = getCookie(name);
  return actual === expectedValue;
}

interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  display_name: string | null;
  org_id: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAX_PROFILE_FETCH_ATTEMPTS = 3;
const PROFILE_FETCH_TIMEOUT = 15000;
const CIRCUIT_BREAKER_RESET_TIME = 30000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingProfile = useRef(false);
  const profileCache = useRef<{ userId: string; profile: Profile; timestamp: number } | null>(null);
  const profileFetchAttempts = useRef(0);
  const circuitBreakerOpen = useRef(false);
  const circuitBreakerTimer = useRef<NodeJS.Timeout | null>(null);
  const CACHE_TTL = 5 * 60 * 1000;

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (circuitBreakerOpen.current) {
      console.warn('[AuthContext] Circuit breaker open, skipping profile fetch');
      return null;
    }

    if (fetchingProfile.current) {
      console.log('[AuthContext] Profile fetch already in progress, skipping');
      return null;
    }

    if (profileFetchAttempts.current >= MAX_PROFILE_FETCH_ATTEMPTS) {
      console.error('[AuthContext] Max profile fetch attempts exceeded');
      circuitBreakerOpen.current = true;
      circuitBreakerTimer.current = setTimeout(() => {
        console.log('[AuthContext] Resetting circuit breaker');
        circuitBreakerOpen.current = false;
        profileFetchAttempts.current = 0;
      }, CIRCUIT_BREAKER_RESET_TIME);
      return null;
    }

    const now = Date.now();
    if (profileCache.current &&
        profileCache.current.userId === userId &&
        now - profileCache.current.timestamp < CACHE_TTL) {
      console.log('[AuthContext] Returning cached profile');
      return profileCache.current.profile;
    }

    fetchingProfile.current = true;
    profileFetchAttempts.current++;

    try {
      console.log(`[AuthContext] Fetching profile for user (attempt ${profileFetchAttempts.current}/${MAX_PROFILE_FETCH_ATTEMPTS}):`, userId);

      const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) => {
        setTimeout(() => {
          console.warn('[AuthContext] Profile fetch timeout, attempting fallback...');
          resolve({ data: null, error: { message: 'Timeout' } });
        }, PROFILE_FETCH_TIMEOUT);
      });

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
        .then(result => result);

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        console.error('[AuthContext] Error fetching profile:', error);
        console.error('[AuthContext] Error details:', {
          message: error.message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint
        });
        return null;
      }

      if (data) {
        profileCache.current = { userId, profile: data as Profile, timestamp: now };
        profileFetchAttempts.current = 0;
        console.log('[AuthContext] Profile fetched successfully:', data);
      } else {
        console.warn('[AuthContext] No profile found for user:', userId);
      }

      return data as Profile | null;
    } catch (error) {
      console.error('[AuthContext] Exception during profile fetch:', error);
      if (error instanceof Error) {
        console.error('[AuthContext] Error message:', error.message);
        console.error('[AuthContext] Error stack:', error.stack);
      }
      return null;
    } finally {
      fetchingProfile.current = false;
    }
  }, []);

  const setProfileCookies = useCallback((profileData: Profile | null) => {
    if (profileData?.role) {
      setCookie('role', profileData.role);

      if (profileData.display_name) {
        setCookie('display_name', profileData.display_name);
      }

      setTimeout(() => {
        const roleVerified = verifyCookie('role', profileData.role);
        const isWebContainer = window.location.hostname.includes('webcontainer') ||
                               window.location.hostname.includes('stackblitz');

        if (!roleVerified && !isWebContainer) {
          console.warn('[AuthContext] Cookie verification failed for role, retrying...');
          setCookie('role', profileData.role);
        } else if (roleVerified) {
          console.log('[AuthContext] Role cookie set and verified:', profileData.role);
        }
      }, 100);
    }
  }, []);

  const clearProfileCookies = useCallback(() => {
    deleteCookie('role');
    deleteCookie('display_name');
    console.log('[AuthContext] Profile cookies cleared');
  }, []);

  const refreshRole = useCallback(async () => {
    if (fetchingProfile.current) {
      console.log('[AuthContext] Refresh already in progress, skipping');
      return;
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        const profileData = await fetchProfile(currentUser.id);
        if (profileData) {
          setProfile(profileData);
          setProfileCookies(profileData);
          console.log('[AuthContext] Role refreshed successfully');
        }
      } else {
        setProfile(null);
        clearProfileCookies();
      }
    } catch (error) {
      console.error('[AuthContext] Error refreshing role:', error);
    }
  }, [fetchProfile, setProfileCookies, clearProfileCookies]);

  const signOut = useCallback(async () => {
    console.log('[AuthContext] Signing out user');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    clearProfileCookies();
    profileCache.current = null;
  }, [clearProfileCookies]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('[AuthContext] Initializing authentication');
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;

        if (!mounted) return;

        setUser(currentUser);

        if (currentUser) {
          const cachedRole = getCookie('role');
          if (cachedRole) {
            const cachedDisplayName = getCookie('display_name');
            console.log('[AuthContext] Found cached role in cookie:', cachedRole);
            setProfile({
              id: '',
              user_id: currentUser.id,
              role: cachedRole as UserRole,
              display_name: cachedDisplayName,
              org_id: null,
            });
          }

          const profileData = await fetchProfile(currentUser.id);
          if (!mounted) return;

          if (profileData) {
            setProfile(profileData);
            setProfileCookies(profileData);
          }
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('[AuthContext] Error during initialization:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event);

      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        clearProfileCookies();
        profileCache.current = null;
        return;
      }

      if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        const profileData = await fetchProfile(currentUser.id);
        if (mounted && profileData) {
          setProfile(profileData);
          setProfileCookies(profileData);
        }
      } else if (!currentUser) {
        setProfile(null);
        clearProfileCookies();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (circuitBreakerTimer.current) {
        clearTimeout(circuitBreakerTimer.current);
      }
    };
  }, [fetchProfile, setProfileCookies, clearProfileCookies]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
        loading,
        signOut,
        refreshRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
