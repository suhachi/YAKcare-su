import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase.client';

type YakRole = 'patient' | 'caregiver';

interface AuthContextValue {
  user: User | null;
  userId: string | null;
  role: YakRole | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<YakRole | null>(null);
  const [loading, setLoading] = useState(true);

  const extractRole = (target?: User | null): YakRole | null => {
    const metaRole = target?.user_metadata?.role;
    if (metaRole === 'patient' || metaRole === 'caregiver') {
      return metaRole;
    }
    return null;
  };

  const fetchUser = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('[AuthProvider] getUser error', error);
        setUser(null);
        setRole(null);
        return;
      }
      setUser(data.user ?? null);
      setRole(extractRole(data.user));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setRole(extractRole(nextUser));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userId: user?.id ?? null,
      role,
      loading,
      refreshUser: fetchUser,
    }),
    [user, role, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
}

