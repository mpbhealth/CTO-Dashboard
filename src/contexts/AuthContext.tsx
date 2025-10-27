import React, { createContext, useContext, useEffect, useState } from 'react';
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
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; samesite=lax`;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile | null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const setProfileCookies = (profileData: Profile | null) => {
    if (profileData?.role) {
      setCookie('role', profileData.role);
      if (profileData.display_name) {
        setCookie('display_name', profileData.display_name);
      }
    }
  };

  const clearProfileCookies = () => {
    deleteCookie('role');
    deleteCookie('display_name');
  };

  const refreshRole = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (currentUser) {
      const profileData = await fetchProfile(currentUser.id);
      setProfile(profileData);
      setProfileCookies(profileData);
    } else {
      setProfile(null);
      clearProfileCookies();
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    clearProfileCookies();
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const cachedRole = getCookie('role');
        if (cachedRole) {
          const cachedDisplayName = getCookie('display_name');
          setProfile({
            id: '',
            user_id: currentUser.id,
            role: cachedRole as UserRole,
            display_name: cachedDisplayName,
            org_id: null,
          });
        }

        const profileData = await fetchProfile(currentUser.id);
        setProfile(profileData);
        setProfileCookies(profileData);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchProfile(currentUser.id).then((profileData) => {
          setProfile(profileData);
          setProfileCookies(profileData);
        });
      } else {
        setProfile(null);
        clearProfileCookies();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
