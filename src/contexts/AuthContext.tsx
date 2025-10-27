import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type UserRole = 'ceo' | 'cto' | 'admin' | 'staff';

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

  const refreshRole = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (currentUser) {
      const profileData = await fetchProfile(currentUser.id);
      setProfile(profileData);

      if (profileData?.role) {
        document.cookie = `role=${profileData.role}; path=/; max-age=86400; samesite=lax`;
        if (profileData.display_name) {
          document.cookie = `display_name=${profileData.display_name}; path=/; max-age=86400; samesite=lax`;
        }
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    document.cookie = 'role=; path=/; max-age=0';
    document.cookie = 'display_name=; path=/; max-age=0';
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchProfile(currentUser.id).then((profileData) => {
          setProfile(profileData);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchProfile(currentUser.id).then((profileData) => {
          setProfile(profileData);

          if (profileData?.role) {
            document.cookie = `role=${profileData.role}; path=/; max-age=86400; samesite=lax`;
            if (profileData.display_name) {
              document.cookie = `display_name=${profileData.display_name}; path=/; max-age=86400; samesite=lax`;
            }
          }
        });
      } else {
        setProfile(null);
        document.cookie = 'role=; path=/; max-age=0';
        document.cookie = 'display_name=; path=/; max-age=0';
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
